import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền nếu có yêu cầu
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirect về trang chính nếu không có quyền
    return <Navigate to="/admin/templates" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
