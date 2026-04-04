import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, Newspaper, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/auth.store";
import { useLanguage } from "../contexts/LanguageContext";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const languages = [
    { id: "ja", label: "日本語", sublabel: "Japanese" },
    { id: "en", label: "English", sublabel: "English" },
    { id: "vi", label: "Tiếng Việt", sublabel: "Vietnamese" },
    { id: "zh", label: "中文", sublabel: "Chinese" },
    { id: "ko", label: "한국어", sublabel: "Korean" },
    { id: "ne", label: "नेपाली", sublabel: "Nepali" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      setAuth(data.token, data.user);

      if (data.user.role === "company_admin") {
        navigate("/company", { replace: true });
      } else if (data.user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        const onboardingDone = data.user.settings?.onboarding_done;
        navigate(onboardingDone ? "/mobile" : "/onboarding", { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "ログインに失敗しました";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col px-6 bg-[var(--surface-page)]"
    >
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div 
              className="p-2 rounded-lg bg-[var(--color-primary-50)]"
            >
              <Newspaper 
                size={32} 
                className="text-[var(--color-primary-500)]"
              />
            </div>
            <h1 
              className="font-bold text-[var(--color-asahi-black)]"
              style={{ fontSize: 'var(--text-2xl)' }}
            >
              AsahiRoute
            </h1>
          </div>
          <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-sm)' }}>
            新聞配達ルートナビ
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label 
              className="block mb-2 text-[var(--color-asahi-dark)] font-medium"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {t('login.email')}
            </label>
            <div className="relative">
              <Mail 
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="email"
                placeholder="example@shop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 border border-[var(--border-default)] rounded-lg bg-white text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all"
                style={{ height: '52px' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label 
              className="block mb-2 text-[var(--color-asahi-dark)] font-medium"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock 
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 border border-[var(--border-default)] rounded-lg bg-white text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all"
                style={{ height: '52px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary-500)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: '56px' }}
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>

        {/* Language Selection */}
        <div className="mt-6">
          <label 
            htmlFor="language-select"
            className="flex items-center justify-center gap-2 mb-3"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <Globe size={18} />
            <span>言語 / Language</span>
          </label>
          <Select value={selectedLanguage} onValueChange={(lang) => { setSelectedLanguage(lang); setLanguage(lang as any); }}>
            <SelectTrigger
              id="language-select"
              className="w-full bg-white border-[var(--border-default)]"
              style={{
                height: '52px',
                fontSize: 'var(--text-base)',
              }}
            >
              <SelectValue>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">
                    {languages.find(l => l.id === selectedLanguage)?.label}
                  </span>
                  <span 
                    className="text-[var(--text-secondary)]"
                    style={{ fontSize: 'var(--text-sm)' }}
                  >
                    {languages.find(l => l.id === selectedLanguage)?.sublabel}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent 
              className="bg-white"
              style={{
                maxHeight: '320px',
              }}
            >
              {languages.map((lang) => (
                <SelectItem 
                  key={lang.id} 
                  value={lang.id}
                  className="cursor-pointer"
                  style={{
                    minHeight: '48px',
                    fontSize: 'var(--text-base)',
                  }}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-medium">{lang.label}</span>
                    <span 
                      className="text-[var(--text-secondary)]"
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      {lang.sublabel}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer */}
      <p 
        className="text-center py-6"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        © AsahiRoute 2026
      </p>
    </div>
  );
}