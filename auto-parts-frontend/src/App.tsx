import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layouts
import AdminLayout from './layouts/AdminLayout';
import PosLayout from './layouts/PosLayout';

// Import Pages
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào thẳng trang đăng nhập */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Luồng 1: Trang Đăng Nhập (Không dùng Layout chung) */}
        <Route path="/login" element={<Login />} />

        {/* Luồng 2: Trạm Kiểm Định POS (Giao diện đơn giản để bắn ảnh) */}
        <Route path="/pos" element={<PosLayout />} />

        {/* Luồng 3: Trang Quản Lý (Dành cho Manager xem thống kê, quản lý phụ tùng) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ManagerDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;