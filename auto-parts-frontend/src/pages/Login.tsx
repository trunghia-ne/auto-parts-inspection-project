import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { loginApi } from '../api/authService';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Gọi API đăng nhập (TS sẽ tự hiểu response là AuthResponse)
      const response = await loginApi({ username, password });
      
      if (response.token) {
        // Lưu token và thông tin user vào LocalStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', response.username);
        localStorage.setItem('roles', JSON.stringify(response.roles)); // Lưu mảng roles
        
        // Điều hướng dựa trên quyền (Spring Security tự động thêm tiền tố ROLE_)
        if (response.roles.includes('ROLE_MANAGER') || response.roles.includes('ROLE_ADMIN')) {
          navigate('/admin');
        } else {
          // ROLE_STAFF sẽ vào trang kiểm định POS
          navigate('/pos'); 
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Tài khoản hoặc mật khẩu không chính xác!');
      } else {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Form */}
        <div className="bg-slate-800 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">TND Auto-QC</h2>
          <p className="text-slate-300 text-sm">Hệ thống Kiểm định Phụ tùng bằng AI</p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Cảnh báo lỗi */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Input Tài khoản */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tài khoản</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            {/* Input Mật khẩu */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  ĐĂNG NHẬP
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;