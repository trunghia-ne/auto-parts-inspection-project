import React, { useState, useEffect } from 'react';
import { adminApi, type UserResponse } from '../api/adminApi';

export const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state đầy đủ cả thông tin login lẫn doanh nghiệp
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        companyName: '',
        email: '',
        phoneNumber: '',
        taxCode: '',
        address: '',
        role: 'CUSTOMER' // Mặc định quyền khi tạo mới
    });
    const availableRoles = ['ADMIN', 'QC', 'CUSTOMER'];

    // --- State cho tính năng Phân trang ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await adminApi.getAllUsers();
            setUsers(data);
            setCurrentPage(1);
        } catch (error) {
            alert('Lỗi tải danh sách người dùng!');
        }
    };

    // --- Tính toán dữ liệu Phân trang ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // --- Khởi tạo Form Thêm mới ---
    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            username: '', password: '', fullName: '', companyName: '',
            email: '', phoneNumber: '', taxCode: '', address: '', role: 'CUSTOMER'
        });
        setIsModalOpen(true);
    };

    // --- Khởi tạo Form Chỉnh sửa ---
    const handleOpenEdit = (user: UserResponse) => {
        setEditingId(user.id);
        setFormData({
            username: user.username,
            password: '', // Không sửa password ở đây
            fullName: user.fullName || '',
            companyName: user.companyName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            taxCode: user.taxCode || '',
            address: user.address || '',
            role: user.roles && user.roles.length > 0 ? user.roles[0] : 'CUSTOMER'
        });
        setIsModalOpen(true);
    };

    // --- Submit dữ liệu (Rẽ nhánh Thêm / Sửa) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                // Luồng Sửa: Map lại data theo cấu trúc Backend chờ
                await adminApi.updateUser(editingId, {
                    fullName: formData.fullName,
                    companyName: formData.companyName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    taxCode: formData.taxCode,
                    address: formData.address,
                    roles: [formData.role]
                });
                alert('Cập nhật tài khoản thành công!');
            } else {
                // Luồng Thêm mới: Đẩy thẳng cục formData sang API Register
                await adminApi.createUser(formData);
                alert('Tạo tài khoản người dùng mới thành công!');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Xác nhận xóa tài khoản này? Hành động này có thể ảnh hưởng đến lịch sử đơn hàng liên quan.')) return;
        try {
            await adminApi.deleteUser(id);
            fetchUsers();
        } catch (error) {
            alert('Không thể xóa người dùng này do ràng buộc dữ liệu!');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* --- HEADER TIÊU ĐỀ --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <div>
                        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Quản lý Người dùng</h1>
                        <p className="text-zinc-500 text-sm mt-1">Cấu hình tài khoản Đối tác hệ thống & Phân quyền nhân sự</p>
                    </div>
                    <button 
                        onClick={handleOpenCreate}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-sm shadow-blue-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>➕</span> Thêm người dùng mới
                    </button>
                </div>

                {/* --- BẢNG DỮ LIỆU CÔNG NGHIỆP --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Username</th>
                                    <th className="p-4">Doanh nghiệp / Khách hàng</th>
                                    <th className="p-4">Thông tin liên hệ</th>
                                    <th className="p-4">Phân quyền (Roles)</th>
                                    <th className="p-4 text-center pr-6">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 text-zinc-700">
                                {currentItems.map(user => (
                                    <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-zinc-900">
                                            <span className="text-zinc-400 font-normal mr-0.5"></span>{user.username}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-blue-600">{user.companyName || 'Khách hàng cá nhân'}</div>
                                            <div className="text-zinc-500 text-xs mt-0.5">{user.fullName || 'Chưa cập nhật tên'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-zinc-800 font-medium">{user.email || '---'}</div>
                                            <div className="text-zinc-500 text-xs mt-0.5">{user.phoneNumber || '---'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.roles?.map(r => (
                                                    <span key={r} className={`inline-block px-2.5 py-1 rounded-md font-mono text-[10px] font-bold border 
                                                        ${r === 'ROLE_ADMIN' || r === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                                          r === 'ROLE_QC' || r === 'QC' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                          'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                        {r.replace('ROLE_', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center pr-6 space-x-1">
                                            <button onClick={() => handleOpenEdit(user)} className="px-3 py-1.5 text-zinc-700 hover:text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-colors text-xs">Sửa</button>
                                            <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 font-bold rounded-lg transition-colors text-xs">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- ĐIỀU HƯỚNG PHÂN TRANG --- */}
                    {users.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 px-6 py-4 border-t border-zinc-200">
                            <span className="text-xs font-medium text-zinc-500">
                                Hiển thị <span className="font-bold text-zinc-800">{indexOfFirstItem + 1}</span> - <span className="font-bold text-zinc-800">{Math.min(indexOfLastItem, users.length)}</span> trên tổng số <span className="font-bold text-zinc-800">{users.length}</span> tài khoản
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg disabled:opacity-40 text-xs font-bold">◀ Trước</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button key={page} onClick={() => handlePageChange(page)} className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === page ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-200/60'}`}>{page}</button>
                                ))}
                                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg disabled:opacity-40 text-xs font-bold">Sau ▶</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- MODAL DIALOG THÊM / SỬA --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
                            <div className="border-b border-zinc-100 pb-4 mb-5 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-extrabold text-zinc-900">{editingId ? '⚙️ Cập nhật Hồ sơ User' : '👤 Tạo Người dùng mới'}</h2>
                                    <p className="text-zinc-400 text-xs mt-1">Vui lòng nhập đầy đủ thông tin định danh hệ thống.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-rose-500 text-2xl leading-none">&times;</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* 🔥 CHỈ HIỂN THỊ Ô USERNAME/PASSWORD KHI TẠO MỚI */}
                                {!editingId && (
                                    <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Tên đăng nhập</label>
                                            <input required type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
                                                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Mật khẩu</label>
                                            <input required type="password" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
                                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Doanh nghiệp / Xưởng</label>
                                        <input type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                            value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Người đại diện</label>
                                        <input type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                            value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Email liên hệ</label>
                                        <input type="email" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Số điện thoại</label>
                                        <input type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                            value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Mã số thuế</label>
                                        <input type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                            value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Địa chỉ trụ sở</label>
                                        <input type="text" className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900" 
                                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t border-zinc-100 mt-4">
                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Vai trò hệ thống (System Role)</label>
                                    <div className="flex gap-4">
                                        {availableRoles.map(r => (
                                            <label key={r} className={`flex items-center cursor-pointer p-3 border rounded-xl transition-all flex-1 justify-center ${formData.role.replace('ROLE_', '') === r ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 font-bold text-blue-700' : 'hover:bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="roleSelect"
                                                    value={r}
                                                    checked={formData.role.replace('ROLE_', '') === r} 
                                                    onChange={() => setFormData({...formData, role: r})}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm">{r}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-100">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl">Hủy</button>
                                    <button type="submit" disabled={isLoading} className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm active:scale-95 disabled:opacity-50">
                                        {isLoading ? 'Đang lưu...' : 'Xác nhận'}
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