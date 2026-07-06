import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // VNPay sẽ đính kèm mã kết quả giao dịch vào tham số 'vnp_ResponseCode' trên URL
  const responseCode = searchParams.get('vnp_ResponseCode');

  // Kiểm tra nếu mã là '00' thì tức là khách đã thanh toán thành công phía VNPay
  const isSuccess = responseCode === '00';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center max-w-md w-full transition-all">
        {isSuccess ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh Toán Thành Công!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Giao dịch của bạn đã hoàn tất trên cổng VNPay. Hệ thống đang tiến hành cập nhật trạng thái đơn hàng.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh Toán Thất Bại!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Giao dịch không thành công. Lỗi có thể do tài khoản không đủ số dư hoặc bạn đã hủy thao tác.
            </p>
          </>
        )}

        <button 
          onClick={() => navigate('/customer')} 
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang quản lý đơn
        </button>
      </div>
    </div>
  );
}