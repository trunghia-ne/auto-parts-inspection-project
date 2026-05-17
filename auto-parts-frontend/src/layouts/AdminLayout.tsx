import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Thanh Menu bên trái (Sidebar) cố định */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-4 text-xl font-bold border-b border-slate-800">
                    AutoQC Admin
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {/* Dùng thẻ Link để chuyển trang không bị chớp màn hình */}
                    <Link to="/admin/dashboard" className="block p-2 rounded hover:bg-slate-800">Dashboard</Link>
                    <Link to="/admin/parts" className="block p-2 rounded hover:bg-slate-800">Quản lý Phụ tùng</Link>
                    <Link to="/admin/staffs" className="block p-2 rounded hover:bg-slate-800">Nhân viên</Link>
                </nav>
            </aside>

            {/* Khu vực nội dung bên phải */}
            <div className="flex-1 flex flex-col">
                {/* Header cố định */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-700">Hệ thống Quản lý Chất lượng</h2>
                    <button className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded">Đăng xuất</button>
                </header>

                {/* ĐÂY LÀ TRÁI TIM: Nơi các trang con (Dashboard, Part...) sẽ render vào */}
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}