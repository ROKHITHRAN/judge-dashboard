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
} from "../types";
import { Modal } from "./Modal";
import { useAuth } from "../context/AuthContext";

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
  const [isCreating, setIsCreating] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [newCase, setNewCase] = useState<CreateCaseRequest>({
    title: "",
    description: "",
    priority: "MEDIUM",
    caseType: 1,
    location: "Chennai",
    status: "OPEN",
  });

  const [editCase, setEditCase] = useState<UpdateCaseRequest>({});
  const [assignOfficerId, setAssignOfficerId] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      const data = await caseService.getAllCases();

      setCases(data);
      setError("");
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
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
      console.log(logs);

      setCaseEvidence(evidence);
      setCaseLogs(logs);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    }
  };

  // const handleCreateCase = async () => {
  //   try {
  //     await caseService.createCase(newCase);
  //     setIsCreateModalOpen(false);
  //     setNewCase({ title: "", description: "", priority: "MEDIUM" });
  //     loadCases();
  //   } catch (err) {
  //     const error = err as ApiError;
  //     setError(error.message);
  //   }
  // };

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
    if (!selectedCase) return;
    try {
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
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Are you sure you want to delete this case?")) return;
    try {
      await caseService.deleteCase(caseId);
      loadCases();
      setSelectedCase(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
    }
  };

  const handleAssignPolice = async () => {
    if (!selectedCase) return;
    try {
      await caseService.assignPolice(selectedCase.id, {
        officerId: assignOfficerId,
      });
      setIsAssignModalOpen(false);
      setAssignOfficerId("");
      loadCases();
      const updated = await caseService.getCaseById(selectedCase.id);
      setSelectedCase(updated);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message);
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
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <UserPlus size={16} />
                Assign
              </button>
              <button
                onClick={() => handleDeleteCase(selectedCase.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete
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
                            {evidence.type}
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
                        {evidence.ipfsHash && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                            File Attached
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
                <div className="space-y-2">
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
                            by {log.performedBy} ({log.performedByRole})
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

        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Police Officer"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Officer ID
              </label>
              <input
                type="text"
                value={assignOfficerId}
                onChange={(e) => setAssignOfficerId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter officer ID"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPolice}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Assign Officer
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cases
        </h1>
        {/* <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Case
        </button> */}
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
