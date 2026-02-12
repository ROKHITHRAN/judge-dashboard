import api from "./api";
import { UploadFileResponse } from "../types";
import { AxiosResponse } from "axios";

export const fileService = {
  async uploadFile(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadFileResponse>(
      "/api/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getDownloadUrl(ipfsHash: string): string {
    return `http://localhost:5000/api/files/download/${ipfsHash}`;
  },

  // async downloadFile(ipfsHash: string): Promise<Blob> {
  //   const response = await api.get(`/api/files/download/${ipfsHash}`, {
  //     responseType: 'blob',
  //   });
  //   return response.data;
  // },
  async downloadFile(ipfsHash: string): Promise<AxiosResponse<ArrayBuffer>> {
    return api.get(`/api/files/download/${ipfsHash}`, {
      responseType: "arraybuffer",
    });
  },
};
