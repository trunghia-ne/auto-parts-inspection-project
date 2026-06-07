import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, User, Zap, Users } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Quản lý';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Danh sách menu bên trái
  const navItems = [
    { path: '/admin', name: 'Tổng quan (Dashboard)', icon: LayoutDashboard },
    { path: '/admin/users', name: 'Quản lý nhân sự', icon: Users },
    { path: '/pos', name: 'Mở trạm POS (Kiểm định)', icon: ClipboardList },
    // Vài hôm nữa bạn làm trang quản lý phụ tùng thì mở comment dòng dưới ra:
    // { path: '/admin/parts', name: 'Quản lý Phụ tùng', icon: Box },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Cột Menu bên trái (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Zap className="w-6 h-6 text-blue-500 mr-2" />
          <span className="text-white font-bold text-lg tracking-wide">TND Auto-QC</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Vùng nội dung chính bên phải */}
      <main className="flex-1 flex flex-col">
        {/* Thanh Header trên cùng */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-slate-800">Hệ thống Quản lý</h1>
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
            <User className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{username}</span>
          </div>
        </header>

        {/* Khung hiển thị các trang con */}
        <div className="p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;