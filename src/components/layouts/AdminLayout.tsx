import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Bộ câu hỏi', href: '/admin/templates', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);
  
  // Hiển thị role badge dựa trên role của user
  const getRoleBadge = () => {
    if (!user) return { text: 'Guest', className: 'bg-gray-100 text-gray-800' };
    switch (user.role) {
      case 'admin':
        return { text: 'Admin', className: 'bg-primary-100 text-primary-800' };
      case 'template_editor':
        return { text: 'Biên tập', className: 'bg-green-100 text-green-800' };
      default:
        return { text: 'Guest', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  const roleBadge = getRoleBadge();

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                📋 Hệ Thống Đánh Giá
              </h1>
              <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${roleBadge.className}`}>
                {roleBadge.text}
              </span>
              {user && (
                <span className="ml-2 text-sm text-gray-600">
                  ({user.displayName})
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
