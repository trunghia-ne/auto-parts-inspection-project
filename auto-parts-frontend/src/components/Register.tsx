import React, { useState } from 'react';
import { authApi, type RegisterRequest } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    taxCode: '',
    address: '',
    role: 'CUSTOMER' // Mặc định là khách hàng
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.register(formData);
      alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login'); // Chuyển hướng về trang đăng nhập
    } catch (err: any) {
      // 🔥 ĐÃ CẬP NHẬT: Đoạn xử lý bóc tách lỗi an toàn, ngăn chặn sập React UI
      if (err.response?.data) {
        const serverError = err.response.data;
        
        if (typeof serverError === 'string') {
          setError(serverError);
        } else if (serverError.message) {
          // Trích xuất lỗi Validate từ IllegalArgumentException của Spring Boot
          setError(serverError.message); 
        } else if (serverError.error) {
          // Trích xuất lỗi hệ thống của Spring Boot (Ví dụ: "Not Found", "Internal Server Error")
          setError(serverError.error); 
        } else {
          setError('Có lỗi cấu trúc dữ liệu xảy ra khi đăng ký!');
        }
      } else {
        setError(err.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Đăng Ký Tài Khoản B2B</h2>
        <p className="text-center text-gray-500 mb-8">Trở thành đối tác kiểm định phụ tùng cùng chúng tôi</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center font-medium border border-red-200">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CỘT 1: THÔNG TIN TÀI KHOẢN & CÁ NHÂN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Thông tin tài khoản</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên đăng nhập (*)</label>
                <input type="text" name="username" required minLength={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500"
                  onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu (*)</label>
                <div className="mt-1 relative">
                  <input type={showPassword ? "text" : "password"} name="password" required minLength={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500 pr-10"
                    onChange={handleChange} />
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Người liên hệ</label>
                <input type="text" name="fullName" placeholder="Nguyễn Văn A"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500"
                  onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="tel" name="phoneNumber"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-blue-500 focus:border-blue-500"
                  onChange={handleChange} />
              </div>
            </div>

            {/* CỘT 2: THÔNG TIN DOANH NGHIỆP */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-600 border-b pb-2">Thông tin doanh nghiệp</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên công ty / Xưởng</label>
                <input type="text" name="companyName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-purple-500 focus:border-purple-500"
                  onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                <input type="text" name="taxCode"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-purple-500 focus:border-purple-500"
                  onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email công ty</label>
                <input type="email" name="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-purple-500 focus:border-purple-500"
                  onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input type="text" name="address"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5 bg-gray-50 border focus:ring-purple-500 focus:border-purple-500"
                  onChange={handleChange} />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-gray-200 mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white py-3 rounded-md font-bold text-lg transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
            >
              {loading ? 'Đang xử lý...' : 'Tạo Tài Khoản B2B'}
            </button>
            <p className="text-center text-sm text-gray-600 mt-4">
              Đã có tài khoản? <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>Đăng nhập ngay</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}