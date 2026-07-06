// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[]; // Danh sách các Role được phép vào trang này
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('auth_token');
  const rolesRaw = localStorage.getItem('user_roles');
  
  // Parse mảng các role từ localStorage (ví dụ: ["ROLE_CUSTOMER"] hoặc ["ROLE_ADMIN"])
  const userRoles: string[] = rolesRaw ? JSON.parse(rolesRaw) : [];

  // 1. Kiểm tra đăng nhập
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 2. ĐẶC QUYỀN ADMIN: Nếu trong mảng roles có chứa 'ROLE_ADMIN', auto mở cửa cho qua luôn
  if (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ADMIN')) {
    return <>{children}</>;
  }

  // 3. Kiểm tra phân quyền thông thường cho các Role khác
  // (User có sở hữu ít nhất 1 role nằm trong danh sách allowedRoles không)
  const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasPermission) {
    // Nếu sai quyền, đá về trang từ chối truy cập công cộng
    return <Navigate to="/unauthorized" replace />;
  }

  // Hợp lệ thì cho đi tiếp vào giao diện bên trong
  return <>{children}</>;
};