import axiosClient from './axiosClient';

export const authService = {
    login: async (credentials: any) => {
        const response = await axiosClient.post('/auth/login', credentials);
        // Lưu token và thông tin user vào LocalStorage ngay khi login thành công
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (data: any) => {
        const response = await axiosClient.post('/auth/register', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};