import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, Volume2, CheckCircle2, SkipForward, XCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export function DeliveryPointDetail() {
  const navigate = useNavigate();
  const { id, pointId } = useParams<{ id: string; pointId: string }>();
  const { activeDelivery, loggedPoints, logPoint } = useDeliveryStore();
  const { currentLanguage } = useLanguage();

  const today = new Date().toISOString().split('T')[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['my-routes', today],
    queryFn: () => deliveryService.getMyRoutes(today),
  });

  const route = useMemo(() => routes.find((r) => String(r.id) === id), [routes, id]);
  const point = useMemo(
    () => route?.points.find((p) => String(p.id) === pointId),
    [route, pointId]
  );

  const currentStatus = point
    ? point.is_suspended
      ? 'suspended'
      : (loggedPoints[point.id] ?? 'pending')
    : null;

  const logMutation = useMutation({
    mutationFn: (status: 'delivered' | 'skipped' | 'failed') =>
      deliveryService.logPoint({
        delivery_id: activeDelivery!.id,
        route_point_id: point!.id,
        status,
        delivered_at: new Date().toISOString(),
      }),
    onSuccess: (_, status) => {
      logPoint(point!.id, status);
      navigate(`/mobile/route/${id}/map`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleLog = (status: 'delivered' | 'skipped' | 'failed') => {
    if (!activeDelivery) {
      toast.error('配達セッションが開始されていません');
      return;
    }
    logMutation.mutate(status);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
      </div>
    );
  }

  if (!point) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>ポイントが見つかりません</p>
        <button
          onClick={() => navigate(`/mobile/route/${id}/map`)}
          className="px-6 py-3 rounded-lg text-white font-bold"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          地図に戻る
        </button>
      </div>
    );
  }

  const sub = point.subscriber;
  // Get delivery note in user's language, fallback to Japanese
  const deliveryNote =
    sub.delivery_note_translations?.[currentLanguage] ?? sub.delivery_note;

  const statusLabel = () => {
    if (currentStatus === 'suspended') return { text: '留守止め', bg: 'var(--color-gray-100)', color: 'var(--color-gray-600)' };
    if (currentStatus === 'delivered') return { text: '配達済み', bg: '#DCFCE7', color: '#166534' };
    if (currentStatus === 'skipped') return { text: 'スキップ', bg: 'var(--color-gray-100)', color: 'var(--text-secondary)' };
    if (currentStatus === 'failed') return { text: '配達できず', bg: '#FEE2E2', color: '#991B1B' };
    return { text: '未配達', bg: 'var(--color-primary-100)', color: 'var(--color-primary-800)' };
  };

  const { text: statusText, bg: statusBg, color: statusColor } = statusLabel();

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{ height: '48px', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/mobile/route/${id}/map`)}>
            <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <span className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            #{point.sequence_order} {sub.name} 様
          </span>
        </div>
      </header>

      {/* Building placeholder */}
      <div
        className="flex items-center justify-center"
        style={{ height: '160px', backgroundColor: 'var(--color-gray-100)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-2">🏢</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>建物写真</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="mb-3">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: statusBg, color: statusColor }}
            >
              {statusText}
            </span>
          </div>
          <h2 className="font-bold mb-1" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
            {sub.name} 様
          </h2>
          <div className="space-y-2 mt-3">
            <div className="flex items-start gap-2">
              <MapPin size={18} style={{ color: 'var(--text-secondary)' }} className="mt-0.5 shrink-0" />
              <div>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{sub.address}</p>
                {sub.address_detail && (
                  <p className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-700)' }}>
                    {sub.address_detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Newspapers */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-card)' }}>
          <h3 className="font-semibold mb-3" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            📰 購読新聞
          </h3>
          <div className="space-y-2">
            {sub.newspapers.map((n, i) => (
              <div key={i} style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                {n.name} ×{n.quantity}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery note */}
        {deliveryNote && (
          <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF3C7' }}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: '#92400E' }}>
                📝 配達メモ
              </h3>
              <button>
                <Volume2 size={18} style={{ color: '#92400E' }} />
              </button>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', lineHeight: 1.6 }}>
              {deliveryNote}
            </p>
          </div>
        )}
      </div>

      {/* Fixed action buttons */}
      {currentStatus === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t" style={{ borderColor: 'var(--border-default)' }}>
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
        </div>
      )}

      {currentStatus !== 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={() => navigate(`/mobile/route/${id}/map`)}
            className="w-full rounded-lg font-bold flex items-center justify-center gap-2"
            style={{ height: '56px', backgroundColor: 'var(--color-gray-100)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}
          >
            地図に戻る
          </button>
        </div>
      )}
    </div>
  );
}
