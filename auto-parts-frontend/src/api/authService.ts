import axiosClient from './axiosClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  roles: string[];
}

export const authService = {
  login: (data: LoginRequest): Promise<AuthResponse> => {
    return axiosClient.post('/auth/login', data);
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
  }
};