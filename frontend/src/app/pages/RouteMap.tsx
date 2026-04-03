import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Volume2, List, Navigation, CheckCircle2,
  SkipForward, XCircle, Zap, Route, Loader2, MapPin, Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService, RoutePoint } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

type PointStatus = 'delivered' | 'skipped' | 'failed' | 'absent' | 'suspended' | 'pending';

const STATUS_COLOR: Record<PointStatus, string> = {
  delivered: '#22C55E',
  pending: '#3B82F6',
  skipped: '#6B7280',
  absent: '#6B7280',
  failed: '#EF4444',
  suspended: '#9CA3AF',
};

function getEffectiveStatus(point: RoutePoint, loggedPoints: Record<number, string>): PointStatus {
  if (point.is_suspended) return 'suspended';
  return (loggedPoints[point.id] as PointStatus) ?? 'pending';
}

export function RouteMap() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { activeDelivery, loggedPoints, logPoint, clearSession } = useDeliveryStore();

  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [sheetHeight] = useState(300);
  const [isCompleting, setIsCompleting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['my-routes', today],
    queryFn: () => deliveryService.getMyRoutes(today),
  });

  const route = useMemo(
    () => routes.find((r) => String(r.id) === id),
    [routes, id]
  );

  // Active (non-suspended) points in sequence order
  const activePoints = useMemo(
    () => (route?.points ?? []).filter((p) => !p.is_suspended),
    [route]
  );

  // Find first pending point as current
  const effectiveIndex = useMemo(() => {
    const idx = activePoints.findIndex((p) => !loggedPoints[p.id]);
    return idx === -1 ? activePoints.length - 1 : idx;
  }, [activePoints, loggedPoints]);

  const displayIndex = Math.max(0, Math.min(currentPointIndex, effectiveIndex));
  const currentPoint: RoutePoint | undefined = activePoints[displayIndex];

  const deliveredCount = activePoints.filter((p) => loggedPoints[p.id] === 'delivered').length;
  const suspendedCount = (route?.points ?? []).filter((p) => p.is_suspended).length;
  const totalActive = activePoints.length;

  // Map bounds from points that have lat/lng
  const geoPoints = (route?.points ?? []).filter(
    (p) => p.subscriber.lat !== null && p.subscriber.lng !== null
  );
  const lats = geoPoints.map((p) => p.subscriber.lat as number);
  const lngs = geoPoints.map((p) => p.subscriber.lng as number);
  const minLat = lats.length ? Math.min(...lats) : 33.95;
  const maxLat = lats.length ? Math.max(...lats) : 33.97;
  const minLng = lngs.length ? Math.min(...lngs) : 131.24;
  const maxLng = lngs.length ? Math.max(...lngs) : 131.26;
  const latSpan = maxLat - minLat || 0.01;
  const lngSpan = maxLng - minLng || 0.01;

  const toSvg = (lat: number, lng: number) => ({
    x: ((lng - minLng) / lngSpan) * 80 + 10,
    y: ((maxLat - lat) / latSpan) * 80 + 10,
  });

  // Log a point delivery
  const logMutation = useMutation({
    mutationFn: (vars: { pointId: number; status: 'delivered' | 'skipped' | 'failed' | 'absent' }) =>
      deliveryService.logPoint({
        delivery_id: activeDelivery!.id,
        route_point_id: vars.pointId,
        status: vars.status,
        delivered_at: new Date().toISOString(),
      }),
    onMutate: ({ pointId, status }) => {
      // Optimistic update
      logPoint(pointId, status);
    },
    onError: (err, { pointId }) => {
      // Rollback optimistic update would require removing from loggedPoints
      // For simplicity: just show error, the local state remains
      toast.error(extractApiError(err));
    },
    onSuccess: () => {
      // Advance to next pending point
      const nextIdx = activePoints.findIndex(
        (p, i) => i > displayIndex && !loggedPoints[p.id]
      );
      if (nextIdx !== -1) setCurrentPointIndex(nextIdx);
    },
  });

  const handleLog = (status: 'delivered' | 'skipped' | 'failed') => {
    if (!currentPoint || !activeDelivery) {
      toast.error('配達セッションが開始されていません');
      return;
    }
    logMutation.mutate({ pointId: currentPoint.id, status });
  };

  // Complete the whole delivery
  const handleCompleteDelivery = async () => {
    if (!activeDelivery) return;
    setIsCompleting(true);
    try {
      const summary = await deliveryService.completeDelivery(activeDelivery.id);
      clearSession();
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
      navigate(`/mobile/delivery/${activeDelivery.id}/summary`, { state: { summary } });
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setIsCompleting(false);
    }
  };

  const allDone = activePoints.every((p) => !!loggedPoints[p.id]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          ルートが見つかりません
        </p>
        <button
          onClick={() => navigate('/mobile')}
          className="px-6 py-3 rounded-lg text-white font-bold"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{ height: '56px', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mobile')} className="p-1">
            <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <span className="font-bold" style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            {route.area.name} {route.delivery_time === 'morning' ? '朝刊' : '夕刊'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary-500)' }}>
            {deliveredCount} / {totalActive}
          </span>
          <button className="p-1">
            <Volume2 size={24} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => navigate(`/mobile/route/${id}/list`)} className="p-1">
            <List size={24} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative" style={{ height: '4px', backgroundColor: 'var(--color-gray-200)' }}>
        <div
          className="absolute top-0 left-0 h-full transition-all"
          style={{
            width: `${totalActive > 0 ? (deliveredCount / totalActive) * 100 : 0}%`,
            backgroundColor: 'var(--color-success-500)',
          }}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: '#E5E3DF' }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#D1D5DB" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Route lines */}
          {geoPoints.map((point, idx) => {
            if (idx === 0) return null;
            const prev = geoPoints[idx - 1];
            const p1 = toSvg(prev.subscriber.lat as number, prev.subscriber.lng as number);
            const p2 = toSvg(point.subscriber.lat as number, point.subscriber.lng as number);
            const status = getEffectiveStatus(point, loggedPoints);
            return (
              <line
                key={`line-${point.id}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={STATUS_COLOR[status]}
                strokeWidth="0.5"
                strokeDasharray={status === 'pending' ? '2,1' : '0'}
                opacity="0.6"
              />
            );
          })}

          {/* Point markers */}
          {(route.points).map((point, idx) => {
            if (!point.subscriber.lat || !point.subscriber.lng) return null;
            const { x, y } = toSvg(point.subscriber.lat, point.subscriber.lng);
            const status = getEffectiveStatus(point, loggedPoints);
            const color = STATUS_COLOR[status];
            const isCurrent = currentPoint?.id === point.id;

            return (
              <g key={point.id}>
                {isCurrent && (
                  <circle cx={x} cy={y} r="4" fill="none" stroke={color} strokeWidth="0.3" opacity="0.3">
                    <animate attributeName="r" from="4" to="7" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={isCurrent ? '2.5' : '1.5'} fill={color} stroke="white" strokeWidth="0.3" />
                <text x={x} y={y - 2.5} fontSize="1.5" fontWeight="bold" fill={color} textAnchor="middle">
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Route Info Card */}
        <div
          className="absolute top-4 left-4 right-4 rounded-xl p-3 shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {route.name}
              </span>
            </div>
            {suspendedCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--text-secondary)' }}>
                留守 {suspendedCount}件
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {route.estimated_distance_m ? `${(route.estimated_distance_m / 1000).toFixed(1)}km` : '--'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {route.estimated_duration_min ? `約${route.estimated_duration_min}分` : '--'}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} />
              {deliveredCount}/{totalActive}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div
          className="absolute bottom-4 left-4 rounded-lg p-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.95)', fontSize: 'var(--text-xs)' }}
        >
          {[
            { color: '#22C55E', label: '配達済み' },
            { color: '#3B82F6', label: '未配達' },
            { color: '#9CA3AF', label: '留守止め' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <button className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
          <Navigation size={20} style={{ color: 'var(--color-primary-500)' }} />
        </button>
      </div>

      {/* Bottom Sheet */}
      <div
        className="relative bg-white rounded-t-3xl shadow-2xl"
        style={{ height: `${sheetHeight}px` }}
      >
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-gray-300)' }} />
        </div>

        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: `${sheetHeight - 60}px` }}>
          {allDone ? (
            /* All points done → show complete button */
            <div className="text-center">
              <p className="font-bold text-lg mb-4" style={{ color: 'var(--color-success-600)' }}>
                全{totalActive}件の配達が完了しました！
              </p>
              <button
                onClick={handleCompleteDelivery}
                disabled={isCompleting}
                className="w-full rounded-lg font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ height: '56px', backgroundColor: 'var(--color-success-500)', fontSize: 'var(--text-lg)' }}
              >
                {isCompleting ? <><Loader2 size={20} className="animate-spin" /> 集計中...</> : <><Zap size={20} /> 配達を完了する</>}
              </button>
            </div>
          ) : currentPoint ? (
            <>
              {/* Point info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold" style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-primary-500)' }}>
                      #{currentPoint.sequence_order}
                    </span>
                    <span className="font-bold" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                      {currentPoint.subscriber.name} 様
                    </span>
                  </div>
                  <p className="mb-1" style={{ fontSize: 'var(--text-base)', color: 'var(--color-gray-600)' }}>
                    {currentPoint.subscriber.address}
                  </p>
                  {currentPoint.subscriber.address_detail && (
                    <p className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {currentPoint.subscriber.address_detail}
                    </p>
                  )}
                </div>
              </div>

              {/* Newspapers */}
              <div className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                <span>📰</span>
                <span>{currentPoint.subscriber.newspapers.map((n) => `${n.name} ×${n.quantity}`).join('、')}</span>
              </div>

              {/* Delivery note */}
              {currentPoint.subscriber.delivery_note && (
                <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#FEF3C7', fontSize: 'var(--text-sm)' }}>
                  <div className="flex items-start gap-2">
                    <span>📝</span>
                    <span style={{ color: '#92400E' }}>{currentPoint.subscriber.delivery_note}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <button
                onClick={() => handleLog('delivered')}
                disabled={logMutation.isPending}
                className="w-full rounded-lg font-bold text-white mb-2 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ height: '56px', backgroundColor: 'var(--color-success-500)', fontSize: 'var(--text-lg)' }}
              >
                {logMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={24} />}
                配達完了
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleLog('skipped')}
                  disabled={logMutation.isPending}
                  className="flex-1 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ height: '44px', backgroundColor: 'var(--color-gray-100)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}
                >
                  <SkipForward size={18} />
                  スキップ
                </button>
                <button
                  onClick={() => handleLog('failed')}
                  disabled={logMutation.isPending}
                  className="flex-1 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ height: '44px', backgroundColor: '#FEF2F2', color: 'var(--color-danger-600)', fontSize: 'var(--text-sm)' }}
                >
                  <XCircle size={18} />
                  配達できず
                </button>
              </div>

              <p className="text-center mt-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                ← スキップ | 完了 →
              </p>
            </>
          ) : (
            <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              配達ポイントがありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
