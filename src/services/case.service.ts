import api from "./api";
import {
  Case,
  CreateCaseRequest,
  UpdateCaseRequest,
  AssignPoliceRequest,
  Officer,
} from "../types";

export const caseService = {
  async createCase(data: CreateCaseRequest): Promise<Case> {
    const response = await api.post<Case>("/api/cases", data);
    return response.data;
  },

  async getAllCases(): Promise<Case[]> {
    const response = await api.get<Case[]>("/api/cases");
    return response.data;
  },

  async getCaseById(caseId: string): Promise<Case> {
    const response = await api.get<Case>(`/api/cases/${caseId}`);
    return response.data;
  },

  async updateCase(caseId: string, data: UpdateCaseRequest): Promise<Case> {
    const response = await api.put<Case>(`/api/cases/${caseId}`, data);
    return response.data;
  },

  async deleteCase(caseId: string): Promise<void> {
    await api.delete(`/api/cases/${caseId}`);
  },

  async assignPolice(caseId: string, data: AssignPoliceRequest): Promise<Case> {
    const response = await api.post<Case>(
      `/api/cases/${caseId}/assign-police`,
      data,
    );
    return response.data;
  },

  async getAvailableOfficers(caseId: string): Promise<Officer[]> {
    const response = await api.get<Officer[]>(
      `/api/cases/${caseId}/getOfficers`,
    );

    return response.data;
  },
};
