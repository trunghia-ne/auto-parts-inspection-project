// src/pages/AdminPartManagement.tsx
import React, { useState, useEffect } from 'react';
import { adminApi, type Part } from '../api/adminApi';

export const AdminPartManagement: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Part>({
        partCode: '', partName: '', specifications: '', aiClassId: 0, price: 0
    });

    // --- State cho tính năng Phân trang ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Số lượng phụ tùng trên mỗi trang

    useEffect(() => {
        fetchParts();
    }, []);

    const fetchParts = async () => {
        try {
            const data = await adminApi.getAllParts();
            setParts(data);
            setCurrentPage(1); // Reset về trang 1 khi load lại data
        } catch (error) {
            console.error('Lỗi tải danh sách phụ tùng:', error);
        }
    };

    // --- Tính toán dữ liệu Phân trang ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = parts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(parts.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ partCode: '', partName: '', specifications: '', aiClassId: 0, price: 0 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (part: Part) => {
        setEditingId(part.id!);
        setFormData({ ...part });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) await adminApi.updatePart(editingId, formData);
            else await adminApi.createPart(formData);
            
            setIsModalOpen(false);
            fetchParts();
        } catch (error) {
            alert('Lỗi khi lưu dữ liệu!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Xác nhận xóa phụ tùng này?')) return;
        try {
            await adminApi.deletePart(id);
            fetchParts();
        } catch (error) {
            alert('Không thể xóa phụ tùng này!');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* --- HEADER TIÊU ĐỀ --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <div>
                        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Quản lý Phụ tùng</h1>
                        <p className="text-zinc-500 text-sm mt-1">Cấu hình danh mục thiết bị & lớp phân loại dữ liệu AI</p>
                    </div>
                    <button 
                        onClick={handleOpenCreate}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-sm shadow-blue-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>➕</span> Thêm phụ tùng mới
                    </button>
                </div>

                {/* --- BẢNG DỮ LIỆU CÔNG NGHIỆP --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Mã PT</th>
                                    <th className="p-4">Tên Phụ Tùng</th>
                                    <th className="p-4">Thông số kỹ thuật</th>
                                    <th className="p-4 text-center">AI Class ID</th>
                                    <th className="p-4 text-right">Giá thành</th>
                                    <th className="p-4 text-center pr-6">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 text-zinc-700">
                                {currentItems.map(part => (
                                    <tr key={part.id} className="hover:bg-zinc-50/80 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-zinc-900">
                                            <span className="text-zinc-400 font-normal mr-0.5">#</span>{part.partCode}
                                        </td>
                                        <td className="p-4 text-blue-600 font-semibold">{part.partName}</td>
                                        <td className="p-4 text-zinc-500 max-w-xs truncate">{part.specifications}</td>
                                        <td className="p-4 text-center">
                                            <span className="inline-block px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-md font-mono text-xs font-bold border border-zinc-200">
                                                {part.aiClassId}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-extrabold text-zinc-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(part.price || 0)}
                                        </td>
                                        <td className="p-4 text-center pr-6 space-x-1">
                                            <button 
                                                onClick={() => handleOpenEdit(part)} 
                                                className="px-3 py-1.5 text-zinc-700 hover:text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-colors text-xs"
                                            >
                                                Sửa
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(part.id!)} 
                                                className="px-3 py-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 font-bold rounded-lg transition-colors text-xs"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                
                                {parts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-16 text-center">
                                            <div className="flex flex-col items-center text-zinc-400 space-y-2">
                                                <span className="text-3xl">⚙️</span>
                                                <p className="font-medium text-base">Hệ thống chưa có dữ liệu cấu hình phụ tùng.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION) --- */}
                    {parts.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 px-6 py-4 border-t border-zinc-200">
                            <span className="text-xs font-medium text-zinc-500">
                                Hiển thị <span className="font-bold text-zinc-800">{indexOfFirstItem + 1}</span> - <span className="font-bold text-zinc-800">{Math.min(indexOfLastItem, parts.length)}</span> trên tổng số <span className="font-bold text-zinc-800">{parts.length}</span> danh mục
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold"
                                >
                                    ◀ Trước
                                </button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-zinc-600 hover:bg-zinc-200/60'}`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold"
                                >
                                    Sau ▶
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- MODAL DIALOG THÊM / SỬA --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 animate-in zoom-in-95 duration-200">
                            <div className="border-b border-zinc-100 pb-4 mb-5">
                                <h2 className="text-xl font-extrabold text-zinc-900">
                                    {editingId ? '⚙️ Cập nhật phụ tùng' : '📦 Thêm phụ tùng mới'}
                                </h2>
                                <p className="text-zinc-400 text-xs mt-1">Vui lòng điền chính xác thông tin cấu hình cho AI phân phối đơn hàng.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Mã Phụ tùng</label>
                                    <input required type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 font-bold uppercase" 
                                        value={formData.partCode} onChange={e => setFormData({...formData, partCode: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Tên Phụ tùng</label>
                                    <input required type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 font-medium" 
                                        value={formData.partName} onChange={e => setFormData({...formData, partName: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Thông số kỹ thuật</label>
                                    <input required type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                        value={formData.specifications} onChange={e => setFormData({...formData, specifications: e.target.value})} 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">AI Class ID</label>
                                        <input required type="number" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 font-mono font-bold" 
                                            value={formData.aiClassId} onChange={e => setFormData({...formData, aiClassId: Number(e.target.value)})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Giá (VND)</label>
                                        <input required type="number" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 font-bold" 
                                            value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="px-4 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Đang kết nối...' : 'Lưu dữ liệu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};