// import { useEffect, useState } from 'react';
// import { 
//   Users, 
//   UserPlus, 
//   Edit2, 
//   Trash2, 
//   Key, 
//   Shield, 
//   User as UserIcon, 
//   Check, 
//   X, 
//   Loader2, 
//   AlertTriangle,
//   Search,
//   RefreshCw
// } from 'lucide-react';
// import { userService, type User } from '../api/userService';

// const roleBadgeClass = (role: string) => {
//   switch (role) {
//     case 'ROLE_ADMIN':
//       return 'bg-red-500/10 text-red-500 border border-red-500/20';
//     case 'ROLE_MANAGER':
//       return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
//     case 'ROLE_STAFF':
//       return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
//     case 'ROLE_SUPPLIER':
//       return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
//     default:
//       return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
//   }
// };

// const UserManagement = () => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   // Search and filter states
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Modal states
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<User | null>(null);
  
//   // Form states
//   const [formUsername, setFormUsername] = useState('');
//   const [formPassword, setFormPassword] = useState('');
//   const [formRoles, setFormRoles] = useState<string[]>(['ROLE_STAFF']);
//   const [formLoading, setFormLoading] = useState(false);
  
//   // Delete confirm state
//   const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

//   // Available roles for checkbox mapping
//   const availableRoles = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF', 'ROLE_SUPPLIER'];

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const data = await userService.getAllUsers();
//       setUsers(data);
//       setError(null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Không thể tải danh sách nhân viên. Vui lòng kiểm tra kết nối backend.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const showSuccess = (msg: string) => {
//     setSuccessMsg(msg);
//     setTimeout(() => setSuccessMsg(null), 4000);
//   };

