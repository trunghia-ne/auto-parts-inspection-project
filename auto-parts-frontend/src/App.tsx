// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import  CustomerDashboard  from './components/CustomerDashboard';
import { InspectionPage } from './components/InspectionPage';
import { AdminDashboard } from './components/AdminDashboard'; // Đảm bảo import đúng thư mục
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPartManagement } from './components/AdminPartManagement';
import { AdminLayout } from './components/AdminLayout';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminReport } from './components/AdminReport';
import Register from './components/Register'; 
import PaymentResult from './components/PaymentResult';

const Unauthorized: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
    <h1 className="text-4xl font-extrabold text-red-600 mb-2">403 - Từ chối truy cập</h1>
    <p className="text-gray-500 mb-4">Tài khoản của bạn không có quyền hạn để xem khu vực này.</p>
    <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">Đăng nhập lại</button>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- CÁC ROUTE CÔNG KHAI (AI CŨNG TRUY CẬP ĐƯỢC) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* 🔥 Bước 2: Thêm Route đăng ký tại đây */}
        <Route path="/unauthorized" element={<Unauthorized />} />
{/* 🔥 THÊM ROUTE NÀY VÀO ĐỂ HỨNG KẾT QUẢ VNPAY TRẢ VỀ */}
        <Route path="/payment-result" element={<PaymentResult />} />
        {/* --- ROUTE CHO KHÁCH HÀNG --- */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />

        {/* --- ROUTE CHO QC / KIỂM ĐỊNH VIÊN --- */}
        <Route path="/qc" element={
          <ProtectedRoute allowedRoles={['ROLE_QC']}>
            <InspectionPage />
          </ProtectedRoute>
        } />

        {/* --- ROUTE CHO ADMIN (QUẢN TRỊ VIÊN) --- */}
        {/* 🔥 QUAN TRỌNG: Phải có /* ở cuối thì nó mới bọc được các route con bên trong */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                {/* Route này sẽ khớp với URL: /admin/parts */}
                <Route path="parts" element={<AdminPartManagement />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="reports" element={<AdminReport />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* TỰ ĐỘNG ĐIỀU HƯỚNG NẾU SAI URL */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;