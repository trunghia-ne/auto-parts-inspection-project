import axiosClient from './axiosClient';

export interface User {
  id: number;
  username: string;
  roles: string[];
}

export const userService = {
  getAllUsers: (): Promise<User[]> => {
    return axiosClient.get('/users');
  },

  deleteUser: (id: number): Promise<void> => {
    return axiosClient.delete(`/users/${id}`);
  }
};