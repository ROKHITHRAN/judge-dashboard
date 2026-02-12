import api from './api';
import { Evidence, CreateEvidenceRequest, UpdateEvidenceRequest, EvidenceHistory } from '../types';

export const evidenceService = {
  async createEvidence(caseId: string, data: CreateEvidenceRequest): Promise<Evidence> {
    const response = await api.post<Evidence>(`/api/evidence/${caseId}`, data);
    return response.data;
  },

  async updateEvidence(caseId: string, evidenceId: string, data: UpdateEvidenceRequest): Promise<Evidence> {
    const response = await api.put<Evidence>(`/api/evidence/${caseId}/${evidenceId}`, data);
    return response.data;
  },

  async deleteEvidence(caseId: string, evidenceId: string): Promise<void> {
    await api.delete(`/api/evidence/${caseId}/${evidenceId}`);
  },

  async getEvidenceByCase(caseId: string): Promise<Evidence[]> {
    const response = await api.get<Evidence[]>(`/api/evidence/case/${caseId}`);
    return response.data;
  },

  async getEvidenceById(caseId: string, evidenceId: string): Promise<Evidence> {
    const response = await api.get<Evidence>(`/api/evidence/${caseId}/${evidenceId}`);
    return response.data;
  },

  async getEvidenceHistory(caseId: string, evidenceId: string): Promise<EvidenceHistory[]> {
    const response = await api.get<EvidenceHistory[]>(`/api/evidence/history/${caseId}/${evidenceId}`);
    return response.data;
  },
};
