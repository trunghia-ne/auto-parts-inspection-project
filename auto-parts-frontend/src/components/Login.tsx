import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // 🔥 Bước 1: Import Link để chuyển trang không reload
import axiosClient from '../api/axiosClient';

interface LoginResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];
}

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Gọi API đăng nhập từ Backend Spring Boot
      const response = await axiosClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      });

      const data = response.data;

      // 2. Lưu thông tin xác thực vào bộ nhớ trình duyệt
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_roles', JSON.stringify(data.roles));

      // 3. Nắn dòng điều hướng thông minh dựa trên Role hệ thống
      if (data.roles.includes('ROLE_ADMIN')) {
        window.location.href = '/admin';
      } else if (data.roles.includes('ROLE_QC')) {
        window.location.href = '/qc';
      } else if (data.roles.includes('ROLE_CUSTOMER')) {
        window.location.href = '/customer';
      } else {
        // Phòng trường hợp tài khoản mới chưa được cấp quyền đúng chuẩn
        setErrorMsg('Tài khoản của bạn chưa được phân quyền hệ thống!');
        localStorage.clear();
      }
    } catch (err: any) {
      // Xử lý thông báo lỗi phản hồi từ Spring Security
      if (err.response && err.response.status === 401) {
        setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        {/* Logo hoặc Tên hệ thống */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            TND AUTO PARTS
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Hệ thống Quản lý Kiểm định Chất lượng AI
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Hiển thị thông báo lỗi nếu có */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Ô nhập Tài khoản */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700">
                Tên đăng nhập
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nhập tài khoản hệ thống"
                />
              </div>
            </div>

            {/* Ô nhập Mật khẩu */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Nút bấm Đăng nhập */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  isLoading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xác thực...
                  </span>
                ) : (
                  'Đăng nhập hệ thống'
                )}
              </button>
            </div>
          </form>

          {/* 🔥 Bước 2: THÊM ĐOẠN LIÊN KẾT ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG Ở ĐÂY */}
          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản đối tác?{' '}
              <Link 
                to="/register" 
                className="font-bold text-blue-600 hover:text-blue-500 hover:underline transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Chú thích chân trang */}
          <div className="mt-6 border-t pt-4 text-center">
            <span className="text-xs text-gray-400">
              Môi trường làm việc nội bộ & Đối tác nhà máy TND
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};