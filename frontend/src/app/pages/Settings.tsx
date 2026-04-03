import { useState } from "react";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "../components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { useAuthStore } from "../../stores/auth.store";
import { authService } from "../../services/auth.service";
import { useLanguage } from "../contexts/LanguageContext";
import { extractApiError } from "../../lib/api";

export function Settings() {
  const navigate = useNavigate();
  const { user, updateSettings, logout } = useAuthStore();
  const { setLanguage } = useLanguage();

  const settings = user?.settings;

  const [selectedLanguage, setSelectedLanguage] = useState(settings?.lang ?? 'ja');
  const [fontSize, setFontSize] = useState(settings?.font_size ?? 'medium');
  const [voiceGuide, setVoiceGuide] = useState(settings?.voice_guide ?? true);
  const [darkMode, setDarkMode] = useState(settings?.dark_mode === 'on');

  const languages = [
    { id: 'ja', label: '日本語', sublabel: 'Japanese' },
    { id: 'en', label: 'English', sublabel: 'English' },
    { id: 'vi', label: 'Tiếng Việt', sublabel: 'Vietnamese' },
    { id: 'zh', label: '中文', sublabel: 'Chinese' },
    { id: 'ko', label: '한국어', sublabel: 'Korean' },
    { id: 'ne', label: 'नेपाली', sublabel: 'Nepali' },
  ];

  const fontSizes = [
    { id: 'small', label: '小', size: '12px' },
    { id: 'medium', label: '中', size: '16px' },
    { id: 'large', label: '大', size: '20px' },
    { id: 'extra_large', label: '特大', size: '24px' },
  ];

  const saveMutation = useMutation({
    mutationFn: () =>
      authService.updateSettings({
        lang: selectedLanguage as any,
        font_size: fontSize as any,
        voice_guide: voiceGuide,
        dark_mode: darkMode ? 'on' : 'off',
      }),
    onSuccess: (saved) => {
      updateSettings(saved);
      setLanguage(saved.lang);
      toast.success('設定を保存しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setLanguage(lang as any);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{ height: '48px', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mobile')}>
            <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <span className="font-semibold" style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            設定
          </span>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
          保存
        </button>
      </header>

      <div className="p-4 space-y-6">
        {/* User Info */}
        {user && (
          <section className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>{user.name}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{user.email}</p>
              </div>
            </div>
          </section>
        )}

        {/* Language */}
        <section>
          <h3 className="mb-3 font-semibold flex items-center gap-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <Globe size={18} />
            <span>言語 / Language</span>
          </h3>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full bg-white border-[var(--border-default)]" style={{ height: '56px', fontSize: 'var(--text-base)' }}>
              <SelectValue>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{languages.find((l) => l.id === selectedLanguage)?.label}</span>
                  <span className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-sm)' }}>
                    {languages.find((l) => l.id === selectedLanguage)?.sublabel}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white" style={{ maxHeight: '320px' }}>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id} className="cursor-pointer" style={{ minHeight: '48px', fontSize: 'var(--text-base)' }}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-medium">{lang.label}</span>
                    <span className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-sm)' }}>{lang.sublabel}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Font Size */}
        <section>
          <h3 className="mb-3 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            🔤 文字サイズ
          </h3>
          <div className="p-1 rounded-lg flex gap-1" style={{ backgroundColor: 'var(--color-gray-100)' }}>
            {fontSizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setFontSize(s.id)}
                className="flex-1 py-2 rounded-lg transition-all font-medium"
                style={{
                  backgroundColor: fontSize === s.id ? 'white' : 'transparent',
                  color: fontSize === s.id ? 'var(--color-primary-800)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  boxShadow: fontSize === s.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <div className="font-bold mb-1" style={{ fontSize: fontSizes.find((s) => s.id === fontSize)?.size }}>
              {user?.name ?? '山田 太郎'} 様
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>朝日新聞朝刊 ×1</div>
          </div>
        </section>

        {/* Audio & Display */}
        <section>
          <h3 className="mb-3 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            音声・表示
          </h3>
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div>
                <div className="font-medium mb-1" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>🔊 音声案内</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>次の配達先を自動読み上げ</div>
              </div>
              <Switch checked={voiceGuide} onCheckedChange={setVoiceGuide} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium mb-1" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>🌙 夜間モード</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>自動: 3:00〜6:00</div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-lg font-medium border"
            style={{ backgroundColor: 'white', color: 'var(--color-danger-500)', borderColor: '#FECACA', fontSize: 'var(--text-base)' }}
          >
            ログアウト
          </button>
          <p className="text-center mt-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            バージョン: 1.0.0
          </p>
        </section>
      </div>
    </div>
  );
}
