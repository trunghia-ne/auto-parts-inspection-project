import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request: Tự động đính kèm Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response: Xử lý lỗi toàn cục
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Trả thẳng data, bỏ qua vỏ config của axios
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc sai, tự động đăng xuất
      localStorage.removeItem('auth_token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;