import axiosClient from './axiosClient';

export interface User {
  id: number;
  username: string;
  roles: string[];
}

export interface UserRequest {
  username: string;
  password?: string;
  roles: string[];
}

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    return await axiosClient.get('/users');
  },

  createUser: async (data: UserRequest): Promise<User> => {
    return await axiosClient.post('/users', data);
  },

  updateUser: async (id: number, data: UserRequest): Promise<User> => {
    return await axiosClient.put(`/users/${id}`, data);
  },

  deleteUser: async (id: number): Promise<string> => {
    return await axiosClient.delete(`/users/${id}`);
  },

  getAllRoles: async (): Promise<string[]> => {
    return await axiosClient.get('/users/roles');
  }
};
