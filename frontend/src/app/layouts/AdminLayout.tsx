import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../services/auth.service';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  Route as RouteIcon, 
  UserX, 
  Plus, 
  UsersRound, 
  MapPin, 
  BarChart3, 
  FileText, 
  Settings as SettingsIcon,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Newspaper
} from 'lucide-react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'ダッシュボード', path: '/admin' },
  { icon: <Map size={20} />, label: '区域管理', path: '/admin/areas' },
  { icon: <Users size={20} />, label: '購読者管理', path: '/admin/subscribers' },
  { icon: <RouteIcon size={20} />, label: 'ルート管理', path: '/admin/routes' },
  { icon: <UserX size={20} />, label: '留守止め管理', path: '/admin/suspensions' },
  { icon: <Plus size={20} />, label: '新規挿入', path: '/admin/insertions' },
  { icon: <UsersRound size={20} />, label: '配達員管理', path: '/admin/users' },
  { icon: <MapPin size={20} />, label: '配達状況（ライブ）', path: '/admin/deliveries/live' },
  { icon: <BarChart3 size={20} />, label: 'レポート', path: '/admin/reports' },
  { icon: <FileText size={20} />, label: '操作ログ', path: '/admin/audit-log' },
  { icon: <SettingsIcon size={20} />, label: '設定', path: '/admin/settings' },
];

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout();
    navigate('/admin/login', { replace: true });
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '管';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Left Sidebar - Asahi Design */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#1A1A1A] text-white transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#2A2A2A]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Newspaper size={24} className="text-white" />
              <span className="font-bold text-xl text-white">AsahiRoute</span>
            </div>
          )}
          {sidebarCollapsed && <Newspaper size={24} className="text-white" />}
        </div>

        {/* Menu Items */}
        <nav className="py-4 px-2 space-y-1">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            
            // Separator before 操作ログ
            if (index === 9) {
              return (
                <div key={`sep-${index}`}>
                  <div className="my-2 mx-2 border-t border-[#2A2A2A]" />
                  <Link
                    to={item.path}
                    className={`flex items-center h-11 px-4 rounded-lg transition-colors relative ${
                      active
                        ? 'bg-[#2A2A2A] text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--color-primary-500)] before:rounded-r'
                        : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && (
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center h-11 px-4 rounded-lg transition-colors relative ${
                  active
                    ? 'bg-[#2A2A2A] text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--color-primary-500)] before:rounded-r'
                    : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2A2A2A]">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center font-bold text-white">
                {userInitial}
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-white">{user?.name ?? '管理者'}</div>
                <div className="text-xs text-[#94A3B8]">管理者</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#94A3B8] hover:text-white transition-colors text-xs"
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
        {/* Top Bar - 64px height */}
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
                  placeholder="購読者名・住所・コードで検索..."
                  className="w-full h-10 pl-10 pr-20 bg-[var(--color-gray-50)] border border-transparent rounded-lg text-sm text-[var(--color-asahi-dark)] placeholder:text-[var(--color-asahi-light)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] focus:bg-white transition-all"
                />
                <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-[var(--color-asahi-medium)] bg-white border border-[var(--color-asahi-border)] rounded">
                  Ctrl+K
                </kbd>
              </div>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--color-asahi-dark)]">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-danger-500)] rounded-full" />
              </button>

              <button className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-gray-50)] rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center text-white text-sm font-bold">
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
  );
}