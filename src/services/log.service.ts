import api from "./api";
import { AccessLog, User } from "../types";

export const logService = {
  async getLogsByCase(caseId: string): Promise<AccessLog[]> {
    const response = await api.get(`/api/logs/${caseId}`);

    const rawLogs = response.data.logs; // 👈 IMPORTANT

    if (!Array.isArray(rawLogs)) return [];

    return rawLogs.map((log: any, index: number) => ({
      id: `${caseId}-${index}`,
      caseId: String(log.caseId),
      action: ACTION_MAP[log.action] ?? "READ",
      performedBy: log.actor,
      performedByRole: log.performedByRole, // backend does not send role yet
      timestamp: new Date(log.timestamp).toISOString(),
      evidenceId: log.evidenceId ? String(log.evidenceId) : undefined,
      details: log.extraData,
      performedByName: log.performedByName,
      performedByEmail: log.performedByEmail,
    }));
  },
  async getUserByWalletAddress(walletAddress: string): Promise<User> {
    const response = await api.get(`/api/logs/getUser/${walletAddress}`);
    return response.data;
  },
};
const ACTION_MAP: Record<number, AccessLog["action"]> = {
  0: "READ",
  1: "CREATE",
  2: "UPDATE",
  3: "DELETE",
};
