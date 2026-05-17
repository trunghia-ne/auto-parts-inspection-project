// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Import Pages
import Login from './pages/Login';
import InspectionPOS from './pages/InspectionPOS';
import ManagerDashboard from './pages/ManagerDashboard';

// Import Layouts
import AdminLayout from './layouts/AdminLayout';
import PosLayout from './layouts/PosLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* ===== LUỒNG CỦA ADMIN / MANAGER ===== */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    {/* Mặc định vào /admin sẽ nhảy sang /admin/dashboard */}
                    <Route index element={<Navigate to="dashboard" replace />} />

                    {/* Các trang con nằm TRONG AdminLayout */}
                    <Route path="dashboard" element={<ManagerDashboard />} />
                    {/* Sau này bạn code trang Quản lý phụ tùng thì ném vào đây: */}
                    {/* <Route path="parts" element={<PartManager />} /> */}
                </Route>

                {/* ===== LUỒNG CỦA TRẠM KIỂM ĐỊNH (POS) ===== */}
                <Route path="/pos" element={<ProtectedRoute><PosLayout /></ProtectedRoute>}>
                    {/* Mặc định vào /pos sẽ load InspectionPOS */}
                    <Route index element={<InspectionPOS />} />
                    {/* Nếu có thêm trang lịch sử kiểm định cho nhân viên: */}
                    {/* <Route path="history" element={<PosHistory />} /> */}
                </Route>

                {/* Nếu gõ bậy URL, mặc định văng về Admin Dashboard */}
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;