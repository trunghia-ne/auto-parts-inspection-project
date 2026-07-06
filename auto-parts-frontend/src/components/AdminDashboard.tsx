import React, { useState, useEffect } from 'react';
import { adminApi, type DashboardStats } from '../api/adminApi';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // State chứa dữ liệu biểu đồ
    const [chartData, setChartData] = useState<{ revenueData: any[], defectData: any[] }>({
        revenueData: [],
        defectData: []
    });

    // Chỉ dùng MỘT useEffect để gọi cả 2 API song song
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getCharts()
                ]);

                setStats(statsRes);
                setChartData(chartsRes); // Cập nhật dữ liệu thật vào State
            } catch (error) {
                console.error("Lỗi tải dữ liệu Dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Format tiền tệ VNĐ
    const formatCurrency = (amount: number = 0) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Tính toán Tỷ lệ Đạt (%) tự động cho Donut Chart
    const totalDefectItems = chartData.defectData.reduce((sum, item) => sum + item.value, 0);
    const passedItem = chartData.defectData.find(item => item.name.includes('PASSED'));
    const passedPercentage = totalDefectItems > 0 && passedItem ? Math.round((passedItem.value / totalDefectItems) * 100) : 0;

    if (isLoading) {
        return <div className="flex justify-center items-center h-64 text-zinc-500 font-bold">Đang tải dữ liệu tổng quan...</div>;
    }

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                <div>
                    <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Dashboard</h1>
                    <p className="text-zinc-500 text-sm mt-1">Tổng quan tình hình kinh doanh và vận hành hệ thống AI QC.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Cập nhật lúc</p>
                    <p className="text-sm font-bold text-blue-600">{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
            </div>

            {/* --- 4 THẺ CHỈ SỐ (STAT CARDS) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Doanh thu */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Tổng Doanh Thu</p>
                        <h3 className="text-3xl font-extrabold">{formatCurrency(stats?.totalRevenue)}</h3>
                        <p className="text-xs text-blue-200 mt-2">Dựa trên các đơn hàng đã thanh toán (PAID)</p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-300">💰</div>
                </div>

                {/* Card 2: Khách hàng */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Tài khoản</p>
                            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-lg leading-none">👥</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-zinc-900">{stats?.totalUsers || 0}</h3>
                    </div>
                    <Link to="/admin/users" className="text-xs font-bold text-purple-600 hover:text-purple-800 mt-4 flex items-center">
                        Quản lý người dùng <span className="ml-1">→</span>
                    </Link>
                </div>

                {/* Card 3: Tổng Đơn hàng */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Đơn kiểm định</p>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg leading-none">📦</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-zinc-900">{stats?.totalSessions || 0}</h3>
                    </div>
                    <p className="text-xs font-medium text-emerald-600 mt-4 bg-emerald-50 px-2 py-1 rounded w-fit">
                        Luồng công việc tổng thể
                    </p>
                </div>

                {/* Card 4: Tồn đọng (Pending) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Đang chờ xử lý</p>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg leading-none">⏳</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-amber-600">{stats?.pendingSessions || 0}</h3>
                    </div>
                    {/* Progress Bar nhỏ */}
                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1">
                            <span>Tỷ lệ hoàn thành</span>
                            <span>{stats?.totalSessions ? Math.round(((stats.totalSessions - (stats.pendingSessions || 0)) / stats.totalSessions) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-1.5">
                            <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{ width: `${stats?.totalSessions ? (((stats.totalSessions - (stats.pendingSessions || 0)) / stats.totalSessions) * 100) : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC THÔNG TIN BỔ SUNG --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lối tắt (Quick Actions) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">Hành động nhanh</h3>
                    <div className="space-y-3">
                        <Link to="/admin/parts" className="flex items-center p-3 rounded-xl border border-zinc-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-xl transition-colors mr-3">⚙️</div>
                            <div>
                                <p className="text-sm font-bold text-zinc-900 group-hover:text-blue-700">Cấu hình Phụ tùng</p>
                                <p className="text-xs text-zinc-500">Cập nhật giá và AI Class</p>
                            </div>
                        </Link>
                        <Link to="/qc" className="flex items-center p-3 rounded-xl border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-emerald-100 flex items-center justify-center text-xl transition-colors mr-3">🔍</div>
                            <div>
                                <p className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700">Vào trạm kiểm định</p>
                                <p className="text-xs text-zinc-500">Xử lý {stats?.pendingSessions || 0} đơn đang chờ</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Giả lập Trạng thái hệ thống */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">Trạng thái hạ tầng AI</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">Cloudinary Storage</p>
                                    <p className="text-xs text-zinc-500">Đồng bộ hình ảnh: Hoạt động bình thường</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Stable</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">AI Model Endpoint (Python API)</p>
                                    <p className="text-xs text-zinc-500">Độ trễ trung bình: 120ms</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Stable</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC BIỂU ĐỒ TRỰC QUAN --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Biểu đồ Xu hướng Doanh thu */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-6">Xu hướng doanh thu (7 ngày qua)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dx={-10}
                                    tickFormatter={(value) => `${value / 1000000}M`}
                                />
                                <Tooltip
                                    formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ Tỷ lệ Lỗi */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-6">Phân tích chất lượng</h3>
                    <div className="h-64 flex flex-col items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData.defectData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                    {chartData.defectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Chữ hiển thị ở giữa Donut Chart được tính toán tự động */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-emerald-500">{passedPercentage}%</span>
                            <span className="text-xs font-bold text-zinc-400">Tỷ lệ Đạt</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {chartData.defectData.map(item => (
                            <div key={item.name} className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};