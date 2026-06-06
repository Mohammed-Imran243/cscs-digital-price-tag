import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { Home, Sun, Moon, LogOut, LayoutDashboard, Store, Package, User, Cpu, Menu, Building2, LayoutTemplate, History, Smartphone, Settings, Image as ImageIcon, Tag, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SidebarItem: React.FC<{
  to: string,
  icon: React.ReactNode,
  label: string,
  collapsed: boolean,
  subItems?: { label: string, to: string, icon?: React.ReactNode }[],
  onHover?: (rect: DOMRect | null, label: string, subItems: any[], to: string) => void,
  onClickParent?: (rect: DOMRect | null, label: string, subItems: any[], to: string) => void,
  activeFloatingParent?: string
}> = ({ to, icon, label, collapsed, subItems, onHover, onClickParent, activeFloatingParent }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (subItems && subItems.some(item => location.pathname === item.to || location.pathname.startsWith(item.to) || (location.pathname === to && location.search === item.to.split('?')[1])));
  const [expanded, setExpanded] = useState(isActive);

  // Clean up the label for the tooltip by removing the arabic part or just keep the whole thing
  const tooltipText = label.split(' /')[0];

  if (!subItems) {
    return (
      <Link
        to={to}
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        title={collapsed ? tooltipText : undefined}
        onClick={() => {
          onClickParent?.(null, '', [], '');
        }}
      >
        <span className="icon">{icon}</span>
        <span className="label">{label}</span>
      </Link>
    );
  }

  const isParentHighlighted = isActive || activeFloatingParent === to;

  return (
    <div className={`sidebar-group ${isParentHighlighted ? 'active-group' : ''}`}>
      <div
        className={`sidebar-item ${isParentHighlighted ? 'active' : ''}`}
        title={collapsed ? tooltipText : undefined}
        onClick={(e) => {
          if (collapsed) {
            const rect = e.currentTarget.getBoundingClientRect();
            onClickParent?.(rect, label, subItems, to);
          } else {
            setExpanded(!expanded);
          }
        }}
        onMouseEnter={(e) => {
          if (collapsed) {
            const rect = e.currentTarget.getBoundingClientRect();
            onHover?.(rect, label, subItems, to);
          }
        }}
        onMouseLeave={() => {
          if (collapsed) {
            onHover?.(null, label, subItems, to);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <span className="icon">{icon}</span>
        <span className="label accordion-label">
          {label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
      </div>
      {expanded && !collapsed && (
        <div className="sidebar-subitems">
          {subItems.map((sub, idx) => {
            const isSubActive = location.pathname + location.search === sub.to || (!location.search && (sub.to.includes('tab=merchant') || sub.to.includes('tab=esl') || sub.to.includes('tab=users')));
            return (
              <Link
                key={idx}
                to={sub.to}
                className={`sidebar-subitem ${isSubActive ? 'active' : ''}`}
              >
                {sub.icon ? (
                  <span className="subitem-icon" style={{ opacity: isSubActive ? 1 : 0.7 }}>{sub.icon}</span>
                ) : (
                  <div className="subitem-dot" />
                )}
                <span>{sub.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
};

export const getPageTitle = (pathname: string) => {
  if (pathname === '/') return 'Dashboard / لوحة التحكم';
  if (pathname.startsWith('/merchants')) return 'Merchants / التجار';
  if (pathname.startsWith('/stores')) return 'Stores / المتاجر';
  if (pathname.startsWith('/products')) return 'Products / المنتجات';
  if (pathname.startsWith('/price-monitor')) return 'Price Monitor / مراقب الأسعار';
  if (pathname.startsWith('/templates')) return 'Templates / القوالب';
  if (pathname.startsWith('/devices')) return 'Devices / الأجهزة';
  if (pathname.startsWith('/audit-logs')) return 'Audit Logs / سجلات المراجعة';
  if (pathname.startsWith('/users')) return 'Staff Users / الموظفين';
  return 'Dashboard / لوحة التحكم';
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // States and hooks for collapsed sidebar floating submenus
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [floatingMenu, setFloatingMenu] = useState<{
    label: string;
    subItems: { label: string; to: string; icon?: React.ReactNode }[];
    rect: DOMRect;
    to: string;
  } | null>(null);
  const [floatingPosition, setFloatingPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [hoveredSubIndex, setHoveredSubIndex] = useState<number>(-1);

  const timeoutRef = useRef<number | null>(null);
  const floatingMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    if (floatingMenu && floatingMenuRef.current) {
      const menuRect = floatingMenuRef.current.getBoundingClientRect();
      const triggerRect = floatingMenu.rect;
      const viewportHeight = window.innerHeight;

      let top = triggerRect.top;
      if (top + menuRect.height > viewportHeight - 16) {
        top = Math.max(16, viewportHeight - menuRect.height - 16);
      }

      const left = triggerRect.right + 8;
      setFloatingPosition({ top, left });
    }
  }, [floatingMenu]);

  const handleHoverParent = (rect: DOMRect | null, label: string, subItems: any[], to: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (rect) {
      setHoveredSubIndex(-1);
      setFloatingMenu({ label, subItems, rect, to });
    } else {
      timeoutRef.current = window.setTimeout(() => {
        setFloatingMenu(null);
      }, 150);
    }
  };

  const handleClickParent = (rect: DOMRect | null, label: string, subItems: any[], to: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (floatingMenu && floatingMenu.to === to) {
      setFloatingMenu(null);
    } else if (rect) {
      setHoveredSubIndex(-1);
      setFloatingMenu({ label, subItems, rect, to });
    } else {
      setFloatingMenu(null);
    }
  };

  const handleMouseEnterFloatingMenu = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeaveFloatingMenu = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = window.setTimeout(() => {
      setFloatingMenu(null);
    }, 150);
  };

  useEffect(() => {
    if (!floatingMenu) {
      setHoveredSubIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFloatingMenu(null);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setHoveredSubIndex(prev => (prev + 1) % floatingMenu.subItems.length);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setHoveredSubIndex(prev => (prev - 1 + floatingMenu.subItems.length) % floatingMenu.subItems.length);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (hoveredSubIndex >= 0 && hoveredSubIndex < floatingMenu.subItems.length) {
          const subItem = floatingMenu.subItems[hoveredSubIndex];
          navigate(subItem.to);
          setFloatingMenu(null);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [floatingMenu, hoveredSubIndex, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingMenu) {
        const isClickInsideMenu = floatingMenuRef.current?.contains(event.target as Node);
        const isClickOnTrigger = (event.target as HTMLElement).closest('.sidebar-item');
        if (!isClickInsideMenu && !isClickOnTrigger) {
          setFloatingMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [floatingMenu]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
        <div className="sidebar-header antigravity-wrapper">
            <div 
              className="logo-expanded" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', alignItems: 'center' }}
              title="Dashboard"
            >
              <Home size={32} strokeWidth={2} color="var(--primary-color)" />
            </div>
            <div 
              className="logo-collapsed" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', alignItems: 'center', justifyContent: 'center', width: '100%' }}
              title="Dashboard"
            >
              <Home size={32} strokeWidth={2} color="var(--primary-color)" />
            </div>
          <button className="sidebar-toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={20} strokeWidth={1.25} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard / لوحة التحكم" collapsed={isSidebarCollapsed && !isMobile} onClickParent={handleClickParent} />
          {(user?.permissions?.includes('staffManager') || false) && (
            <SidebarItem to="/merchants" icon={<Building2 size={20} />} label="Merchants / التجار" collapsed={isSidebarCollapsed && !isMobile} onClickParent={handleClickParent} />
          )}
          {(user?.permissions?.includes('store') || false) && (
            <SidebarItem to="/stores" icon={<Store size={20} />} label="Stores / المتاجر" collapsed={isSidebarCollapsed && !isMobile} onClickParent={handleClickParent} />
          )}
          {(user?.permissions?.includes('product') || false) && (
            <SidebarItem
              to="/products"
              icon={<Package size={20} />}
              label="Products / المنتجات"
              collapsed={isSidebarCollapsed && !isMobile}
              onHover={handleHoverParent}
              onClickParent={handleClickParent}
              activeFloatingParent={floatingMenu?.to}
              subItems={[
                { label: 'Products List / قائمة المنتجات', to: '/products', icon: <Package size={16} /> },
                { label: 'Price Monitor / مراقب الأسعار', to: '/price-monitor', icon: <Tag size={16} /> }
              ]}
            />
          )}
          {(user?.permissions?.includes('template') || false) && (
            <SidebarItem
              to="/templates"
              icon={<LayoutTemplate size={20} />}
              label="Store Templates / قوالب المتجر"
              collapsed={isSidebarCollapsed && !isMobile}
              onClickParent={handleClickParent}
            />
          )}
          {(user?.permissions?.includes('equipment') || false) && (
            <SidebarItem
              to="/devices"
              icon={<Cpu size={20} />}
              label="Devices / الأجهزة"
              collapsed={isSidebarCollapsed && !isMobile}
              onHover={handleHoverParent}
              onClickParent={handleClickParent}
              activeFloatingParent={floatingMenu?.to}
              subItems={[
                { label: 'ESL Tags / شاشات الأسعار', to: '/devices?tab=esl', icon: <Smartphone size={16} /> },
                { label: 'AP Stations / محطات البث', to: '/devices?tab=ap', icon: <Cpu size={16} /> }
              ]}
            />
          )}
          {(user?.permissions?.includes('log') || false) && (
            <SidebarItem to="/audit-logs" icon={<History size={20} />} label="Audit Logs / سجلات المراجعة" collapsed={isSidebarCollapsed && !isMobile} onClickParent={handleClickParent} />
          )}
          {(user?.permissions?.includes('staffManager') || false) && (
            <SidebarItem
              to="/users"
              icon={<User size={20} />}
              label="Staff Users / الموظفين"
              collapsed={isSidebarCollapsed && !isMobile}
              onHover={handleHoverParent}
              onClickParent={handleClickParent}
              activeFloatingParent={floatingMenu?.to}
              subItems={[
                { label: 'Staff Users / الموظفين', to: '/users?tab=users', icon: <User size={16} /> },
                { label: 'Security Roles / أدوار الأمان', to: '/users?tab=roles', icon: <Shield size={16} /> }
              ]}
            />
          )}
        </nav>

      </aside>

      <main className="main-content">
        <header className="main-header glass-card">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={theme === 'dark' ? '/cscs-logo-square-white.png' : '/cscs-logo-square-dark.png'}
                  alt="CSCS Icon"
                  style={{
                    width: '24px',
                    height: '24px',
                    flexShrink: 0
                  }}
                />
              </div>
            ) : (
              <div className="header-titles">
                <div className="app-title-banner">
                  <span className="en-text">ESL CONNECT APP</span>
                  <span className="divider">/</span>
                  <span className="ar-text" dir="rtl">منصة بطاقات الأسعار الرقمية</span>
                </div>
              </div>
            )}
          </div>
          <div className="header-right">
            <div className="user-profile">
              {/* Modern Theme Toggle Switch */}
              <div
                className="theme-switch-container"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode / تفعيل الوضع الداكن' : 'Switch to Light Mode / تفعيل الوضع المضيء'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleTheme();
                    e.preventDefault();
                  }
                }}
              >
                {theme === 'light' ? <Sun size={18} className="theme-icon sun" /> : <Moon size={18} className="theme-icon moon" />}
                <div className={`theme-switch ${theme}`}>
                  <div className="theme-switch-handle" />
                </div>
              </div>

              <div className="user-info">
                <span className="username">{user?.username}</span>
                <span className="user-role">
                  {(() => {
                    const r = user?.role?.toUpperCase();
                    if (r === 'SUPER_ADMIN') return 'Super Admin / مدير النظام';
                    if (r === 'MERCHANT_SUPER_ADMIN') return 'Merchant Super Admin / مسؤول التاجر الرئيسي';
                    if (r === 'MERCHANT') return 'Merchant / تاجر';
                    if (r === 'STAFF') return 'Staff / موظف';

                    const rawRole = user?.role || '';
                    const translateMap: Record<string, string> = {
                      '商家超级管理员': 'Merchant Super Administrator',
                      '商家管理员': 'Merchant Administrator'
                    };
                    return translateMap[rawRole] || rawRole;
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

      {/* Dynamic Floating Submenu */}
      {floatingMenu && (
        <div
          ref={floatingMenuRef}
          className="floating-submenu glass-card"
          style={{
            position: 'fixed',
            top: `${floatingPosition.top}px`,
            left: `${floatingPosition.left}px`,
            zIndex: 1201,
          }}
          onMouseEnter={handleMouseEnterFloatingMenu}
          onMouseLeave={handleMouseLeaveFloatingMenu}
        >
          <div className="floating-submenu-header">
            {floatingMenu.to ? (
              <Link
                to={floatingMenu.to}
                className="floating-submenu-header-link"
                onClick={() => setFloatingMenu(null)}
              >
                {floatingMenu.label}
              </Link>
            ) : (
              floatingMenu.label
            )}
          </div>
          <div className="floating-submenu-items">
            {floatingMenu.subItems.map((sub, idx) => {
              const isSubActive = location.pathname + location.search === sub.to || (!location.search && (sub.to.includes('tab=merchant') || sub.to.includes('tab=esl') || sub.to.includes('tab=users')));
              return (
                <Link
                  key={idx}
                  to={sub.to}
                  className={`sidebar-subitem ${isSubActive ? 'active' : ''} ${hoveredSubIndex === idx ? 'keyboard-hover' : ''}`}
                  onClick={() => setFloatingMenu(null)}
                >
                  {sub.icon ? (
                    <span className="subitem-icon" style={{ opacity: isSubActive ? 1 : 0.7 }}>{sub.icon}</span>
                  ) : (
                    <div className="subitem-dot" />
                  )}
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        /* Floating submenu custom styles */
        .floating-submenu {
          padding: 12px;
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: slideInRight 180ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-submenu-header {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 8px 8px;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 4px;
        }

        .floating-submenu-header-link {
          text-decoration: none;
          color: inherit;
          transition: color 0.2s;
        }

        .floating-submenu-header-link:hover {
          color: var(--primary-color);
        }

        .floating-submenu-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-subitem.keyboard-hover {
          background: var(--bg-accent) !important;
          color: var(--text-primary) !important;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .theme-switch-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 20px;
          background: var(--bg-accent);
          border: 1px solid var(--glass-border);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          outline: none;
          flex-shrink: 0;
        }

        .theme-switch-container:hover {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.15);
        }

        [data-theme='dark'] .theme-switch-container:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .theme-switch-container:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        .theme-icon {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, color 0.2s ease;
        }

        .theme-icon.sun {
          color: #eab308;
          transform: rotate(0deg);
        }

        .theme-icon.moon {
          color: #818cf8;
          transform: rotate(360deg);
        }

        .theme-switch {
          position: relative;
          width: 36px;
          height: 18px;
          background: #cbd5e1;
          border-radius: 9px;
          transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .theme-switch.dark {
          background: var(--primary-color);
        }

        .theme-switch-handle {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .theme-switch.dark .theme-switch-handle {
          transform: translateX(18px);
        }

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
          padding: 0 16px 24px;
          z-index: 10;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: hidden;
        }

        .sidebar.collapsed {
          width: 84px;
        }

        .sidebar-header.antigravity-wrapper {
          margin-bottom: 24px;
          padding: 0 12px;
          height: 64px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          background: transparent;
        }

        .logo-expanded {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
          width: 100%;
        }

        .brand-asset-expanded {
          height: 38px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          object-position: left center;
          mix-blend-mode: multiply;
          transition: filter 0.3s ease;
        }

        .brand-asset-collapsed {
          height: 32px;
          width: 32px;
          object-fit: cover;
          object-position: left center;
          mix-blend-mode: multiply;
          transition: filter 0.3s ease;
        }

        [data-theme='dark'] .brand-asset-expanded,
        [data-theme='dark'] .brand-asset-collapsed {
          filter: invert(1) hue-rotate(180deg) brightness(2) contrast(1.2);
          mix-blend-mode: screen;
        }

        .logo-collapsed {
          display: none;
          align-items: center;
          justify-content: center;
          width: 100%;
          color: var(--text-primary);
        }



        .sidebar.collapsed .logo-expanded {
          display: none;
        }

        .sidebar.collapsed .logo-collapsed {
          display: flex;
          margin: 0 auto;
        }

        .sidebar-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          opacity: 0.6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sidebar-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--primary-color);
          opacity: 1;
        }

        .sidebar.collapsed .sidebar-header.antigravity-wrapper {
          flex-direction: column;
          gap: 16px;
          justify-content: flex-start;
          align-items: center;
          height: auto;
          padding-top: 16px;
        }        .sidebar-nav {
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

        .sidebar-group {
          display: flex;
          flex-direction: column;
        }

        .sidebar-subitems {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 4px;
          padding-left: 20px;
        }

        .sidebar-subitem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .sidebar-subitem:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }

        .sidebar-subitem.active {
          color: var(--primary-color);
          font-weight: 600;
        }

        .subitem-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          opacity: 0.5;
        }

        .sidebar-subitem.active .subitem-dot {
          background: currentColor;
          opacity: 1;
        }

        .accordion-label {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        @media (min-width: 1025px) {
          .sidebar.collapsed .accordion-label {
            display: none !important;
          }
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
          min-height: 70px;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }

        .app-title-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }

        .app-title-banner .divider {
          opacity: 0.5;
          font-weight: 400;
        }

        .page-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-secondary);
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

          .sidebar.collapsed .sidebar-item .accordion-label {
            display: flex;
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
