import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Monitor, Lock, User, Eye, EyeOff, Newspaper } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in production, this would authenticate with backend
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-gray-900)] to-[var(--color-gray-800)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <Newspaper size={32} className="text-[var(--color-primary-500)]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AsahiRoute Admin</h1>
          <p className="text-gray-300 flex items-center justify-center gap-2">
            <Monitor size={16} />
            管理者ダッシュボード
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--color-asahi-black)] mb-1">
              ログイン
            </h2>
            <p className="text-sm text-[var(--color-asahi-medium)]">
              管理者アカウントでログインしてください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-[var(--color-asahi-black)] mb-2"
              >
                ユーザー名
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[var(--color-asahi-black)] mb-2"
              >
                パスワード
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-11 pr-12 py-3 border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                />
                <span className="text-sm text-[var(--color-asahi-medium)]">
                  ログイン状態を保持
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-medium"
              >
                パスワードを忘れた？
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-[var(--color-primary-500)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] transition-colors shadow-lg shadow-[var(--color-primary-500)]/20"
            >
              ログイン
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-[var(--color-gray-50)] rounded-lg border border-[var(--color-asahi-border)]">
            <p className="text-xs text-[var(--color-asahi-medium)] mb-2 font-semibold">
              デモ用アカウント:
            </p>
            <div className="text-xs text-[var(--color-asahi-medium)] space-y-1">
              <p>ユーザー名: admin</p>
              <p>パスワード: password</p>
            </div>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            ← ホームに戻る
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>© 2026 AsahiRoute. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}