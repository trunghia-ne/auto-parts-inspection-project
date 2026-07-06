// src/components/AdminLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
        catalog: true,
        system: false
    });

    const toggleMenu = (key: string) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    // Hàm kiểm tra chính xác URL đang đứng
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* SIDEBAR BÊN TRÁI */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-blue-400 tracking-wider">QC SYSTEM</h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase">Quản trị hệ thống</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <Link 
                        to="/admin" 
                        className={`flex items-center p-3 rounded-lg transition ${isActive('/admin') ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                    >
                        <span className="mr-3">📊</span> Dashboard
                    </Link>

                    {/* MENU DANH MỤC */}
                    <div>
                        <button onClick={() => toggleMenu('catalog')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition">
                            <div className="flex items-center">
                                <span className="mr-3">🛠️</span> Quản lý danh mục
                            </div>
                            <span className={`text-xs transition-transform ${openMenus.catalog ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {openMenus.catalog && (
                            <div className="ml-9 mt-2 space-y-1">
                                <Link to="/admin/parts" className={`block p-2 text-sm rounded transition ${isActive('/admin/parts') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                    • Phụ tùng kiểm định
                                </Link>
                                <Link to="/admin/ai-classes" className={`block p-2 text-sm rounded transition ${isActive('/admin/ai-classes') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                    • Danh mục AI Class
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 🔥 MENU HỆ THỐNG MỚI THÊM NÀY BÁC */}
                    <div>
                        <button onClick={() => toggleMenu('system')} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition">
                            <div className="flex items-center">
                                <span className="mr-3">⚙️</span> Hệ thống
                            </div>
                            <span className={`text-xs transition-transform ${openMenus.system ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {openMenus.system && (
                            <div className="ml-9 mt-2 space-y-1">
                                <Link to="/admin/users" className={`block p-2 text-sm rounded transition ${isActive('/admin/users') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                    • Quản lý Người dùng
                                </Link>
                                <Link to="/admin/reports" className={`block p-2 text-sm rounded transition ${isActive('/admin/reports') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                    • Báo cáo giao dịch
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* GÓC NHÌN NGHIỆP VỤ GIỮ NGUYÊN */}
                    <div className="pt-4 mt-2 border-t border-slate-800/60">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-2">Góc nhìn nghiệp vụ</p>
                        <Link to="/customer" className="flex items-center p-3 rounded-lg hover:bg-blue-900/30 text-slate-300 hover:text-blue-400 transition">
                            <span className="mr-3">👥</span> Giao diện Khách hàng
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 text-red-400 hover:bg-red-900/20 rounded-lg transition">
                        <span className="mr-3">🚪</span> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* KHU VỰC NỘI DUNG BÊN PHẢI */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center text-gray-500 text-sm">
                        <span>Trang quản trị</span>
                        <span className="mx-2">/</span>
                        <span className="text-blue-600 font-medium">Hệ thống</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-700">Administrator</p>
                            <p className="text-xs text-green-500">Trực tuyến</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};