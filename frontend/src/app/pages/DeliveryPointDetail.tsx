import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, Volume2, CheckCircle2, SkipForward, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

const WEEK_DAYS = [
  { value: 1, label: '月' },
  { value: 2, label: '火' },
  { value: 3, label: '水' },
  { value: 4, label: '木' },
  { value: 5, label: '金' },
  { value: 6, label: '土' },
  { value: 7, label: '日' },
];

export function DeliveryPointDetail() {
  const navigate = useNavigate();
  const { id, pointId } = useParams<{ id: string; pointId: string }>();
  const { activeDelivery, loggedPoints, logPoint } = useDeliveryStore();
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();

  // Delivery days editor state
  const [scheduleOpenNpId, setScheduleOpenNpId] = useState<number | null>(null);
  const [daysDraft, setDaysDraft] = useState<number[]>([]); // empty = all days

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

  const daysMutation = useMutation({
    mutationFn: ({ npId, days }: { npId: number; days: number[] | null }) =>
      deliveryService.updateDeliveryDays(Number(point!.subscriber.id), npId, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
      setScheduleOpenNpId(null);
      toast.success('配達曜日を更新しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

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
          <button onClick={() => navigate(-1)}>
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
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              📰 購読新聞
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {sub.newspapers.map((n, i) => {
              const isOpen = scheduleOpenNpId === n.id;
              return (
                <div key={i}>
                  {/* Newspaper row */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                        {n.name} ×{n.today_quantity ?? n.quantity}
                      </span>
                      {n.today_quantity != null && n.today_quantity !== n.quantity && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-600)', marginLeft: '4px' }}>
                          (通常{n.quantity}部)
                        </span>
                      )}
                      {/* Current delivery days badge */}
                      {n.delivery_days && (
                        <div className="mt-0.5">
                          <span style={{ fontSize: '11px', color: '#7C3AED' }}>
                            {WEEK_DAYS.filter(d => n.delivery_days!.includes(d.value)).map(d => d.label).join('・')}曜のみ
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (isOpen) {
                          setScheduleOpenNpId(null);
                        } else {
                          setScheduleOpenNpId(n.id);
                          setDaysDraft(n.delivery_days ?? []);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      曜日設定
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Day picker panel */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2" style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid var(--border-default)' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        配達する曜日を選んでください
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {/* All days */}
                        <button
                          type="button"
                          onClick={() => setDaysDraft([])}
                          className="px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: daysDraft.length === 0 ? 'var(--color-primary-500)' : 'white',
                            color: daysDraft.length === 0 ? 'white' : 'var(--text-secondary)',
                            borderColor: daysDraft.length === 0 ? 'var(--color-primary-500)' : 'var(--border-default)',
                          }}
                        >
                          全日
                        </button>
                        {WEEK_DAYS.map(({ value, label }) => {
                          const selected = daysDraft.includes(value);
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setDaysDraft(prev => {
                                  const next = selected
                                    ? prev.filter(d => d !== value)
                                    : [...prev, value].sort((a, b) => a - b);
                                  return next;
                                });
                              }}
                              className="w-10 h-10 rounded-full border font-bold text-sm transition-colors"
                              style={{
                                backgroundColor: selected ? '#2563EB' : 'white',
                                color: selected ? 'white' : 'var(--text-secondary)',
                                borderColor: selected ? '#2563EB' : 'var(--border-default)',
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {daysDraft.length > 0 && (
                        <p style={{ fontSize: '11px', color: '#2563EB', marginBottom: '8px' }}>
                          {WEEK_DAYS.filter(d => daysDraft.includes(d.value)).map(d => d.label).join('・')}曜日のみ配達
                        </p>
                      )}
                      <button
                        onClick={() => daysMutation.mutate({ npId: n.id, days: daysDraft.length === 0 ? null : daysDraft })}
                        disabled={daysMutation.isPending}
                        className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--color-primary-500)', fontSize: 'var(--text-sm)' }}
                      >
                        {daysMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        保存
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
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
