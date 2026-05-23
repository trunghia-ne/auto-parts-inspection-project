import axiosClient from './axiosClient';

// Định nghĩa dữ liệu gửi đi (khớp với LoginRequest.java)
export interface LoginRequest {
  username: string;
  password: string;
}

// Định nghĩa dữ liệu nhận về (khớp với AuthResponse.java)
export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  roles: string[];
}

// Hàm gọi API đăng nhập
export const loginApi = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosClient.post<any, AuthResponse>('/auth/login', credentials);
  return response;
};