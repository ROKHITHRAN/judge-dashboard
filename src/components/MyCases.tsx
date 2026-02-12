import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { caseService } from "../services/case.service";
import { evidenceService } from "../services/evidence.service";
import { logService } from "../services/log.service";
import {
  Case,
  CreateCaseRequest,
  UpdateCaseRequest,
  Evidence,
  AccessLog,
  ApiError,
  UpdateEvidenceRequest,
  EvidenceHistory,
  Officer,
  User,
} from "../types";
import { Modal } from "./Modal";
import { useAuth } from "../context/AuthContext";
import { fileService } from "../services/file.service";

export const MyCases = () => {
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
  const [isCreating, setIsCreating] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateEvidenceModalOpen, setIsCreateEvidenceModalOpen] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newEvidence, setNewEvidence] = useState<{
    eType: number;
    description: string;
    collectedAt: string;
    locationFound?: string;
    file?: File;
  }>({
    eType: 0,
    description: "",
    collectedAt: new Date().toISOString().slice(0, 16),
    locationFound: "",
  });
  const [newCase, setNewCase] = useState<CreateCaseRequest>({
    title: "",
    description: "",
    priority: "MEDIUM",
    caseType: 1,
    location: "Chennai",
    status: "OPEN",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const [editCase, setEditCase] = useState<UpdateCaseRequest>({});

  //Evidence
  const [isEditEvidenceModalOpen, setIsEditEvidenceModalOpen] = useState(false);
  const [editEvidence, setEditEvidence] = useState<UpdateEvidenceRequest>({});
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(
    null,
  );

  //History
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [evidenceHistory, setEvidenceHistory] = useState<EvidenceHistory[]>([]);

  //Officers
  const [officers, setOfficers] = useState<Officer[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoading(true);

      const response = await caseService.getAllCases();
      const allCases = response; // IMPORTANT

      const userUid = user?.uid; // from AuthContext

      if (!userUid) {
        setCases([]);
        return;
      }

      const filteredCases = allCases.filter(
        (c: Case) =>
          Array.isArray(c.assignedPoliceUids) &&
          c.assignedPoliceUids.includes(userUid),
      );

      setCases(filteredCases);
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

  const handleCreateCase = async () => {
    if (isCreating) return; // prevent double click

    try {
      setIsCreating(true);

      const payload = {
        ...newCase,
        policeName: user!.userName,
        detailsHash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      };

      await caseService.createCase(payload);

      // ✅ success
      setIsCreateModalOpen(false);
      setNewCase({
        title: "",
        description: "",
        priority: "MEDIUM",
        caseType: 1,
        location: "Chennai",
        status: "OPEN",
      });

      loadCases();
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCase = async () => {
    if (!selectedCase || isEditing) return;
    try {
      setIsEditing(true);
      await caseService.updateCase(selectedCase.id, editCase);
      setIsEditModalOpen(false);
      setEditCase({});
      loadCases();
      if (selectedCase) {
        const updated = await caseService.getCaseById(selectedCase.id);
        setSelectedCase(updated);
      }
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsEditing(true);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (isDeleting) return;

    if (!confirm("Are you sure you want to delete this case?")) return;
    try {
      setIsDeleting(true);
      await caseService.deleteCase(caseId);
      loadCases();
      setSelectedCase(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleAssignPolice = async () => {
  //   if (!selectedCase) return;
  //   try {
  //     await caseService.assignPolice(selectedCase.id, {
  //       officerId: assignOfficerId,
  //     });
  //     setIsAssignModalOpen(false);
  //     setAssignOfficerId("");
  //     loadCases();
  //     const updated = await caseService.getCaseById(selectedCase.id);
  //     setSelectedCase(updated);
  //   } catch (err) {
  //     const error = err as ApiError;
  //     setError(error.message);
  //   }
  // };

  const handleAssignPolice = async (walletAddress: string) => {
    if (!selectedCase || isAssigning) return;

    try {
      await caseService.assignPolice(selectedCase.id, {
        policeAddress: walletAddress,
      });

      setIsAssignModalOpen(false);

      loadCases();

      const updated = await caseService.getCaseById(selectedCase.id);
      setSelectedCase(updated);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateEvidence = async () => {
    if (!selectedCase?.id || isCreating) return;

    try {
      setIsCreating(true);

      let ipfsHash = "";
      let fileHash = "";

      // 1️⃣ Upload file if present
      if (newEvidence.file) {
        const uploadRes = await fileService.uploadFile(newEvidence.file);
        ipfsHash = uploadRes.ipfsHash;
        fileHash = uploadRes.fileHash;
      }

      // 2️⃣ Create evidence (blockchain + Firestore)
      await evidenceService.createEvidence(selectedCase.id, {
        eType: newEvidence.eType,
        description: newEvidence.description,
        locationFound: newEvidence.locationFound || "",
        ipfsHash,
        fileHash,
        collectedAt: newEvidence.collectedAt,
      });

      // 3️⃣ Success cleanup
      setIsCreateEvidenceModalOpen(false);
      setNewEvidence({
        eType: 0,
        description: "",
        collectedAt: new Date().toISOString().slice(0, 16),
      });

      // loadEvidence();
      loadCaseDetails(selectedCase);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadEvidenceFile = async (
    ipfsHash: string,
    fallbackName = "evidence.pdf",
  ) => {
    try {
      if (isDownloading) return;

      setIsDownloading(true);
      const response = await fileService.downloadFile(ipfsHash);

      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      const blob = new Blob([response.data], { type: contentType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fallbackName;

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

  const handleUpdateEvidence = async () => {
    if (!selectedCase?.id || !selectedEvidence || isEditing) return;
    try {
      setIsEditing(true);
      await evidenceService.updateEvidence(
        selectedCase.id,
        selectedEvidence.id,
        editEvidence,
      );
      setIsEditEvidenceModalOpen(false);
      setEditEvidence({});
      setSelectedEvidence(null);
      loadCaseDetails(selectedCase!);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsEditing(false);
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

  const getOfficers = async (caseId: string) => {
    if (!selectedCase) return;
    try {
      const data = await caseService.getAvailableOfficers(caseId);
      setOfficers(data);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!selectedCase || isDeleting) return;
    if (!confirm("Are you sure you want to delete this evidence?")) return;
    try {
      setIsDeleting(true);
      await evidenceService.deleteEvidence(selectedCase!.id, evidenceId);
      loadCaseDetails(selectedCase!);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCases =
    cases.length > 0
      ? cases.filter((c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [];

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
          {selectedCase.assignedPoliceUids.includes(user!.uid) && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreateEvidenceModalOpen(true)}
                disabled={!selectedCase.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                Add Evidence
              </button>
              <button
                onClick={() => {
                  setEditCase({
                    title: selectedCase.title,
                    description: selectedCase.description,
                    status: selectedCase.status,
                    priority: selectedCase.priority,
                  });
                  setIsEditModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => {
                  setIsAssignModalOpen(true);
                  getOfficers(selectedCase.id);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <UserPlus size={16} />
                Assign
              </button>
              <button
                onClick={() => handleDeleteCase(selectedCase.id)}
                disabled={isDeleting}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                ${
                  isDeleting
                    ? "bg-red-400 dark:bg-red-800 text-white cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              `}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          )}
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
                            {evidence.eType}
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

                          <div className="flex flex-col gap-2 w-28">
                            <button
                              onClick={() => {
                                setSelectedEvidence(evidence);
                                setEditEvidence({
                                  type: evidence.eType,
                                  description: evidence.description,
                                  locationFound: evidence.locationFound,
                                });
                                setIsEditEvidenceModalOpen(true);
                              }}
                              className="w-full text-center text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 py-1 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvidence(evidence.id)}
                              disabled={isDeleting}
                              className={`w-full flex items-center justify-center gap-2 text-xs py-1 rounded transition-all duration-200
                              ${
                                isDeleting
                                  ? "bg-red-200 dark:bg-red-900/50 text-red-500 cursor-not-allowed"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                              }
                            `}
                            >
                              {isDeleting ? (
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
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Create Evidence */}
                  <Modal
                    isOpen={isCreateEvidenceModalOpen}
                    onClose={() => setIsCreateEvidenceModalOpen(false)}
                    title="Add New Evidence"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Evidence Type
                        </label>
                        <input
                          type="number"
                          value={newEvidence.eType}
                          onChange={(e) =>
                            setNewEvidence({
                              ...newEvidence,
                              eType: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={newEvidence.description}
                          onChange={(e) =>
                            setNewEvidence({
                              ...newEvidence,
                              description: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Detailed description of the evidence"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location Found
                        </label>
                        <input
                          type="text"
                          value={newEvidence.locationFound}
                          onChange={(e) =>
                            setNewEvidence({
                              ...newEvidence,
                              locationFound: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="e.g., Physical, Digital, Witness Statement"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Collected At
                        </label>
                        <input
                          type="datetime-local"
                          value={newEvidence.collectedAt}
                          onChange={(e) =>
                            setNewEvidence({
                              ...newEvidence,
                              collectedAt: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Evidence File
                        </label>
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewEvidence({ ...newEvidence, file });
                            }
                          }}
                          className="w-full text-sm text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCreateEvidence}
                          disabled={isCreating}
                          className={`px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2
                ${
                  isCreating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
                        >
                          {isCreating ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
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
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                              </svg>
                              Adding...
                            </>
                          ) : (
                            "Add Evidence"
                          )}
                        </button>
                      </div>
                    </div>
                  </Modal>
                  {/* Update Evidence */}
                  <Modal
                    isOpen={isEditEvidenceModalOpen}
                    onClose={() => setIsEditEvidenceModalOpen(false)}
                    title="Edit Evidence"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Evidence Type
                        </label>
                        <input
                          type="text"
                          value={editEvidence.type || ""}
                          onChange={(e) =>
                            setEditEvidence({
                              ...editEvidence,
                              type: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fount At
                        </label>
                        <input
                          type="text"
                          value={editEvidence.locationFound || ""}
                          onChange={(e) =>
                            setEditEvidence({
                              ...editEvidence,
                              locationFound: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editEvidence.description || ""}
                          onChange={(e) =>
                            setEditEvidence({
                              ...editEvidence,
                              description: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Evidence File
                        </label>
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewEvidence({ ...newEvidence, file });
                            }
                          }}
                          className="w-full text-sm text-gray-700 dark:text-gray-300"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditEvidenceModalOpen(false)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateEvidence}
                          className={`px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2
                          ${
                            isEditing
                              ? "bg-blue-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                        `}
                        >
                          {isEditing ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
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
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                              </svg>
                              Updating...
                            </>
                          ) : (
                            "Update Evidence"
                          )}
                        </button>
                      </div>
                    </div>
                  </Modal>
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
                          // <div
                          //   key={history.id}
                          //   className="border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-r"
                          // >
                          //   <div className="flex justify-between items-start mb-2">
                          //     <p className="font-semibold text-gray-900 dark:text-white">
                          //       Version : {history.version}
                          //     </p>
                          //     <span className="text-xs text-gray-500 dark:text-gray-500">
                          //       {new Date(
                          //         Number(history.timestamp) * 1000,
                          //       ).toLocaleString()}
                          //     </span>
                          //   </div>
                          //   <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          //     By: {history.collectedBy}
                          //   </p>

                          //   <div className="bg-white dark:bg-gray-800 rounded p-3 mt-2">
                          //     <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          //       Details:
                          //     </p>
                          //     <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                          //       Description : {history.description}
                          //     </pre>
                          //     <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                          //       Type : {history.eType}
                          //     </pre>
                          //     <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                          //       Found At : {history.locationFound}
                          //     </pre>
                          //   </div>
                          // </div>
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

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Case"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={editCase.title || ""}
                onChange={(e) =>
                  setEditCase({ ...editCase, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={editCase.description || ""}
                onChange={(e) =>
                  setEditCase({ ...editCase, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={editCase.status || ""}
                onChange={(e) =>
                  setEditCase({
                    ...editCase,
                    status: e.target.value as Case["status"],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Case Type
              </label>
              <input
                type="number"
                value={newCase.caseType}
                onChange={(e) =>
                  setNewCase({ ...newCase, caseType: Number(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={editCase.priority || ""}
                onChange={(e) =>
                  setEditCase({
                    ...editCase,
                    priority: e.target.value as Case["priority"],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCase}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Case
              </button>
            </div>
          </div>
        </Modal>

        {/* Assign Police */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Police Officer"
          size="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {officers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No officers available
              </p>
            ) : (
              officers.map((officer) => (
                <div
                  key={officer.uid}
                  className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-300"
                >
                  {/* Officer Info */}
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground dark:text-white">
                      {officer.name}
                    </h4>

                    <p className="text-sm text-muted-foreground dark:text-white">
                      {officer.email}
                    </p>

                    <p className="text-xs text-muted-foreground dark:text-white">
                      Joined: {new Date(officer.createdAt).toLocaleString()}
                    </p>

                    <p className="text-xs text-blue-500 break-all dark:text-white">
                      {officer.walletAddress}
                    </p>
                  </div>

                  {/* Assign Button */}
                  <button
                    onClick={() => {
                      handleAssignPolice(officer.walletAddress);
                      setIsAssigning(true);
                    }}
                    disabled={isAssigning}
                    className={`
                    px-4 py-2 text-xs font-medium rounded-lg
                    bg-primary text-primary-foreground
                    hover:bg-primary/90
                    transition-all duration-200 shadow-sm
                    flex items-center justify-center gap-2
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                  >
                    {isAssigning ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
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
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Assigning...
                      </>
                    ) : (
                      "Assign"
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Cases
        </h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Case
        </button>
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
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Case"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={newCase.title}
              onChange={(e) =>
                setNewCase({ ...newCase, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter case title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newCase.description}
              onChange={(e) =>
                setNewCase({ ...newCase, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter case description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={newCase.priority}
              onChange={(e) =>
                setNewCase({
                  ...newCase,
                  priority: e.target.value as Case["priority"],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Case Type
            </label>
            <input
              type="number"
              value={newCase.caseType}
              onChange={(e) =>
                setNewCase({ ...newCase, caseType: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={newCase.location}
              onChange={(e) =>
                setNewCase({ ...newCase, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter location"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCase}
              disabled={isCreating}
              className={`px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2
                ${
                  isCreating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
            >
              {isCreating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Case"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
const Actions = ["READ", "CREATE", "UPDATE", "DELETE"];
