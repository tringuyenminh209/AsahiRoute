import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Navigation, Volume2 } from "lucide-react";

export function LearnMode() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentPoint, setCurrentPoint] = useState(3);
  const [speed, setSpeed] = useState(1);
  const totalPoints = 148;

  return (
    <div className="h-screen flex flex-col">
      {/* Purple Header for Practice Mode */}
      <header 
        className="flex items-center justify-between px-4"
        style={{
          height: '48px',
          backgroundColor: 'var(--color-status-in-progress)',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}>
            <ArrowLeft size={20} className="text-white" />
          </button>
          <span 
            className="font-semibold text-white"
            style={{ fontSize: 'var(--text-base)' }}
          >
            🎓 学習モード
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span 
            className="font-bold text-white"
            style={{ fontSize: 'var(--text-base)' }}
          >
            {currentPoint} / {totalPoints}
          </span>
          <button className="text-white">終了</button>
        </div>
      </header>

      {/* Practice Mode Banner */}
      <div 
        className="px-4 py-2 text-center"
        style={{
          backgroundColor: '#EDE9FE',
          color: '#6D28D9',
          fontSize: 'var(--text-sm)',
        }}
      >
        📚 練習モードです。実際の配達記録には反映されません。
      </div>

      {/* Map Area */}
      <div 
        className="flex-1 relative"
        style={{ backgroundColor: '#E5E3DF' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Navigation 
              size={48} 
              style={{ color: 'var(--color-status-in-progress)' }} 
              className="mx-auto mb-2" 
            />
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 'var(--text-sm)' 
            }}>
              学習用地図エリア
            </p>
          </div>
        </div>

        {/* Speed Control */}
        <div 
          className="absolute top-4 right-4 rounded-lg p-2"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
        >
          <div 
            className="mb-1"
            style={{ 
              fontSize: 'var(--text-xs)', 
              color: 'var(--text-secondary)' 
            }}
          >
            速度
          </div>
          <div className="flex gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded transition-all"
                style={{
                  fontSize: 'var(--text-xs)',
                  backgroundColor: speed === s 
                    ? 'var(--color-status-in-progress)' 
                    : 'var(--color-gray-100)',
                  color: speed === s ? 'white' : 'var(--text-secondary)',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white rounded-t-3xl shadow-2xl p-4">
        {/* Navigation Hint */}
        <div 
          className="rounded-lg p-3 mb-4"
          style={{ 
            backgroundColor: '#EDE9FE',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-status-in-progress)',
          }}
        >
          ↑ 200m直進 → 次の交差点を右折
        </div>

        {/* Delivery Point Info */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span 
              className="font-bold"
              style={{
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-status-in-progress)',
              }}
            >
              #{currentPoint}
            </span>
            <span 
              className="font-bold"
              style={{
                fontSize: 'var(--text-xl)',
                color: 'var(--text-primary)',
              }}
            >
              田中 太郎 様
            </span>
          </div>
          <p style={{ 
            fontSize: 'var(--text-base)', 
            color: 'var(--color-gray-600)' 
          }}>
            山口県下関市○○町1-2-3
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => currentPoint > 1 && setCurrentPoint(currentPoint - 1)}
            className="flex-1 py-3 rounded-lg font-medium border"
            style={{
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-default)',
              fontSize: 'var(--text-sm)',
            }}
          >
            前へ
          </button>
          <button
            onClick={() => {
              if (currentPoint < totalPoints) {
                setCurrentPoint(currentPoint + 1);
              } else {
                // Show completion
              }
            }}
            className="flex-1 py-3 rounded-lg font-bold text-white"
            style={{
              backgroundColor: 'var(--color-status-in-progress)',
              fontSize: 'var(--text-base)',
            }}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
