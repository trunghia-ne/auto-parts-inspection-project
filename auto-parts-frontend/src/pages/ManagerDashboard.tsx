import { Activity, AlertTriangle, CheckCircle, Package } from 'lucide-react';

const ManagerDashboard = () => {
  // Dữ liệu giả (Mock Data) để vẽ giao diện trước. 
  // Sau này chúng ta sẽ gọi API Spring Boot để lấy số thật nhét vào đây.
  const stats = [
    { title: 'Tổng phiên kiểm định', value: '1,248', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Đạt (PASSED)', value: '1,180', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Lỗi (FAILED)', value: '68', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Tỷ lệ lỗi', value: '5.4%', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Thẻ Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Khung chứa bảng dữ liệu (Tạm thời để trống) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Lịch sử kiểm định gần đây</h3>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-500 font-medium">Bảng dữ liệu đang được cập nhật từ API...</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;