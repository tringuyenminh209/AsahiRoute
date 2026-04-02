import { useNavigate } from "react-router";
import { Bell, Settings, Sun, MapPin, Clock, Ruler, AlertCircle, Edit3, Globe, Check, X } from "lucide-react";
import { useState } from "react";
import { useLanguage, languages } from "../contexts/LanguageContext";

export function Home() {
  const navigate = useNavigate();
  const { currentLanguage, setLanguage, getCurrentLanguageOption } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  const todayChanges = [
    { 
      type: 'new', 
      icon: '🆕', 
      color: 'var(--color-warning-400)',
      bg: 'var(--color-warning-400)',
      text: '佐藤様（新規）A区域 #45の後',
    },
    { 
      type: 'suspended', 
      icon: '⚪', 
      color: 'var(--color-gray-400)',
      bg: 'var(--color-gray-400)',
      text: '鈴木様（留守止め）4/1〜4/10 旅行',
    },
    { 
      type: 'suspended', 
      icon: '⚪', 
      color: 'var(--color-gray-400)',
      bg: 'var(--color-gray-400)',
      text: '高橋様（留守止め）4/2〜4/5 出張',
    },
  ];

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ backgroundColor: 'var(--surface-page)' }}
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between px-4"
        style={{
          height: '56px',
          backgroundColor: 'var(--color-primary-800)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
          <span 
            className="font-bold text-white"
            style={{ fontSize: 'var(--text-lg)' }}
          >
            AsahiRoute
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="relative"
            onClick={() => navigate('/mobile/notifications')}
          >
            <Bell size={24} className="text-white" />
            <span 
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
              style={{
                backgroundColor: 'var(--color-danger-500)',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              3
            </span>
          </button>
          <button onClick={() => navigate('/mobile/settings')}>
            <Settings size={24} className="text-white" />
          </button>
          <button
            className="relative"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Globe size={24} className="text-white" />
            <span 
              className="absolute -bottom-1 -right-1 text-xs font-bold px-1 rounded"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--color-primary-800)',
                fontSize: '9px',
                lineHeight: '14px',
              }}
            >
              {currentLanguage.toUpperCase()}
            </span>
          </button>
        </div>
      </header>

      {/* Language Selector Modal */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowLanguageDropdown(false)}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                言語選択 / Select Language
              </h2>
              <button onClick={() => setShowLanguageDropdown(false)}>
                <X size={24} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="space-y-2">
              {languages.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between"
                    style={{
                      borderColor: isSelected ? 'var(--color-primary-500)' : 'var(--border-default)',
                      backgroundColor: isSelected ? 'var(--color-primary-50)' : 'white',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{lang.flag}</span>
                      <div>
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {lang.nativeName}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {lang.name}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={24} style={{ color: 'var(--color-primary-500)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weather Banner */}
      <div 
        className="flex items-center gap-2 px-4"
        style={{
          height: '48px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          fontSize: 'var(--text-sm)',
        }}
      >
        <Sun size={20} />
        <span>☀️ 晴れ 12°C｜配達日和です</span>
      </div>

      {/* Greeting */}
      <div className="px-4 pt-6 pb-4">
        <h1 
          className="font-bold mb-1"
          style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-primary)',
          }}
        >
          おはようございます、山田さん
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}>
          2026年4月2日（木）
        </p>
      </div>

      {/* Morning Route Card */}
      <div className="px-4 mb-4">
        <div 
          className="rounded-xl p-4 shadow-md"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 'var(--text-lg)' }}>☀️</span>
              <span 
                className="font-semibold"
                style={{ 
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-primary)',
                }}
              >
                朝刊配達
              </span>
            </div>
            <span 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-800)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              未開始
            </span>
          </div>
          
          <p 
            className="mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-gray-600)',
            }}
          >
            A区域ルート
          </p>

          <div 
            className="flex gap-4 mb-4 pb-4 border-b"
            style={{
              borderColor: 'var(--border-default)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>148件</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>約85分</span>
            </div>
            <div className="flex items-center gap-1">
              <Ruler size={16} />
              <span>12.5km</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <span 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: 'var(--text-sm)',
              }}
            >
              🆕 新規 1件
            </span>
            <span 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-gray-100)',
                color: 'var(--color-gray-600)',
                fontSize: 'var(--text-sm)',
              }}
            >
              🚫 留守 3件
            </span>
          </div>

          <button
            onClick={() => navigate('/mobile/route/1/map')}
            className="w-full rounded-lg font-bold text-white transition-all"
            style={{
              height: '56px',
              backgroundColor: 'var(--color-primary-500)',
              fontSize: 'var(--text-lg)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            配達開始 →
          </button>
        </div>
      </div>

      {/* Evening Route Card */}
      <div className="px-4 mb-6">
        <div 
          className="rounded-xl p-4 shadow-md"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 'var(--text-lg)' }}>🌙</span>
              <span 
                className="font-semibold"
                style={{ 
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-primary)',
                }}
              >
                夕刊配達
              </span>
            </div>
            <span 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-gray-100)',
                color: 'var(--color-gray-500)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              配達時間外
            </span>
          </div>
          
          <p 
            className="mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-gray-600)',
            }}
          >
            A区域ルート
          </p>

          <div 
            className="flex gap-4 mb-4"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>145件</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>約80分</span>
            </div>
            <div className="flex items-center gap-1">
              <Ruler size={16} />
              <span>12.0km</span>
            </div>
          </div>

          <button
            disabled
            className="w-full rounded-lg font-bold"
            style={{
              height: '56px',
              backgroundColor: 'var(--color-gray-200)',
              color: 'var(--color-gray-500)',
              fontSize: 'var(--text-lg)',
              cursor: 'not-allowed',
            }}
          >
            配達時間外
          </button>
        </div>
      </div>

      {/* Today's Changes */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 
            className="font-semibold"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            今日の変更
          </h2>
          <button
            onClick={() => navigate('/mobile/delivery-status-management')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--color-primary-50)',
              color: 'var(--color-primary-600)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <Edit3 size={14} />
            状態管理
          </button>
        </div>
        <div className="space-y-2">
          {todayChanges.map((change, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderLeft: `3px solid ${change.bg}`,
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: change.type === 'new' ? '#FEF3C7' : 'var(--color-gray-100)',
                }}
              >
                <span>{change.icon}</span>
              </div>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}>
                {change.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}