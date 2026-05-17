import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../api/authService';

export default function PosLayout() {
    const [time, setTime] = useState(new Date().toLocaleTimeString());

    // Cập nhật đồng hồ hệ thống theo thời gian thực
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        if (window.confirm("Bạn muốn đăng xuất khỏi trạm kiểm định?")) {
            authService.logout();
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">

            {/* ====== HEADER TỐI GIẢN PHẲNG ====== */}
            <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center">

                {/* Khối bên trái: Tên hệ thống & Vị trí trạm */}
                <div className="flex items-center gap-4">
                    <h1 className="text-md font-bold tracking-wider text-white font-mono">
                        AUTO PARTS POS {/* Bạn có thể đổi thành AUTO-QC tùy theo định hướng cốt lõi */}
                    </h1>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span className="font-mono">Trạm #04</span>
                    </div>
                </div>

                {/* Khối bên phải: Thời gian & Nút Đăng xuất */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="font-mono text-slate-400">
                        {time}
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-medium">Nhân viên</span>
                        <button
                            onClick={handleLogout}
                            className="text-xs bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-900/40 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded transition font-medium cursor-pointer"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            {/* ====== KHU VỰC HIỂN THỊ NỘI DUNG TRANG CON ====== */}
            <main className="flex-1 overflow-auto bg-slate-900">
                <Outlet />
            </main>
        </div>
    );
}