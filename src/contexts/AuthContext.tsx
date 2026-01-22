import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Thông tin đăng nhập (có thể chuyển sang backend sau)
const ADMIN_CREDENTIALS = {
  username: 'Admin',
  password: 'ViTechGroup2025@'
};

// Hàm kiểm tra auth từ localStorage (chạy đồng bộ khi khởi tạo)
const getInitialAuthState = (): boolean => {
  try {
    return localStorage.getItem('authToken') === 'authenticated';
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Khởi tạo state từ localStorage ngay từ đầu để tránh bị đăng xuất khi F5
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getInitialAuthState);

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      localStorage.setItem('authToken', 'authenticated');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
