import { useEffect, useState } from "react";
import { User, Mail, Clock, Check, Search } from "lucide-react";
import { ApiError } from "../types";
import { requestService } from "../services/request.service";

interface CaseRequest {
  id: string;
  caseId: string;
  lawyerAddress: string;
  lawyerUid?: string;
  requestedAt: number;
  status: "PENDING" | "APPROVED";
  lawyerName?: string;
  lawyerEmail?: string;
}

export const CaseAccessRequest = () => {
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await requestService.getPendingRequests();
      setRequests(data || []);
      setCurrentPage(1);
      setError("");
    } catch (err) {
      const e = err as ApiError;
      setError(e.message || "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests =
    requests.length > 0
      ? requests.filter((r) => {
          const q = searchTerm.trim().toLowerCase();
          if (!q) return true;
          return (
            (r.lawyerName || "").toLowerCase().includes(q) ||
            (r.lawyerEmail || "").toLowerCase().includes(q) ||
            r.caseId.toLowerCase().includes(q) ||
            (r.lawyerAddress || "").toLowerCase().includes(q)
          );
        })
      : [];

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const displayedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    (currentPage - 1) * pageSize + pageSize,
  );

  const handleApprove = async (req: CaseRequest) => {
    if (approving[req.id]) return;

    setApproving((s) => ({ ...s, [req.id]: true }));

    try {
      await requestService.assignLawyer(req.caseId, req.lawyerAddress);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err) {
      const e = err as ApiError;
      setError(e.message || "Approval failed");
    } finally {
      setApproving((s) => ({ ...s, [req.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Case Access Requests
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Per page:
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            {[6, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Loading requests...
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No pending requests
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <User className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {req.lawyerName || "Unknown Lawyer"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {req.lawyerEmail || "-"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Case: <span className="font-medium">#{req.caseId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(req.requestedAt).toLocaleString()}
                    </div>

                    <button
                      onClick={() => handleApprove(req)}
                      disabled={approving[req.id]}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors 
                      ${
                        approving[req.id]
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }
                    `}
                    >
                      {approving[req.id] ? (
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
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              {filteredRequests.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}{" "}
              - {Math.min(filteredRequests.length, currentPage * pageSize)} of{" "}
              {filteredRequests.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm ${page === currentPage ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-700"}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CaseAccessRequest;
