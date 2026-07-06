import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi'; // Bỏ comment sau khi nối API

// Cấu trúc dữ liệu mẫu (Sau này sẽ lấy từ Backend)
interface ReportSession {
    id: number;
    lotCode: string;
    customerName: string;
    createdAt: string;
    paymentStatus: string;
    totalAmount: number;
    status: string;
}

export const AdminReport: React.FC = () => {
    // Lấy ngày hiện tại làm mặc định
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(firstDayOfMonth);
    const [toDate, setToDate] = useState(today);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isLoading, setIsLoading] = useState(false);

    // State chứa dữ liệu
    const [data, setData] = useState<ReportSession[]>([]);
    const [summary, setSummary] = useState({ revenue: 0, totalOrders: 0, failedOrders: 0 });


    useEffect(() => {
        // Lần đầu load trang, tự động chạy hàm lọc với ngày mặc định
        handleFilter();
    }, []);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            // Gọi API thật từ Backend
            const dataFromServer = await adminApi.getReports(fromDate, toDate, statusFilter);
            setData(dataFromServer);

            // Tính toán summary cards dựa trên dữ liệu thật
            const revenue = dataFromServer.filter((x: any) => x.paymentStatus === 'PAID').reduce((sum: number, item: any) => sum + item.totalAmount, 0);
            const total = dataFromServer.length;
            const failed = dataFromServer.filter((x: any) => x.status === 'FAILED').length;

            setSummary({ revenue, totalOrders: total, failedOrders: failed });
        } catch (error) {
            console.error('Lỗi lấy dữ liệu báo cáo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lịch sử & Báo cáo</h1>
                <p className="text-slate-500 mt-1 font-medium">Tra cứu giao dịch chi tiết theo thời gian</p>
            </div>

            {/* BỘ LỌC (FILTERS) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Từ ngày</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-800 text-slate-700 font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đến ngày</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-800 text-slate-700 font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trạng thái</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-800 text-slate-700 font-medium bg-white">
                            <option value="ALL">Tất cả</option>
                            <option value="PASSED">Đạt (PASSED)</option>
                            <option value="FAILED">Lỗi (FAILED)</option>
                            <option value="PENDING">Chờ AI quét</option>
                            <option value="PENDING_EXPERT">Chờ Chuyên gia</option>
                        </select>
                    </div>
                    <div>
                        <button onClick={handleFilter} disabled={isLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2">
                            <span>{isLoading ? '⏳' : '▽'}</span>
                            {isLoading ? 'Đang lọc...' : 'Lọc dữ liệu'}
                        </button>
                    </div>
                </div>
            </div>

            {/* THẺ TÓM TẮT (SUMMARY CARDS) - ĐÚNG STYLE ẢNH MẪU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Thẻ Doanh Thu (Viền Cam) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-orange-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng doanh thu kỳ lọc</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(summary.revenue)}</h3>
                </div>
                {/* Thẻ Tổng Đơn (Viền Xanh dương) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng số đơn</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{summary.totalOrders} <span className="text-base font-medium text-slate-500">đơn</span></h3>
                </div>
                {/* Thẻ Đơn Lỗi/Hủy (Viền Đỏ) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn lỗi / Đã hủy</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{summary.failedOrders} <span className="text-base font-medium text-slate-500">đơn</span></h3>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4 pl-6">Mã ĐH / Lô</th>
                                <th className="p-4">Thời gian</th>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Thanh toán</th>
                                <th className="p-4">Tổng tiền</th>
                                <th className="p-4">Trạng thái QC</th>
                                <th className="p-4 text-center pr-6">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 pl-6 font-bold text-slate-900">#{item.id} - {item.lotCode}</td>
                                    <td className="p-4 text-slate-500 font-medium">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 font-bold text-slate-700">{item.customerName}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${item.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.paymentStatus === 'PAID' ? 'Đã TT' : 'Chưa TT'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-extrabold text-slate-900">{formatCurrency(item.totalAmount)}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                            item.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' :
                                            item.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center pr-6">
                                        <button className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-colors text-xs border border-blue-200">
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        Không tìm thấy dữ liệu nào trong khoảng thời gian này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};