import { useNavigate } from "react-router";
import { CheckCircle2 } from "lucide-react";

export function DeliverySummary() {
  const navigate = useNavigate();

  const stats = {
    completed: 145,
    suspended: 3,
    failed: 0,
    duration: 78,
    improvement: -7,
    improvementPercent: -8.2,
    startTime: "4:15",
    endTime: "5:33",
    distance: 11.8,
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: 'linear-gradient(180deg, var(--color-primary-800) 0%, var(--color-primary-500) 240px, var(--surface-page) 240px)',
      }}
    >
      {/* Success Message */}
      <div className="pt-16 pb-12 px-6 text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CheckCircle2 size={48} style={{ color: 'var(--color-success-500)' }} />
        </div>
        <h1 
          className="font-bold mb-2 text-white"
          style={{ fontSize: 'var(--text-2xl)' }}
        >
          お疲れ様でした！
        </h1>
        <p 
          className="text-white"
          style={{ fontSize: 'var(--text-base)', opacity: 0.8 }}
        >
          A区域 朝刊配達完了
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 mb-4" style={{ marginTop: '-40px' }}>
          <div 
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div 
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-success-500)',
              }}
            >
              {stats.completed}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              配達完了
            </div>
          </div>
          
          <div 
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div 
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-gray-400)',
              }}
            >
              {stats.suspended}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              留守止め
            </div>
          </div>

          <div 
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div 
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-primary-500)',
              }}
            >
              {stats.duration}分
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              所要時間
            </div>
          </div>

          <div 
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div 
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-success-500)',
              }}
            >
              {stats.improvement}分
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              前回比
            </div>
            <div 
              style={{ 
                fontSize: 'var(--text-xs)', 
                color: 'var(--color-success-500)',
                marginTop: '4px',
              }}
            >
              ↓{Math.abs(stats.improvementPercent)}%改善
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div 
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            配達詳細
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>配達完了</span>
              <span style={{ color: 'var(--text-primary)' }}>{stats.completed}件</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>スキップ（留守止め）</span>
              <span style={{ color: 'var(--text-primary)' }}>{stats.suspended}件</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>配達できず</span>
              <span style={{ color: 'var(--text-primary)' }}>{stats.failed}件</span>
            </div>
            
            <div 
              className="my-3"
              style={{ 
                height: '1px', 
                backgroundColor: 'var(--border-default)' 
              }}
            />
            
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>開始時刻</span>
              <span style={{ color: 'var(--text-primary)' }}>{stats.startTime}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>完了時刻</span>
              <span style={{ color: 'var(--text-primary)' }}>{stats.endTime}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>移動距離</span>
              <span style={{ color: 'var(--text-primary)' }}>{stats.distance}km</span>
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full rounded-lg font-bold text-white mt-6"
          style={{
            height: '48px',
            backgroundColor: 'var(--color-primary-500)',
            fontSize: 'var(--text-base)',
          }}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