//   const handleOpenCreateModal = () => {
//     setEditingUser(null);
//     setFormUsername('');
//     setFormPassword('');
//     setFormRoles(['ROLE_STAFF']);
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (user: User) => {
//     setEditingUser(user);
//     setFormUsername(user.username);
//     setFormPassword('');
//     setFormRoles(user.roles);
//     setIsModalOpen(true);
//   };

//   const handleToggleRole = (role: string) => {
//     if (formRoles.includes(role)) {
//       if (formRoles.length > 1) {
//         setFormRoles(formRoles.filter(r => r !== role));
//       } else {
//         // Prevent having zero roles
//         setError('Nhân viên phải có ít nhất một quyền/vai trò.');
//         setTimeout(() => setError(null), 3000);
//       }
//     } else {
//       setFormRoles([...formRoles, role]);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formUsername.trim()) return;
    
//     setFormLoading(true);
//     setError(null);

//     const payload = {
//       username: formUsername.trim(),
//       roles: formRoles,
//       ...(formPassword.trim() ? { password: formPassword.trim() } : {})
//     };

//     try {
//       if (editingUser) {
//         // Edit User
//         const updated = await userService.updateUser(editingUser.id, payload);
//         setUsers(users.map(u => u.id === editingUser.id ? updated : u));
//         showSuccess(`Đã cập nhật tài khoản "${updated.username}" thành công.`);
//       } else {
//         // Create User
//         if (!formPassword.trim()) {
//           setError('Mật khẩu không được để trống khi tạo tài khoản mới.');
//           setFormLoading(false);
//           return;
//         }
//         const created = await userService.createUser(payload as any);
//         setUsers([created, ...users]);
//         showSuccess(`Đã tạo tài khoản "${created.username}" thành công.`);
//       }
//       setIsModalOpen(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình lưu thông tin.');
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   const handleDeleteUser = async (id: number, username: string) => {
//     try {
//       await userService.deleteUser(id);
//       setUsers(users.filter(u => u.id !== id));
//       showSuccess(`Đã xóa tài khoản "${username}" thành công.`);
//       setDeleteConfirmId(null);
//     } catch (err: any) {
//       setError(err.response?.data?.message || `Không thể xóa tài khoản ${username}.`);
//       setDeleteConfirmId(null);
//     }
//   };

//   // Filtered users
//   const filteredUsers = users.filter(user => 
//     user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-800">Quản lý nhân sự</h2>
//           <p className="text-sm text-slate-500 mt-1">
//             Quản lý tài khoản nhân viên, phân vai trò và cấu hình quyền truy cập hệ thống.
//           </p>
//         </div>
//         <button
//           type="button"
//           onClick={handleOpenCreateModal}
//           className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20 text-sm hover:-translate-y-0.5"
//         >
//           <UserPlus className="w-4 h-4" />
//           Thêm tài khoản mới
//         </button>
//       </div>

//       {/* Alert Notifications */}
//       {error && (
//         <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-pulse">
//           <AlertTriangle className="w-5 h-5 shrink-0" />
//           <p className="font-semibold">{error}</p>
//         </div>
//       )}

//       {successMsg && (
//         <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 font-bold shadow-sm">
//           <Check className="w-5 h-5 shrink-0 text-emerald-500" />
//           <p>{successMsg}</p>
//         </div>
//       )}

//       {/* Search Bar & Action bar */}
//       <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
//         <div className="relative w-full sm:w-80">
//           <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Tìm theo tên hoặc vai trò..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium"
//           />
//         </div>
//         <button
//           type="button"
//           onClick={fetchUsers}
//           className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-semibold"
//         >
//           <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//           Làm mới bảng
//         </button>
//       </div>

//       {/* Users Table */}
//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//         {loading ? (
//           <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
//             <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
//             <p className="font-medium text-sm">Đang tải danh sách tài khoản...</p>
//           </div>
//         ) : filteredUsers.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
//             <Users className="w-16 h-16 mb-3 opacity-20" />
//             <p className="font-semibold text-lg">Không tìm thấy tài khoản nào</p>
//             <p className="text-sm mt-1 text-slate-500">Vui lòng thử từ khóa khác hoặc thêm tài khoản mới.</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 text-left">
//                   <th className="px-6 py-4 font-bold">Mã số (ID)</th>
//                   <th className="px-6 py-4 font-bold">Tài khoản (Username)</th>
//                   <th className="px-6 py-4 font-bold">Chức vụ / Quyền truy cập</th>
//                   <th className="px-6 py-4 font-bold text-center">Hành động</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {filteredUsers.map((user) => (
//                   <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
//                     <td className="px-6 py-4 font-mono font-semibold text-slate-400">#{user.id}</td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
//                           <UserIcon className="w-4 h-4" />
//                         </div>
//                         <span className="font-bold text-slate-800">{user.username}</span>
//                         {localStorage.getItem('username') === user.username && (
//                           <span className="bg-slate-200 text-slate-700 text-xs px-1.5 py-0.5 rounded font-medium">Bạn</span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex flex-wrap gap-2">
//                         {user.roles.map((role) => (
//                           <span 
//                             key={role} 
//                             className={`px-2.5 py-1 rounded-lg text-xs font-bold ${roleBadgeClass(role)}`}
//                           >
//                             {role}
//                           </span>
//                         ))}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       {deleteConfirmId === user.id ? (
//                         <div className="flex items-center justify-center gap-2">
//                           <span className="text-xs text-red-500 font-bold">Xác nhận xóa?</span>
//                           <button
//                             onClick={() => handleDeleteUser(user.id, user.username)}
//                             className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
//                             title="Xóa"
//                           >
//                             <Check className="w-3.5 h-3.5" />
//                           </button>
//                           <button
//                             onClick={() => setDeleteConfirmId(null)}
//                             className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
//                             title="Hủy"
//                           >
//                             <X className="w-3.5 h-3.5" />
//                           </button>
//                         </div>
//                       ) : (
//                         <div className="flex items-center justify-center gap-3">
//                           <button
//                             onClick={() => handleOpenEditModal(user)}
//                             className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all text-xs font-semibold"
//                           >
//                             <Edit2 className="w-3.5 h-3.5" />
//                             Sửa quyền
//                           </button>
//                           <button
//                             onClick={() => setDeleteConfirmId(user.id)}
//                             disabled={localStorage.getItem('username') === user.username}
//                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold
//                               ${localStorage.getItem('username') === user.username 
//                                 ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
//                                 : 'border-red-200 text-red-600 hover:bg-red-50'
//                               }`}
//                           >
//                             <Trash2 className="w-3.5 h-3.5" />
//                             Xóa
//                           </button>
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Modal - Create/Edit User */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//           <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-lg font-bold">{editingUser ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</h3>
//                 <p className="text-xs text-slate-400 mt-1">
//                   {editingUser ? `Đang chỉnh sửa cho nhân viên: ${editingUser.username}` : 'Điền thông tin tài khoản nhân viên'}
//                 </p>
//               </div>
//               <button 
//                 onClick={() => setIsModalOpen(false)}
//                 className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Modal Content */}
//             <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
//               {/* Username Input */}
//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
//                   <UserIcon className="w-4 h-4 text-slate-400" />
//                   Tên tài khoản (Username)
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   placeholder="Nhập tên đăng nhập"
//                   value={formUsername}
//                   onChange={(e) => setFormUsername(e.target.value)}
//                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
//                 />
//               </div>

//               {/* Password Input */}
//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
//                   <Key className="w-4 h-4 text-slate-400" />
//                   Mật khẩu
//                 </label>
//                 <input
//                   type="password"
//                   placeholder={editingUser ? 'Để trống nếu không muốn đổi mật khẩu' : 'Nhập mật khẩu người dùng'}
//                   required={!editingUser}
//                   value={formPassword}
//                   onChange={(e) => setFormPassword(e.target.value)}
//                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
//                 />
//                 {editingUser && (
//                   <p className="text-xs text-slate-400 italic">Bỏ qua trường này để giữ nguyên mật khẩu cũ.</p>
//                 )}
//               </div>

//               {/* Roles Selection */}
//               <div className="space-y-3">
//                 <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
//                   <Shield className="w-4 h-4 text-slate-400" />
//                   Vai trò hệ thống (Quyền truy cập)
//                 </label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {availableRoles.map((role) => {
//                     const isSelected = formRoles.includes(role);
//                     return (
//                       <button
//                         key={role}
//                         type="button"
//                         onClick={() => handleToggleRole(role)}
//                         className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between
//                           ${isSelected 
//                             ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
//                             : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
//                           }`}
//                       >
//                         <span>{role.replace('ROLE_', '')}</span>
//                         {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
//                       </button>
//                     );
//                   })}
//                 </div>
//                 <p className="text-xs text-slate-400 mt-1">Có thể chọn nhiều hơn 1 vai trò cho một tài khoản.</p>
//               </div>

//               {/* Submit Buttons */}
//               <div className="flex gap-3 pt-4 border-t border-slate-100">
//                 <button
//                   type="button"
//                   onClick={() => setIsModalOpen(false)}
//                   className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-slate-600 text-sm text-center"
//                 >
//                   Hủy bỏ
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={formLoading}
//                   className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
//                 >
//                   {formLoading ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     'Lưu thông tin'
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserManagement;
