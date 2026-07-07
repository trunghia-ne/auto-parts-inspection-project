import React, { useState, useEffect } from 'react';
import { customerApi, type Part, type SessionResponse } from '../api/customerApi';
import { 
  CreditCard, Cpu, ShieldCheck, FileText, 
  Wrench, Activity, AlertCircle, CheckCircle2,
  LogOut // 1. Thêm import LogOut icon
} from 'lucide-react';

export default function CustomerDashboard() {
  const [parts, setParts] = useState<Part[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const rolesStr = localStorage.getItem('user_roles');
  const roles: string[] = rolesStr ? JSON.parse(rolesStr) : [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');

  // Form State
  const [selectedPartId, setSelectedPartId] = useState<number>(0);
  const [lotCode, setLotCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [packageType, setPackageType] = useState('BASIC_AI');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [partsData, sessionsData] = await Promise.all([
        customerApi.getAvailableParts(),
        customerApi.getMySessions()
      ]);
      setParts(partsData);
      if (partsData.length > 0 && selectedPartId === 0) setSelectedPartId(partsData[0].id);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentPart = parts.find(p => p.id === Number(selectedPartId));
  const unitPrice = currentPart ? currentPart.price : 0;
  const finalUnitPrice = packageType === 'BASIC_AI' ? unitPrice / 2 : unitPrice;
  const totalAmount = finalUnitPrice * quantity;

  // 2. Thêm hàm xử lý đăng xuất
  const handleLogout = () => {
    // Thêm logic xóa token, dọn dẹp state ở đây
    // Ví dụ: localStorage.removeItem('token');
    
    // Chuyển hướng người dùng về trang đăng nhập
    window.location.href = '/login'; 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotCode.trim()) return alert("Vui lòng nhập Mã số lô hàng!");
    
    setLoading(true);
    try {
      const res = await customerApi.createSession({
        partId: Number(selectedPartId),
        lotCode,
        quantity,
        packageType,
        paymentMethod
      });

      if (res.paymentUrl) {
        if (paymentMethod === 'VIETQR') {
          setQrUrl(res.paymentUrl);
          setCurrentSessionId(res.sessionId);
          setShowQrModal(true);
          fetchData();
          setLoading(false);
        } else {
          window.location.href = res.paymentUrl;
        }
      } else {
        fetchData();
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Khởi tạo phiếu kiểm định thất bại!");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 font-sans antialiased">
      
      {/* THANH ĐIỀU HƯỚNG TRÊN (TOP BAR) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">HỆ THỐNG KIỂM ĐỊNH PHỤ TÙNG</h1>
              <p className="text-xs text-gray-500 font-medium">Trung tâm chẩn đoán hình ảnh khuyết tật bề mặt cơ khí</p>
            </div>
          </div>
          
          {/* 3. Khu vực chứa Status và nút Đăng xuất */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-gray-50 border px-3 py-1.5 rounded-md font-mono text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SYSTEM READY
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => window.location.href = '/admin'}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                title="Quay về trang quản trị"
              >
                Về Dashboard
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* KHU VỰC THỐNG KÊ NHANH (WIDGETS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng phiếu yêu cầu</p>
              <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đã hoàn thành quét</p>
              <p className="text-2xl font-bold text-gray-800">{sessions.filter(s => s.status !== 'WAITING').length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lô phát hiện lỗi nguy hiểm</p>
              <p className="text-2xl font-bold text-rose-600">{sessions.filter(s => s.status === 'FAILED').length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: FORM TẠO ĐƠN (Gọn gàng như một phiếu xuất xưởng) */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                Đăng ký ca kiểm định mới
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mã Số Lô Hàng (Lot Code)</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono placeholder-gray-400"
                  placeholder="Ví dụ: LOT-REAR-AXLE-01"
                  value={lotCode}
                  onChange={e => setLotCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Loại phụ tùng cơ khí</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none cursor-pointer transition-all"
                  value={selectedPartId}
                  onChange={e => setSelectedPartId(Number(e.target.value))}
                >
                  {parts.map(p => (
                    <option key={p.id} value={p.id}>{p.partName} — ({p.price.toLocaleString()}đ)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số lượng mẫu cần quét hình ảnh</label>
                <input 
                  type="number" 
                  min={1}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none font-mono"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Chế độ phân tích khuyết tật</label>
                <div className="space-y-2">
                  <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${packageType === 'BASIC_AI' ? 'border-blue-600 bg-blue-50/40' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="pkg" className="mt-1 mr-3" checked={packageType === 'BASIC_AI'} onChange={() => setPackageType('BASIC_AI')} />
                    <div>
                      <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Cpu className="w-4 h-4 text-blue-600" /> Luồng tự động BASIC_AI</div>
                      <p className="text-xs text-gray-500 mt-0.5">Hệ thống xử lý ảnh AI chốt đơn ngay lập tức (Giảm 50% phí dịch vụ)</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${packageType === 'PREMIUM_EXPERT' ? 'border-blue-600 bg-blue-50/40' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="pkg" className="mt-1 mr-3" checked={packageType === 'PREMIUM_EXPERT'} onChange={() => setPackageType('PREMIUM_EXPERT')} />
                    <div>
                      <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-600" /> Thẩm định PREMIUM_EXPERT</div>
                      <p className="text-xs text-gray-500 mt-0.5">AI quét lớp đầu + Chuyên gia kỹ thuật cơ khí hãng phê duyệt thủ công</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Phương thức thanh toán</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'VNPAY' ? 'border-blue-600 bg-blue-50/40 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <input type="radio" name="paymentMethod" className="hidden" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} />
                    <span className="font-bold text-sm">VNPay</span>
                  </label>
                  <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'VIETQR' ? 'border-blue-600 bg-blue-50/40 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <input type="radio" name="paymentMethod" className="hidden" checked={paymentMethod === 'VIETQR'} onChange={() => setPaymentMethod('VIETQR')} />
                    <span className="font-bold text-sm">VietQR</span>
                  </label>
                  <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50/40 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    <input type="radio" name="paymentMethod" className="hidden" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                    <span className="font-bold text-sm">Tiền mặt (COD)</span>
                  </label>
                </div>
              </div>

              {/* BẢNG TÍNH TIỀN TRỰC QUAN */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm font-medium text-gray-600 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Đơn giá cấu kiện:</span>
                  <span className="font-mono">{finalUnitPrice.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 text-gray-900 font-bold">
                  <span>CHI PHÍ THANH TOÁN:</span>
                  <span className="text-blue-600 font-mono text-base">{totalAmount.toLocaleString()} đ</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? "Đang xử lý biểu mẫu..." : (paymentMethod === 'VNPAY' ? "Xác nhận & Thanh toán VNPay" : paymentMethod === 'VIETQR' ? "Xác nhận & Quét mã VietQR" : "Xác nhận đặt đơn (COD)")}
              </button>
            </form>
          </div>

          {/* COLUMN 2: BẢNG THEO DÕI SẢN XUẤT (Chiếm 2 cột - Sạch sẽ, dễ nhìn) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Danh sách hồ sơ kiểm định</h2>
              <span className="text-xs text-gray-400 font-medium font-mono">Bảng cập nhật tự động</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 text-xs font-bold uppercase">
                    <th className="p-4">Mã hồ sơ / Lô</th>
                    <th className="p-4">Tên phụ tùng</th>
                    <th className="p-4 text-center">Chế độ / SL</th>
                    <th className="p-4">Hóa đơn</th>
                    <th className="p-4">Kết quả chẩn đoán</th>
                    <th className="p-4 text-right">Dữ liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 italic">Chưa có phiếu ghi nhận kiểm định phụ tùng.</td>
                    </tr>
                  ) : (
                    sessions.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <span className="text-gray-400 font-mono text-xs block">#00{s.id}</span>
                          <span className="text-gray-900 font-bold font-mono">{s.lotCode}</span>
                        </td>
                        <td className="p-4 font-medium text-gray-900">{s.partName}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s.packageType === 'BASIC_AI' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {s.packageType === 'BASIC_AI' ? 'AI Only' : 'Expert'}
                          </span>
                          <span className="text-gray-400 block mt-1 text-xs font-mono">SL: {s.quantity}</span>
                        </td>
                        
                        {/* TRẠNG THÁI THANH TOÁN SẠCH SẼ */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                            s.paymentStatus === 'PAID' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : s.paymentMethod === 'COD'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.paymentStatus === 'PAID' ? 'bg-emerald-500' : s.paymentMethod === 'COD' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                            {s.paymentStatus === 'PAID' ? 'Đã thu' : s.paymentMethod === 'COD' ? 'COD' : 'Chờ thanh toán'}
                          </span>
                        </td>
                        
                        {/* TRẠNG THÁI PHIẾU ĐƠN GIẢN */}
                        <td className="p-4 font-bold">
                          <span className={`inline-block px-2.5 py-1 rounded text-xs ${
                            s.status === 'PASSED' 
                              ? 'text-emerald-700 bg-emerald-50' 
                              : s.status === 'FAILED' 
                              ? 'text-rose-700 bg-rose-50' 
                              : 'text-amber-700 bg-amber-50'
                          }`}>
                            {s.status === 'PASSED' ? '✓ ĐẠT CHUẨN' : s.status === 'FAILED' ? 'LỖI/HỦY' : 'ĐANG QUÉT'}
                          </span>
                        </td>

                        {/* HÀNH ĐỘNG XUẤT BÁO CÁO NẰM GỌN GÀNG */}
                        <td className="p-4 text-right">
                          {s.pdfReportUrl ? (
                            <a 
                              href={s.pdfReportUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 hover:border-blue-400 px-2.5 py-1 bg-white rounded transition-all"
                            >
                              <FileText className="w-3.5 h-3.5" /> XEM PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Đang xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL HIỂN THỊ MÃ QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl border border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Quét mã để thanh toán</h3>
              <p className="text-sm text-slate-500 mt-1">Sử dụng ứng dụng ngân hàng để quét mã QR</p>
            </div>
            
            <div className="flex justify-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <img src={qrUrl} alt="VietQR Code" className="w-full max-w-[250px] object-contain rounded-lg shadow-sm mix-blend-multiply" />
            </div>
            
            <button
              onClick={async () => {
                if (currentSessionId) {
                  try {
                    await customerApi.confirmVietQr(currentSessionId);
                    fetchData(); // Load lại danh sách để thấy chữ "Đã thu"
                    setShowQrModal(false);
                    setCurrentSessionId(null);
                  } catch (err) {
                    alert('Có lỗi khi xác nhận thanh toán!');
                  }
                } else {
                  setShowQrModal(false);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-100"
            >
              Tôi đã chuyển khoản xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
};