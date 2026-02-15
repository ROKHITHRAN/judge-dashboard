import { useState, useEffect } from "react";
import { Search, Eye, ArrowLeft } from "lucide-react";
import { caseService } from "../services/case.service";
import { evidenceService } from "../services/evidence.service";
import { logService } from "../services/log.service";
import {
  Case,
  Evidence,
  AccessLog,
  ApiError,
  EvidenceHistory,
  EvidenceType,
} from "../types";
import { fileService } from "../services/file.service";
import { Modal } from "./Modal";

export const Cases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [caseEvidence, setCaseEvidence] = useState<Evidence[]>([]);
  const [caseLogs, setCaseLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "logs">(
    "overview",
  );
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [evidenceHistory, setEvidenceHistory] = useState<EvidenceHistory[]>([]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoading(true);

      const response = await caseService.getAllCases();
      setCases(response);
      setError("");
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaseDetails = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    setActiveTab("overview");

    try {
      const [evidence, logs] = await Promise.all([
        evidenceService.getEvidenceByCase(caseItem.id),
        logService.getLogsByCase(caseItem.id),
      ]);

      setCaseEvidence(evidence);
      setCaseLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    }
  };

  const handleDownloadEvidenceFile = async (
    ipfsHash: string,
    fallbackName = "evidence",
  ) => {
    try {
      if (isDownloading) return;

      setIsDownloading(true);

      const response = await fileService.downloadFile(ipfsHash);

      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      const blob = new Blob([response.data], { type: contentType });

      // 🔥 Determine extension automatically
      const extension = contentType.split("/")[1] || "bin";

      const fileName = `${fallbackName}.${extension}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || "File download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const loadEvidenceHistory = async (evidenceId: string) => {
    if (!selectedCase || isViewing) return;
    try {
      setIsViewing(true);
      const history = await evidenceService.getEvidenceHistory(
        selectedCase.id,
        evidenceId,
      );
      setEvidenceHistory(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsViewing(false);
    }
  };
  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      MEDIUM:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      IN_PROGRESS:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      CLOSED:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      ARCHIVED:
        "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
    };
    return colors[status as keyof typeof colors] || colors.OPEN;
  };

  const filteredCases =
    cases.length > 0
      ? cases.filter((c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [];

  if (selectedCase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCase(null)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <ArrowLeft size={20} />
            Back to Cases
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCase.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Case #{selectedCase.id}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedCase.priority)}`}
              >
                {selectedCase.priority}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCase.status)}`}
              >
                {selectedCase.status}
              </span>
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex gap-4">
              {["overview", "evidence", "logs"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedCase.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Created At
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedCase.timestamp!).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Location
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCase.location}
                  </p>
                </div>
                {selectedCase.policeName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Assigned Officer
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCase.policeName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-4">
              {caseEvidence.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No evidence found
                </p>
              ) : (
                <div className="space-y-3">
                  {caseEvidence.map((evidence) => (
                    <div
                      key={evidence.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {EvidenceType[Number(evidence.eType)]}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {evidence.description}
                          </p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                            Collected At:{" "}
                            {new Date(evidence.collectedAt).toLocaleString()}
                          </p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                            Found At: {evidence.locationFound}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex flex-col gap-2 w-28">
                            <button
                              onClick={() => loadEvidenceHistory(evidence.id)}
                              disabled={isViewing}
                              className={`w-full flex items-center justify-center gap-2 text-xs py-1 rounded transition-all duration-200
                              ${
                                isViewing
                                  ? "bg-orange-200 dark:bg-orange-900/50 text-orange-500 cursor-not-allowed"
                                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-red-900/50"
                              }
                            `}
                            >
                              {isViewing ? (
                                <>
                                  <svg
                                    className="animate-spin h-3 w-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v8z"
                                    />
                                  </svg>
                                  Loading...
                                </>
                              ) : (
                                "View History"
                              )}{" "}
                            </button>
                            {evidence.ipfsHash && (
                              <button
                                onClick={() =>
                                  handleDownloadEvidenceFile(evidence.ipfsHash!)
                                }
                                className={`w-full flex items-center justify-center gap-2 text-xs py-1 rounded transition-all duration-200
                              ${
                                isDownloading
                                  ? "bg-green-200 dark:bg-green-900/50 text-green-500 cursor-not-allowed"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                              }
                            `}
                              >
                                {isDownloading ? (
                                  <>
                                    <svg
                                      className="animate-spin h-3 w-3"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                      />
                                    </svg>
                                    Loading...
                                  </>
                                ) : (
                                  "Download"
                                )}{" "}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* View History */}
                  <Modal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    title="Evidence History"
                    size="lg"
                  >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      {evidenceHistory.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                          No history found
                        </p>
                      ) : (
                        evidenceHistory.map((history) => (
                          <div
                            key={history.id}
                            className="relative rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 p-5"
                          >
                            {/* Timeline Dot */}
                            <div className="absolute -left-0 top-6 w-3 h-3 bg-blue-500 rounded-full shadow" />

                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-semibold text-primary dark:text-white">
                                  Evidence Version {history.version}
                                </p>
                                <p className="text-sm font-semibold text-primary dark:text-white">
                                  Action : {Actions[history.action]}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-white">
                                  Performed by {history.performedByName}
                                </p>
                              </div>

                              <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground dark:text-white">
                                {new Date(
                                  Number(history.timestamp) * 1000,
                                ).toLocaleString()}
                              </span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-border my-3" />

                            {/* Content Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground dark:text-white">
                                  Description
                                </p>
                                <p className="text-foreground leading-relaxed dark:text-white">
                                  {history.description}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground dark:text-white">
                                  Evidence Type
                                </p>
                                <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md">
                                  {history.eType}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground dark:text-white">
                                  Location Found
                                </p>
                                <p className="text-foreground dark:text-white">
                                  {history.locationFound}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Modal>
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-4">
              {caseLogs.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No logs found
                </p>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {caseLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-r"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {log.action}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {log.performedByName} ({log.performedByRole})
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Cases
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading cases...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No cases found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {caseItem.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    #{caseItem.id}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}
                >
                  {caseItem.priority}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {caseItem.description}
              </p>
              <div className="flex justify-between items-center mt-auto">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}
                >
                  {caseItem.status}
                </span>
                <button
                  onClick={() => loadCaseDetails(caseItem)}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const Actions = ["READ", "CREATE", "UPDATE", "DELETE"];
