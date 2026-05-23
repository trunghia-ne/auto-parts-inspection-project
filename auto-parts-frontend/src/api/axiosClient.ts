import axios from 'axios';

// Khởi tạo instance với Base URL trỏ về backend Spring Boot
const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động kẹp Token vào Header trước khi request bay đi
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (sẽ được lưu lúc Login)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý lỗi chung khi response trả về
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Chỉ lấy phần data, bỏ qua vỏ bọc của axios
  },
  (error) => {
    // Nếu token hết hạn (mã 401) -> Đá văng ra trang Login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;