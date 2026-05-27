import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, LayoutDashboard, Store, Package, FileText, User, Cpu, Menu, Building2, LayoutTemplate, History } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SidebarItem: React.FC<{ to: string, icon: React.ReactNode, label: string, collapsed: boolean }> = ({ to, icon, label, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  // Clean up the label for the tooltip by removing the arabic part or just keep the whole thing
  const tooltipText = label.split(' /')[0];

  return (
    <Link 
      to={to} 
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      title={collapsed ? tooltipText : undefined}
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`sidebar glass-card ${isMobileMenuOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src="/cscs.png" 
              alt="CSCS ESL CONNECT APP" 
              className="logo-full"
              style={{ width: '180px', maxWidth: '100%', height: 'auto', objectFit: 'contain', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} 
            />
            <img 
              src="/cscs-logo-square-dark.png" 
              alt="CSCS" 
              className="logo-small"
              style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} 
            />
          </div>
          <button className="sidebar-toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard / لوحة التحكم" collapsed={isSidebarCollapsed} />
          <SidebarItem to="/merchants" icon={<Building2 size={20} />} label="Merchants / التجار" collapsed={isSidebarCollapsed} />
          {(user?.permissions?.includes('store') || false) && (
            <SidebarItem to="/stores" icon={<Store size={20} />} label="Stores / المتاجر" collapsed={isSidebarCollapsed} />
          )}
          {(user?.permissions?.includes('product') || false) && (
            <SidebarItem to="/products" icon={<Package size={20} />} label="Products / المنتجات" collapsed={isSidebarCollapsed} />
          )}
          {(user?.permissions?.includes('template') || false) && (
            <SidebarItem to="/templates" icon={<LayoutTemplate size={20} />} label="Templates / القوالب" collapsed={isSidebarCollapsed} />
          )}
          {(user?.permissions?.includes('equipment') || false) && (
            <SidebarItem to="/devices" icon={<Cpu size={20} />} label="Devices / الأجهزة" collapsed={isSidebarCollapsed} />
          )}
          {(user?.permissions?.includes('log') || false) && (
            <SidebarItem to="/audit-logs" icon={<History size={20} />} label="Audit Logs / سجلات المراجعة" collapsed={isSidebarCollapsed} />
          )}
          {(user?.permissions?.includes('staffManager') || false) && (
            <SidebarItem to="/users" icon={<User size={20} />} label="Staff Users / الموظفين" collapsed={isSidebarCollapsed} />
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} title={isSidebarCollapsed ? "Toggle Theme" : undefined}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="label">{theme === 'light' ? 'Dark Mode / الوضع الداكن' : 'Light Mode / الوضع المضيء'}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header glass-card">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">CSCS ESL CONNECT APP / منصة بطاقات الأسعار الرقمية</h1>
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
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: hidden;
        }

        .sidebar.collapsed {
          width: 84px;
        }

        .sidebar-header {
          margin-bottom: 32px;
          padding: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex: 1;
          padding: 8px 0;
          overflow: hidden;
        }

        .logo-full {
          display: block;
          transition: opacity 0.2s;
        }

        .logo-small {
          display: none;
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .sidebar.collapsed .logo-full {
          display: none;
        }

        .sidebar.collapsed .logo-small {
          display: block;
          margin: 0 auto;
        }

        .sidebar-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .sidebar-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-color);
        }

        .sidebar.collapsed .sidebar-header {
          flex-direction: column;
          gap: 16px;
          justify-content: center;
        }

        .sidebar.collapsed .logo-container {
          padding: 0;
          justify-content: center;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: var(--primary-color);
          letter-spacing: -0.5px;
          white-space: nowrap;
        }

        .logo-subtext {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-top: -4px;
          white-space: nowrap;
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
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar.collapsed .sidebar-item {
          padding: 12px;
          justify-content: center;
        }

        .sidebar.collapsed .sidebar-item .label {
          display: none;
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
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar.collapsed .theme-toggle {
          padding: 12px;
          justify-content: center;
        }

        .sidebar.collapsed .theme-toggle .label {
          display: none;
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

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          margin-right: 12px;
        }

        .mobile-overlay {
          display: none;
        }

        /* Responsive Media Queries */
        @media (max-width: 1024px) {
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: -300px;
            width: 260px; /* Always full width on mobile */
            height: calc(100vh - 32px);
            transition: left 0.3s ease-in-out;
            z-index: 1000;
          }

          .sidebar.collapsed {
            width: 260px; /* Override collapsed state on mobile */
          }

          .sidebar.collapsed .sidebar-item {
            padding: 12px 16px;
            justify-content: flex-start;
          }

          .sidebar.collapsed .sidebar-item .label,
          .sidebar.collapsed .theme-toggle .label,
          .sidebar.collapsed .logo-full {
            display: block;
          }

          .sidebar.collapsed .logo-small,
          .sidebar.collapsed .sidebar-toggle-btn {
            display: none;
          }

          .sidebar.collapsed .sidebar-header {
            flex-direction: row;
            justify-content: center;
          }

          .sidebar.mobile-open {
            left: 0;
          }

          .mobile-overlay {
            display: block;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
          }

          .main-content {
            padding-left: 16px;
          }
        }

        @media (max-width: 768px) {
          .main-header {
            padding: 0 16px;
          }
          
          .page-title {
            font-size: 15px;
          }

          .user-info {
            display: none; /* Hide user text on very small screens to save space */
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
