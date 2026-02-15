import api from "./api";

export const requestService = {
  async getPendingRequests() {
    const response = await api.get<any[]>("/api/court/requests");
    return response.data;
  },

  async assignLawyer(caseId: string, lawyerAddress: string) {
    const response = await api.post(`/api/court/${caseId}/assign-lawyer`, {
      lawyerAddress,
    });
    return response.data;
  },
};

export default requestService;
