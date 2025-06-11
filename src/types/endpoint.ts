export interface Endpoint {
  id: string;
  name: string;
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  jsonData: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EndpointResponse {
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}