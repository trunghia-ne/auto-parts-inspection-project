import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login'; 
import { InspectionPage } from './components/InspectionPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold text-blue-900 mb-2">
                    Hệ thống Quản lý Kiểm định Auto Parts
                  </h1>
                </div>
                <InspectionPage/>
                {/* <ApiTest /> */}
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;