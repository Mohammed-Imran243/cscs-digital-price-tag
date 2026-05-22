import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, LayoutDashboard, Store, Package, FileText, User, Cpu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SidebarItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`sidebar-item ${isActive ? 'active' : ''}`}
    >
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="logo-text">CSCS</span>
            <span className="logo-subtext">Digital Tag / الوسم الرقمي</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard / لوحة التحكم" />
          {(user?.permissions?.includes('store') || false) && (
            <SidebarItem to="/stores" icon={<Store size={20} />} label="Stores / الفروع" />
          )}
          {(user?.permissions?.includes('product') || false) && (
            <SidebarItem to="/products" icon={<Package size={20} />} label="Products / المنتجات" />
          )}
          {(user?.permissions?.includes('template') || false) && (
            <SidebarItem to="/templates" icon={<FileText size={20} />} label="Templates / القوالب" />
          )}
          {(user?.permissions?.includes('equipment') || false) && (
            <SidebarItem to="/devices" icon={<Cpu size={20} />} label="Devices / الأجهزة" />
          )}
          {(user?.permissions?.includes('log') || false) && (
            <SidebarItem to="/audit-logs" icon={<FileText size={20} />} label="Audit Logs / سجلات المراجعة" />
          )}
          {(user?.permissions?.includes('staffManager') || false) && (
            <SidebarItem to="/users" icon={<User size={20} />} label="Staff Users / الموظفين" />
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'Dark Mode / الوضع الداكن' : 'Light Mode / الوضع المضيء'}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header glass-card">
          <div className="header-left">
            <h1 className="page-title">Digital Price Tag Platform / منصة بطاقات الأسعار الرقمية</h1>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-info">
                <span className="username">{user?.username}</span>
                <span className="user-role">
                  {(() => {
                    const r = user?.role?.toUpperCase();
                    if (r === 'SUPER_ADMIN') return 'Super Admin / مدير النظام';
                    if (r === 'MERCHANT_SUPER_ADMIN') return 'Merchant Super Admin / مسؤول التاجر الرئيسي';
                    if (r === 'MERCHANT') return 'Merchant / تاجر';
                    if (r === 'STAFF') return 'Staff / موظف';
                    return user?.role;
                  })()}
                </span>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout / تسجيل الخروج">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        
        <div className="content-area">
          {children}
        </div>
      </main>

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-primary);
        }

        .sidebar {
          width: 260px;
          height: calc(100vh - 32px);
          margin: 16px;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          z-index: 10;
        }

        .sidebar-header {
          margin-bottom: 40px;
          padding-left: 12px;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: var(--primary-color);
          letter-spacing: -0.5px;
        }

        .logo-subtext {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-top: -4px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          text-decoration: none;
          color: var(--text-secondary);
          transition: all 0.2s;
          font-weight: 500;
        }

        .sidebar-item:hover {
          background: var(--bg-accent);
          color: var(--text-primary);
        }

        .sidebar-item.active {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          font-weight: 500;
        }

        .theme-toggle:hover {
          background: var(--bg-accent);
          color: var(--text-primary);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          padding-left: 0;
          height: 100vh;
          overflow-y: auto;
        }

        .main-header {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          margin-bottom: 16px;
        }

        .page-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .username {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
        }

        .logout-btn {
          background: var(--bg-accent);
          border: none;
          color: var(--text-secondary);
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logout-btn:hover {
          background: var(--danger-color);
          color: white;
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
      `}</style>
    </div>
  );
};

export default Layout;
