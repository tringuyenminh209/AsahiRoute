import { useNavigate, useLocation, useParams } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { DeliverySummary as SummaryType } from "../../services/delivery.service";

export function DeliverySummary() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams<{ id: string }>();

  // Summary passed from RouteMap after POST /delivery/:id/complete
  const summary: SummaryType | undefined = state?.summary;

  const formatTime = (iso: string | undefined) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const distanceKm = summary?.total_distance_m
    ? (summary.total_distance_m / 1000).toFixed(1)
    : '--';

  const improvementSign = summary?.time_improvement_min != null
    ? summary.time_improvement_min <= 0 ? '↓' : '↑'
    : '';

  const routeLabel = summary
    ? `${summary.route_name} ${summary.delivery_time === 'morning' ? '朝刊' : '夕刊'}配達完了`
    : '配達完了';

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
          style={{ backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <CheckCircle2 size={48} style={{ color: 'var(--color-success-500)' }} />
        </div>
        <h1 className="font-bold mb-2 text-white" style={{ fontSize: 'var(--text-2xl)' }}>
          お疲れ様でした！
        </h1>
        <p className="text-white" style={{ fontSize: 'var(--text-base)', opacity: 0.8 }}>
          {routeLabel}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 mb-4" style={{ marginTop: '-40px' }}>
          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div className="font-bold mb-1" style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-success-500)' }}>
              {summary?.counts.delivered ?? '--'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>配達完了</div>
          </div>

          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div className="font-bold mb-1" style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-gray-400)' }}>
              {summary?.counts.absent ?? '--'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>留守止め</div>
          </div>

          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div className="font-bold mb-1" style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-primary-500)' }}>
              {summary?.duration_minutes != null ? `${summary.duration_minutes}分` : '--'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>所要時間</div>
          </div>

          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--text-3xl)',
                color: summary?.time_improvement_min != null && summary.time_improvement_min <= 0
                  ? 'var(--color-success-500)'
                  : 'var(--color-danger-500)',
              }}
            >
              {summary?.time_improvement_min != null
                ? `${improvementSign}${Math.abs(summary.time_improvement_min)}分`
                : '--'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>前回比</div>
            {summary?.time_improvement_min != null && summary.time_improvement_min <= 0 && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-500)', marginTop: '4px' }}>
                改善
              </div>
            )}
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-card)' }}>
          <h3 className="font-semibold mb-3" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            配達詳細
          </h3>
          <div className="space-y-2">
            {[
              { label: '配達完了', value: `${summary?.counts.delivered ?? '--'}件` },
              { label: 'スキップ', value: `${summary?.counts.skipped ?? '--'}件` },
              { label: '配達できず', value: `${summary?.counts.failed ?? '--'}件` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}

            <div className="my-3" style={{ height: '1px', backgroundColor: 'var(--border-default)' }} />

            {[
              { label: '開始時刻', value: formatTime(summary?.started_at) },
              { label: '完了時刻', value: formatTime(summary?.completed_at) },
              { label: '移動距離', value: `${distanceKm}km` },
              { label: '完了率', value: summary ? `${summary.completion_rate}%` : '--' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate('/mobile')}
          className="w-full rounded-lg font-bold text-white mt-6"
          style={{ height: '48px', backgroundColor: 'var(--color-primary-500)', fontSize: 'var(--text-base)' }}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
