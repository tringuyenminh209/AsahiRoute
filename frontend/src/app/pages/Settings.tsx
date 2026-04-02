import { useState } from "react";
import { ArrowLeft, Globe } from "lucide-react";
import { useNavigate } from "react-router";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function Settings() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("ja");
  const [fontSize, setFontSize] = useState("medium");
  const [voiceGuide, setVoiceGuide] = useState(true);
  const [nightMode, setNightMode] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [notifySuspension, setNotifySuspension] = useState(true);
  const [notifyNew, setNotifyNew] = useState(true);
  const [notifyRoute, setNotifyRoute] = useState(true);

  const languages = [
    { id: "ja", label: "日本語", sublabel: "Japanese" },
    { id: "en", label: "English", sublabel: "English" },
    { id: "vi", label: "Tiếng Việt", sublabel: "Vietnamese" },
    { id: "zh", label: "中文", sublabel: "Chinese" },
    { id: "ko", label: "한국어", sublabel: "Korean" },
    { id: "ne", label: "नेपाली", sublabel: "Nepali" },
  ];

  const fontSizes = [
    { id: "small", label: "小", size: "12px" },
    { id: "medium", label: "中", size: "16px" },
    { id: "large", label: "大", size: "20px" },
    { id: "xlarge", label: "特大", size: "24px" },
  ];

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ backgroundColor: 'var(--surface-page)' }}
    >
      {/* Header */}
      <header 
        className="flex items-center gap-3 px-4 bg-white border-b"
        style={{
          height: '48px',
          borderColor: 'var(--border-default)',
        }}
      >
        <button onClick={() => navigate('/mobile')}>
          <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
        <span 
          className="font-semibold"
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
          }}
        >
          設定
        </span>
      </header>

      <div className="p-4 space-y-6">
        {/* Language Section */}
        <section>
          <h3 
            className="mb-3 font-semibold flex items-center gap-2"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <Globe size={18} />
            <span>言語 / Language</span>
          </h3>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger
              className="w-full bg-white border-[var(--border-default)]"
              style={{
                height: '56px',
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
        </section>

        {/* Font Size Section */}
        <section>
          <h3 
            className="mb-3 font-semibold"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            🔤 文字サイズ
          </h3>
          <div 
            className="p-1 rounded-lg flex gap-1"
            style={{ backgroundColor: 'var(--color-gray-100)' }}
          >
            {fontSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setFontSize(size.id)}
                className="flex-1 py-2 rounded-lg transition-all font-medium"
                style={{
                  backgroundColor: fontSize === size.id ? 'white' : 'transparent',
                  color: fontSize === size.id 
                    ? 'var(--color-primary-800)' 
                    : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  boxShadow: fontSize === size.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {size.label}(A){size.size.replace('px', '')}
              </button>
            ))}
          </div>
          
          {/* Preview */}
          <div 
            className="mt-3 p-3 rounded-lg"
            style={{ backgroundColor: 'var(--color-gray-50)' }}
          >
            <div 
              className="font-bold mb-1"
              style={{ fontSize: fontSizes.find(s => s.id === fontSize)?.size }}
            >
              田中太郎 様
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              山口県下関市○○町1-2-3
            </div>
            <div 
              style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--color-primary-500)',
                marginTop: '4px',
              }}
            >
              朝日新聞朝刊 ×1
            </div>
          </div>
        </section>

        {/* Audio & Display Section */}
        <section>
          <h3 
            className="mb-3 font-semibold"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            音声・表示
          </h3>
          <div 
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div>
                <div 
                  className="font-medium mb-1"
                  style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
                >
                  🔊 音声案内
                </div>
                <div 
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}
                >
                  次の配達先を自動読み上げ
                </div>
              </div>
              <Switch checked={voiceGuide} onCheckedChange={setVoiceGuide} />
            </div>

            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div>
                <div 
                  className="font-medium mb-1"
                  style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
                >
                  🌙 夜間モード
                </div>
                <div 
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}
                >
                  自動: 3:00〜6:00
                </div>
              </div>
              <Switch checked={nightMode} onCheckedChange={setNightMode} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div>
                <div 
                  className="font-medium mb-1"
                  style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
                >
                  📳 振動フィードバック
                </div>
                <div 
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}
                >
                  配達完了時にバイブ
                </div>
              </div>
              <Switch checked={vibration} onCheckedChange={setVibration} />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h3 
            className="mb-3 font-semibold"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            通知設定
          </h3>
          <div 
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="font-medium" style={{ fontSize: 'var(--text-base)' }}>
                🔔 留守止め通知
              </div>
              <Switch checked={notifySuspension} onCheckedChange={setNotifySuspension} />
            </div>

            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="font-medium" style={{ fontSize: 'var(--text-base)' }}>
                🆕 新規挿入通知
              </div>
              <Switch checked={notifyNew} onCheckedChange={setNotifyNew} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="font-medium" style={{ fontSize: 'var(--text-base)' }}>
                📢 ルート変更通知
              </div>
              <Switch checked={notifyRoute} onCheckedChange={setNotifyRoute} />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-lg font-medium border"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-danger-500)',
              borderColor: '#FECACA',
              fontSize: 'var(--text-base)',
            }}
          >
            ログアウト
          </button>
          
          <p 
            className="text-center mt-4"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            バージョン: 1.0.0
          </p>
        </section>
      </div>
    </div>
  );
}