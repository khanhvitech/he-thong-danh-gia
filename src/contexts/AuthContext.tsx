import React, { createContext, useContext, useState, ReactNode } from 'react';

// Định nghĩa các role trong hệ thống
export type UserRole = 'admin' | 'template_editor';

export interface User {
  username: string;
  role: UserRole;
  displayName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Định nghĩa quyền hạn cho từng role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['view_templates', 'create_templates', 'edit_templates', 'delete_templates', 'view_history'],
  template_editor: ['view_templates', 'create_templates', 'edit_templates']
};

// Danh sách tài khoản (có thể chuyển sang backend sau)
const USERS: Array<{ username: string; password: string; role: UserRole; displayName: string }> = [
  {
    username: 'Admin',
    password: 'ViTechGroup2025@',
    role: 'admin',
    displayName: 'Quản trị viên'
  },
  {
    username: 'TemplateEditor',
    password: 'Template2025@',
    role: 'template_editor',
    displayName: 'Biên tập viên'
  }
];

// Hàm kiểm tra auth từ localStorage (chạy đồng bộ khi khởi tạo)
const getInitialAuthState = (): { isAuthenticated: boolean; user: User | null } => {
  try {
    const authData = localStorage.getItem('authData');
    console.log('[AuthContext] getInitialAuthState - authData from localStorage:', authData);
    if (authData) {
      const parsed = JSON.parse(authData);
      console.log('[AuthContext] getInitialAuthState - parsed:', parsed);
      // Validate user data có đầy đủ các field cần thiết
      if (parsed && parsed.username && parsed.role && parsed.displayName) {
        console.log('[AuthContext] getInitialAuthState - valid user, returning:', parsed);
        return { isAuthenticated: true, user: parsed };
      }
      // Nếu data cũ không đúng format, xóa và yêu cầu đăng nhập lại
      console.warn('[AuthContext] Invalid auth data format, clearing...');
      localStorage.removeItem('authData');
      localStorage.removeItem('authToken');
    }
    console.log('[AuthContext] getInitialAuthState - no valid auth, returning null');
    return { isAuthenticated: false, user: null };
  } catch (e) {
    console.error('[AuthContext] getInitialAuthState error:', e);
    return { isAuthenticated: false, user: null };
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Khởi tạo state từ localStorage ngay từ đầu để tránh bị đăng xuất khi F5
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialState.isAuthenticated);
  const [user, setUser] = useState<User | null>(initialState.user);

  const login = (username: string, password: string): boolean => {
    console.log('[AuthContext] Login attempt:', username);
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const userData: User = {
        username: foundUser.username,
        role: foundUser.role,
        displayName: foundUser.displayName
      };
      console.log('[AuthContext] Login success, userData:', userData);
      setIsAuthenticated(true);
      setUser(userData);
      // Xóa key cũ và lưu data mới
      localStorage.removeItem('authToken');
      localStorage.setItem('authData', JSON.stringify(userData));
      console.log('[AuthContext] Saved to localStorage:', localStorage.getItem('authData'));
      return true;
    }
    console.log('[AuthContext] Login failed');
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authData');
    localStorage.removeItem('authToken'); // Xóa cả key cũ
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, hasPermission }}>
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
