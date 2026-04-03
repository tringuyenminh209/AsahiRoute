import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Map, Search, CircleCheck, ArrowRight, CircleSlash,
  Navigation, ChevronDown, X, Flag, AlertCircle, Clock, TrendingUp,
  WifiOff, SkipForward, Circle,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService, RoutePoint } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

type LoggedStatus = 'delivered' | 'skipped' | 'failed' | 'absent';

function getEffectiveStatus(point: RoutePoint, loggedPoints: Record<number, string>) {
  if (point.is_suspended) return 'suspended';
  return (loggedPoints[point.id] as LoggedStatus) ?? 'pending';
}

// Separate component to avoid hook-in-loop
function RouteListItem({
  point,
  index,
  routeId,
  loggedStatus,
  onSkip,
  isMutating,
}: {
  point: RoutePoint;
  index: number;
  routeId: string;
  loggedStatus: string | undefined;
  onSkip: (pointId: number) => void;
  isMutating: boolean;
}) {
  const navigate = useNavigate();
  const [isSwiped, setIsSwiped] = useState(false);

  const effectiveStatus = point.is_suspended
    ? 'suspended'
    : (loggedStatus ?? 'pending');

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { if (effectiveStatus === 'pending') setIsSwiped(true); },
    onSwipedRight: () => setIsSwiped(false),
    trackMouse: false,
  });

  const statusIcon = () => {
    if (effectiveStatus === 'delivered') return <CircleCheck size={24} style={{ color: 'var(--color-success-500)' }} />;
    if (effectiveStatus === 'suspended') return <CircleSlash size={24} style={{ color: 'var(--color-gray-400)' }} />;
    if (effectiveStatus === 'skipped' || effectiveStatus === 'failed') return <CircleSlash size={24} style={{ color: 'var(--color-gray-400)' }} />;
    return <Circle size={24} style={{ color: 'var(--color-gray-300)' }} />;
  };

  const bgColor = () => {
    if (effectiveStatus === 'delivered') return '#F0FDF4';
    if (effectiveStatus === 'suspended' || effectiveStatus === 'skipped') return 'var(--color-gray-50)';
    return 'white';
  };

  return (
    <div className="relative" {...swipeHandlers}>
      {/* Swipe actions */}
      {isSwiped && (
        <div className="absolute inset-0 flex items-center justify-end gap-2 px-4" style={{ backgroundColor: 'var(--color-gray-100)' }}>
          <button
            disabled={isMutating}
            onClick={() => { onSkip(point.id); setIsSwiped(false); }}
            className="flex items-center gap-1 px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-gray-600)', color: 'white' }}
          >
            <SkipForward size={16} />
            <span style={{ fontSize: 'var(--text-sm)' }}>スキップ</span>
          </button>
          <button
            onClick={() => setIsSwiped(false)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-warning-500)', color: 'white' }}
          >
            <AlertCircle size={16} />
            <span style={{ fontSize: 'var(--text-sm)' }}>戻る</span>
          </button>
        </div>
      )}

      {/* Row */}
      <div
        onClick={() => navigate(`/mobile/route/${routeId}/point/${point.id}`)}
        className="flex items-center gap-3 px-4 border-b cursor-pointer transition-transform"
        style={{
          height: '72px',
          borderColor: 'var(--color-gray-100)',
          backgroundColor: bgColor(),
          transform: isSwiped ? 'translateX(-160px)' : 'translateX(0)',
        }}
      >
        {statusIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="truncate"
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: effectiveStatus === 'pending' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                color: effectiveStatus === 'delivered' || effectiveStatus === 'suspended'
                  ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
            >
              #{point.sequence_order} {point.subscriber.name}様
            </span>
          </div>
          <span className="text-sm truncate block" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {point.subscriber.address}
          </span>
        </div>
        {effectiveStatus === 'delivered' && (
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-500)', fontWeight: 'var(--font-weight-medium)' }}>✓</span>
        )}
        {effectiveStatus === 'pending' && (
          <ArrowRight size={20} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
}

export function RouteList() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { activeDelivery, loggedPoints, logPoint } = useDeliveryStore();

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<"order">("order");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['my-routes', today],
    queryFn: () => deliveryService.getMyRoutes(today),
  });

  const route = useMemo(() => routes.find((r) => String(r.id) === id), [routes, id]);
  const allPoints = useMemo(() => route?.points ?? [], [route]);

  const skipMutation = useMutation({
    mutationFn: (pointId: number) =>
      deliveryService.logPoint({
        delivery_id: activeDelivery!.id,
        route_point_id: pointId,
        status: 'skipped',
        delivered_at: new Date().toISOString(),
      }),
    onMutate: ({ } as any),
    onSuccess: (_, pointId) => {
      logPoint(pointId, 'skipped');
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleSkip = (pointId: number) => {
    if (!activeDelivery) { toast.error('配達セッションが開始されていません'); return; }
    skipMutation.mutate(pointId);
  };

  // Computed counts
  const counts = useMemo(() => ({
    all: allPoints.length,
    pending: allPoints.filter((p) => !p.is_suspended && !loggedPoints[p.id]).length,
    suspended: allPoints.filter((p) => p.is_suspended).length,
    completed: allPoints.filter((p) => loggedPoints[p.id] === 'delivered').length,
    skipped: allPoints.filter((p) => loggedPoints[p.id] === 'skipped' || loggedPoints[p.id] === 'failed').length,
  }), [allPoints, loggedPoints]);

  const filters = [
    { id: "all", label: "全て", count: counts.all },
    { id: "pending", label: "未配達", count: counts.pending },
    { id: "suspended", label: "留守止め", count: counts.suspended },
    { id: "completed", label: "完了", count: counts.completed },
  ];

  const filteredPoints = useMemo(() => {
    let pts = allPoints;
    if (selectedFilter === 'pending') pts = pts.filter((p) => !p.is_suspended && !loggedPoints[p.id]);
    else if (selectedFilter === 'suspended') pts = pts.filter((p) => p.is_suspended);
    else if (selectedFilter === 'completed') pts = pts.filter((p) => loggedPoints[p.id] === 'delivered');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pts = pts.filter(
        (p) =>
          p.subscriber.name.toLowerCase().includes(q) ||
          p.subscriber.address.toLowerCase().includes(q) ||
          String(p.sequence_order).includes(q)
      );
    }
    return pts;
  }, [allPoints, selectedFilter, searchQuery, loggedPoints]);

  const nextPendingPoint = allPoints.find((p) => !p.is_suspended && !loggedPoints[p.id]);
  const progress = counts.all > 0 ? (counts.completed / counts.all) * 100 : 0;
  const remaining = counts.pending;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-page)' }}>
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
            {route ? `${route.area.name} ${route.delivery_time === 'morning' ? '朝刊' : '夕刊'}` : 'ルート'}
          </span>
          {isOffline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#FEE2E2' }}>
              <WifiOff size={12} style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '10px', color: '#DC2626' }}>オフライン</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/mobile/route/${id}/map`)}>
            <Map size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => setShowSearch(!showSearch)}>
            <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 bg-white border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--color-gray-50)' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="名前、住所、番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              )}
            </div>
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ backgroundColor: 'var(--color-gray-50)' }}>
        {[
          { icon: <Clock size={14} style={{ color: 'var(--color-primary-500)' }} />, label: '完了', value: `${counts.completed}件` },
          { icon: <TrendingUp size={14} style={{ color: 'var(--color-success-500)' }} />, label: '進捗', value: `${Math.round(progress)}%` },
          { icon: <Flag size={14} style={{ color: 'var(--color-warning-500)' }} />, label: '残り', value: `${remaining}件` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex flex-col items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-1 mb-1">{icon}<span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span></div>
            <span className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3" style={{ backgroundColor: 'var(--color-gray-50)' }}>
        <div className="relative rounded-full overflow-hidden mb-2" style={{ height: '8px', backgroundColor: 'var(--color-gray-200)' }}>
          <div className="absolute top-0 left-0 h-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'var(--color-success-500)' }} />
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{counts.completed} / {counts.all} 完了</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Sort & Filter */}
      <div className="bg-white border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="px-4 py-2">
          <div className="relative inline-block">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--color-gray-50)' }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>並び替え: 順番</span>
              <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
        <div className="px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className="px-4 py-2 rounded-full whitespace-nowrap transition-all"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: selectedFilter === f.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                  backgroundColor: selectedFilter === f.id ? 'var(--color-primary-800)' : 'var(--color-gray-100)',
                  color: selectedFilter === f.id ? 'white' : 'var(--text-secondary)',
                }}
              >
                {f.label}({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {filteredPoints.length === 0 ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? '検索結果がありません' : 'ポイントがありません'}
          </div>
        ) : (
          filteredPoints.map((point, idx) => (
            <RouteListItem
              key={point.id}
              point={point}
              index={idx}
              routeId={id!}
              loggedStatus={loggedPoints[point.id]}
              onSkip={handleSkip}
              isMutating={skipMutation.isPending}
            />
          ))
        )}
      </div>

      {/* FAB */}
      {nextPendingPoint && (
        <button
          onClick={() => navigate(`/mobile/route/${id}/point/${nextPendingPoint.id}`)}
          className="fixed shadow-lg flex items-center gap-3 px-6 py-4 rounded-full transition-all active:scale-95"
          style={{ bottom: '24px', right: '16px', left: '16px', backgroundColor: 'var(--color-primary-500)', color: 'white', zIndex: 50 }}
        >
          <Navigation size={24} fill="white" />
          <div className="flex-1 text-left">
            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.9 }}>次の配達先</div>
            <div className="font-semibold" style={{ fontSize: 'var(--text-base)' }}>
              #{nextPendingPoint.sequence_order} {nextPendingPoint.subscriber.name}様
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
