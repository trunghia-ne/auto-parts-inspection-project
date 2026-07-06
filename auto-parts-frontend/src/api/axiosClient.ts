import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Interceptor Request: Tự động nhét JWT Token vào mọi API gửi đi
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. Interceptor Response: Xử lý lỗi trả về từ Backend (Bắt lỗi 401 hết hạn Token)
axiosClient.interceptors.response.use(
    (response) => {
        return response; // Trả về data bình thường nếu thành công
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
            localStorage.removeItem('auth_token');
            // Tự động đá về trang login nếu lỗi 401
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default axiosClient;