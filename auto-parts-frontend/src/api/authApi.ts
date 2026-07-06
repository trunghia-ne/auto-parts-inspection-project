import axiosClient from './axiosClient';

export interface RegisterRequest {
  username: string;
  password: string;
  companyName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  taxCode?: string;
  address?: string;
  role?: string;
}

export const authApi = {
  register: (data: RegisterRequest): Promise<any> => {
    return axiosClient.post('/auth/register', data).then(res => res.data);
  }
};