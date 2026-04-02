import { useNavigate } from "react-router";
import { Settings, FileText, Camera, User } from "lucide-react";
import { useState, useRef } from "react";

export function Profile() {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        // Store in localStorage for persistence
        localStorage.setItem('asahiroute-avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Load avatar from localStorage on mount
  useState(() => {
    const stored = localStorage.getItem('asahiroute-avatar');
    if (stored) {
      setAvatarUrl(stored);
    }
  });

  const weeklyData = [
    { day: "月", count: 145, max: 150 },
    { day: "火", count: 148, max: 150 },
    { day: "水", count: 142, max: 150 },
    { day: "木", count: 150, max: 150 },
    { day: "金", count: 147, max: 150 },
    { day: "土", count: 138, max: 150 },
    { day: "日", count: 140, max: 150 },
  ];

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ backgroundColor: 'var(--surface-page)' }}
    >
      {/* Header with Gradient */}
      <div 
        className="relative pb-10"
        style={{
          background: 'linear-gradient(180deg, var(--color-primary-800) 0%, var(--color-primary-500) 100%)',
          height: '200px',
        }}
      >
        <div className="flex flex-col items-center justify-center h-full pt-8">
          {/* Avatar with Upload Button */}
          <div className="relative mb-3">
            <div 
              className="rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
              style={{
                width: '96px',
                height: '96px',
                backgroundColor: avatarUrl ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-white" />
              )}
            </div>
            
            {/* Camera Button */}
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--color-primary-500)',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Camera size={16} className="text-white" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          
          {/* Name */}
          <h2 
            className="font-bold text-white mb-2"
            style={{ fontSize: 'var(--text-xl)' }}
          >
            山田 太郎
          </h2>
          
          {/* Info Badges */}
          <div className="flex items-center gap-2">
            <div 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              📦 配達員
            </div>
            
            <div 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              📍 A区域
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Monthly Stats Card */}
        <div 
          className="rounded-xl p-4 shadow-md"
          style={{ 
            backgroundColor: 'var(--surface-card)',
            marginTop: '-20px',
          }}
        >
          <h3 
            className="font-semibold mb-4"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            今月の実績
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div 
                className="font-bold mb-1"
                style={{
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-success-500)',
                }}
              >
                2,450
              </div>
              <div style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                配達数
              </div>
            </div>

            <div className="text-center">
              <div 
                className="font-bold mb-1"
                style={{
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-primary-500)',
                }}
              >
                98.5%
              </div>
              <div style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                完了率
              </div>
            </div>

            <div className="text-center">
              <div 
                className="font-bold mb-1"
                style={{
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-warning-500)',
                }}
              >
                72分
              </div>
              <div style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                平均時間
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div 
          className="rounded-xl p-4 mt-4 shadow-md"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="font-semibold"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
              }}
            >
              📊 今週の配達
            </h3>
            <span 
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              2026/3/27〜4/2
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyData.map((data, index) => {
              const height = (data.count / data.max) * 100;
              const isMax = data.count === data.max;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 flex items-end w-full">
                    <div 
                      className="w-full rounded-t"
                      style={{
                        height: `${height}%`,
                        backgroundColor: isMax 
                          ? 'var(--color-success-500)' 
                          : 'var(--color-primary-500)',
                      }}
                    />
                  </div>
                  <span 
                    className="mt-2"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {data.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Summary */}
        <div 
          className="rounded-xl p-4 mt-4 shadow-md"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            実績サマリー
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                📅 勤務日数
              </span>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                24日 / 月
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                📍 累計配達
              </span>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                28,500件
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                📏 累計距離
              </span>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                3,200km
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                ⏱️ 平均配達時間
              </span>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                72分
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                🏆 最速記録
              </span>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                58分（3/15）
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-secondary)' 
              }}>
                🌟 配達完了率
              </span>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                98.5%
              </span>
            </div>
          </div>
        </div>

        {/* Settings Links */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => navigate('/mobile/settings')}
            className="w-full flex items-center justify-between p-4 rounded-lg"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div className="flex items-center gap-3">
              <Settings size={20} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ 
                fontSize: 'var(--text-base)', 
                color: 'var(--text-primary)' 
              }}>
                設定を開く
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
          </button>

          <button
            className="w-full flex items-center justify-between p-4 rounded-lg"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div className="flex items-center gap-3">
              <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ 
                fontSize: 'var(--text-base)', 
                color: 'var(--text-primary)' 
              }}>
                配達履歴を見る
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}