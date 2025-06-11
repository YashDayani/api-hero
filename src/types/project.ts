export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpoint {
  id: string;
  projectId: string;
  name: string;
  route: string;
  jsonData: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}