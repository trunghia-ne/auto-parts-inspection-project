import { useEffect, useState } from 'react';
import { partService } from '../api/partService';
import type { Part } from '../api/partService';

export default function ManagerDashboard() {
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchParts();
    }, []);

    const fetchParts = async () => {
        try {
            const data = await partService.getAllParts();
            setParts(data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách phụ tùng:", error);
            alert("Không thể tải dữ liệu. Vui lòng kiểm tra lại kết nối hoặc Token.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phụ tùng này?")) {
            try {
                await partService.deletePart(id);
                setParts(parts.filter(p => p.id !== id)); // Cập nhật lại UI sau khi xóa
            } catch (error) {
                alert("Xóa thất bại!");
            }
        }
    };

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Quản Lý Danh Mục Phụ Tùng</h1>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Danh sách từ Database</h3>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition">
                        + Thêm Phụ Tùng Mới
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase font-semibold">
                        <tr>
                            <th className="p-4">Mã PT</th>
                            <th className="p-4">Tên Phụ Tùng</th>
                            <th className="p-4">Thông Số Kỹ Thuật</th>
                            <th className="p-4 text-right">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Đang tải dữ liệu...</td></tr>
                        ) : parts.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center">Chưa có dữ liệu.</td></tr>
                        ) : (
                            parts.map((part) => (
                                <tr key={part.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-mono font-bold text-slate-700">{part.partCode}</td>
                                    <td className="p-4 font-medium text-slate-900">{part.partName}</td>
                                    <td className="p-4 text-gray-500">{part.specifications}</td>
                                    <td className="p-4 text-right space-x-3">
                                        <button className="text-blue-600 hover:underline font-medium">Sửa</button>
                                        <button onClick={() => handleDelete(part.id)} className="text-red-600 hover:underline font-medium">Xóa</button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}