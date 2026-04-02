import { Link } from 'react-router';
import { Smartphone, Monitor, Globe, Moon, Accessibility, Siren, Newspaper } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CC0000] to-[#990000] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Newspaper size={64} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">AsahiRoute</h1>
          <p className="text-xl text-[#FFE5E5]">新聞配達管理システム</p>
        </div>

        {/* Interface Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mobile App */}
          <Link
            to="/login"
            className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all group border border-[var(--color-asahi-border)]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[var(--color-primary-50)] rounded-full flex items-center justify-center mb-6 group-hover:bg-[var(--color-primary-100)] transition-colors">
                <Smartphone size={40} className="text-[var(--color-primary-500)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-asahi-black)] mb-3">
                配達員アプリ
              </h2>
              <p className="text-[var(--color-asahi-medium)] mb-6">
                モバイル端末向けの配達管理アプリ。
                <br />
                ルート確認、配達記録、リアルタイム更新
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-primary-50)] text-[var(--color-primary-700)] rounded-full flex items-center gap-1">
                  <Smartphone size={12} />
                  モバイル
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-success-500)]/10 text-[var(--color-success-600)] rounded-full">
                  地図ナビ
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-info-500)]/10 text-[var(--color-info-500)] rounded-full">
                  GPS追跡
                </span>
              </div>
            </div>
          </Link>

          {/* Admin Dashboard */}
          <Link
            to="/admin/login"
            className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all group border border-[var(--color-asahi-border)]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[var(--color-gray-100)] rounded-full flex items-center justify-center mb-6 group-hover:bg-[var(--color-gray-200)] transition-colors">
                <Monitor size={40} className="text-[var(--color-asahi-dark)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-asahi-black)] mb-3">
                管理者ダッシュボード
              </h2>
              <p className="text-[var(--color-asahi-medium)] mb-6">
                デスクトップ向けの管理画面。
                <br />
                購読者管理、ルート最適化、レポート分析
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-gray-100)] text-[var(--color-asahi-dark)] rounded-full flex items-center gap-1">
                  <Monitor size={12} />
                  デスクトップ
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-status-in-progress)]/10 text-[var(--color-status-in-progress)] rounded-full">
                  AI最適化
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-[var(--color-warning-500)]/10 text-[var(--color-warning-500)] rounded-full">
                  レポート
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-white">
              <div className="flex justify-center mb-2">
                <Globe size={32} />
              </div>
              <div className="text-sm font-medium">6言語対応</div>
            </div>
            <div className="text-white">
              <div className="flex justify-center mb-2">
                <Moon size={32} />
              </div>
              <div className="text-sm font-medium">ダークモード</div>
            </div>
            <div className="text-white">
              <div className="flex justify-center mb-2">
                <Accessibility size={32} />
              </div>
              <div className="text-sm font-medium">アクセシビリティ</div>
            </div>
            <div className="text-white">
              <div className="flex justify-center mb-2">
                <Siren size={32} />
              </div>
              <div className="text-sm font-medium">SOS機能</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-[#FFE5E5] text-sm">
          <p>© 2026 AsahiRoute. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}