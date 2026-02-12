export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
  uid: string;
  role: string;
  userName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  uid: string;
  email: string;
  role: string;
  userName: string;
}

export interface Case {
  id: string;

  // UI
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  // Chain reference
  caseType: number;
  policeName: string;
  location: string;
  detailsHash: string;

  createdAt: number;
  updatedAt: number;
  timestamp?: string;

  assignedPoliceUids: string[];
}

export interface CreateCaseRequest {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  caseType: number;
  location: string;
}

export interface UpdateCaseRequest {
  title?: string;
  description?: string;
  status?: "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface AssignPoliceRequest {
  policeAddress: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  eType: string;
  description: string;
  ipfsHash?: string;
  locationFound: string;
  collectedAt: string;
  collectedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvidenceRequest {
  eType: number; // maps to eType
  description: string;
  collectedAt: string; // UI only (Firestore)
  locationFound?: string;

  // derived (after upload)
  ipfsHash?: string;
  fileHash?: string;
}

export interface UpdateEvidenceRequest {
  type?: string;
  description?: string;
  ipfsHash?: string;
  locationFound?: string;
}

export interface EvidenceHistory {
  id: string;
  caseId: string;
  eType: number;
  version: number;
  description: string;
  locationFound: string;
  ipfsHash: string;
  fileHash: string;
  collectedBy: string;
  timestamp: string; // ISO string in frontend
  active: boolean;
  action: number;
  performedBy: string;
  performedByRole: string;
  performedByName: string;
  performedByEmail: string;
}

export interface AccessLog {
  id: string; // derived
  caseId: string;
  action: "READ" | "CREATE" | "UPDATE" | "DELETE";
  performedBy: string; // wallet address
  performedByRole: string; // derived (POLICE)
  timestamp: string; // ISO string
  evidenceId?: string;
  details?: string;
  performedByName: string;
  performedByEmail: string;
}

export interface UploadFileResponse {
  ipfsHash: string;
  filename: string;
  fileHash: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface Officer {
  uid: string;
  name: string;
  email: string;
  walletAddress: string;
  role: "POLICE";
  createdAt: number;
}
