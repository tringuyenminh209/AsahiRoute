import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../services/auth.service';
import {
  LayoutDashboard,
  Store,
  Building2,
  ChevronDown,
  Menu,
  X,
  Bell,
  Search,
} from 'lucide-react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'ダッシュボード', path: '/company' },
  { icon: <Store size={20} />, label: '店舗管理', path: '/company/shops' },
];

const SIDEBAR_BG = '#0F4C35';
const SIDEBAR_HOVER = '#1A6B4D';
const SIDEBAR_ACTIVE = '#0D3D2B';
const SIDEBAR_BORDER = '#0A3828';
const SIDEBAR_MUTED = '#6EAA8A';

export function CompanyLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '会';

  const isActive = (path: string) => {
    if (path === '/company') {
      return location.pathname === '/company';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        {/* Left Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-full text-white transition-all duration-300 z-30 ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          {/* Logo */}
          <div
            className="h-16 flex items-center px-6 border-b"
            style={{ borderColor: SIDEBAR_BORDER }}
          >
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Building2 size={24} className="text-white" />
                <div>
                  <span className="font-bold text-lg text-white leading-tight block">AsahiRoute</span>
                  <span className="text-xs" style={{ color: SIDEBAR_MUTED }}>本社</span>
                </div>
              </div>
            )}
            {sidebarCollapsed && <Building2 size={24} className="text-white" />}
          </div>

          {/* Menu Items */}
          <nav className="py-4 px-2 space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center h-11 px-4 rounded-lg transition-colors relative ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  style={{
                    backgroundColor: active ? SIDEBAR_ACTIVE : 'transparent',
                    color: active ? '#ffffff' : SIDEBAR_MUTED,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = SIDEBAR_HOVER;
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    if (!active) (e.currentTarget as HTMLElement).style.color = SIDEBAR_MUTED;
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                      style={{ backgroundColor: '#4ADE80' }}
                    />
                  )}
                  {item.icon}
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div
              className="absolute bottom-0 left-0 right-0 p-4 border-t"
              style={{ borderColor: SIDEBAR_BORDER }}
            >
              <div className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: '#4ADE80', color: SIDEBAR_BG }}
                >
                  {userInitial}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user?.name ?? '会社管理者'}</div>
                  <div className="text-xs" style={{ color: SIDEBAR_MUTED }}>会社管理者</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: SIDEBAR_MUTED }}
                  title="ログアウト"
                >
                  ログアウト
                </button>
              </div>
            </div>
          )}

          {/* Collapse Button - Desktop */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-[var(--color-asahi-border)] rounded-full items-center justify-center shadow-md hover:bg-[var(--color-gray-50)]"
          >
            <ChevronDown
              size={14}
              className={`transform transition-transform text-[var(--color-asahi-dark)] ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
          }`}
        >
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-[var(--color-asahi-border)] sticky top-0 z-10">
            <div className="h-full px-6 flex items-center justify-between">
              {/* Left: Mobile Menu + Search */}
              <div className="flex items-center flex-1">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden mr-4 p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--color-asahi-dark)]"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="relative w-full max-w-md">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-asahi-light)]"
                  />
                  <input
                    type="text"
                    placeholder="店舗名・コードで検索..."
                    className="w-full h-10 pl-10 pr-4 bg-[var(--color-gray-50)] border border-transparent rounded-lg text-sm text-[var(--color-asahi-dark)] placeholder:text-[var(--color-asahi-light)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Right: Notifications + User */}
              <div className="flex items-center gap-3">
                <button className="relative p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--color-asahi-dark)]">
                  <Bell size={20} />
                </button>

                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-gray-50)] rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: '#4ADE80', color: SIDEBAR_BG }}
                  >
                    {userInitial}
                  </div>
                  <ChevronDown size={16} className="text-[var(--color-asahi-dark)]" />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-h-[calc(100vh-4rem)] bg-[var(--color-gray-50)]">
            <Outlet />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
