import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Map as MapIcon, Search, CircleCheck, ArrowRight, CircleSlash,
  Navigation, X, Flag, AlertCircle, Clock, TrendingUp,
  WifiOff, SkipForward, Circle, GripVertical, RotateCcw, Save,
  Building2, ChevronDown, ChevronUp, UserPlus,
} from "lucide-react";
import {
  DndContext, DragEndEvent, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSwipeable } from "react-swipeable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService, RoutePoint } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

type LoggedStatus = 'delivered' | 'skipped' | 'failed' | 'absent';
type RouteMode = 'default' | 'custom';

// ── Building group helpers ────────────────────────────────────────────────────
function parseBuildingName(addressDetail: string | null): string | null {
  if (!addressDetail) return null;
  // Extract building name before room number
  const roomMatch = addressDetail.match(/^(.+?)\s*[A-Zａ-ｚ]?\d{1,4}(?:[-－]\d+)?号室/);
  if (roomMatch) return roomMatch[1].trim() || null;
  return null;
}

function parseRoomNumber(addressDetail: string | null): string | null {
  if (!addressDetail) return null;
  const m = addressDetail.match(/([A-Zａ-ｚ]?\d{1,4}(?:[-－]\d+)?号室)/);
  return m ? m[1] : null;
}

// A "building group" = 2+ active points at the same address with address_detail
type RenderItem =
  | { type: 'point'; point: RoutePoint }
  | { type: 'building'; address: string; buildingName: string; points: RoutePoint[] };

// ── Building group row ────────────────────────────────────────────────────────
function BuildingGroupRow({
  buildingName, address, points, routeId, loggedPoints, onSkip, isMutating,
}: {
  buildingName: string; address: string; points: RoutePoint[]; routeId: string;
  loggedPoints: Record<number, string>; onSkip: (id: number) => void; isMutating: boolean;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const doneCount = points.filter(p => loggedPoints[p.id] === 'delivered').length;
  const skipCount = points.filter(p => p.is_suspended || p.is_schedule_skip).length;
  const activeCount = points.length - skipCount;
  const allDone = doneCount >= activeCount && activeCount > 0;

  return (
    <div style={{ borderBottom: '2px solid var(--color-gray-200)' }}>
      {/* Building header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ backgroundColor: '#FFF7ED' }}
      >
        <Building2 size={18} style={{ color: '#D97706', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate" style={{ fontSize: 'var(--text-base)', color: '#92400E' }}>
              {buildingName}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: allDone ? '#DCFCE7' : '#FED7AA',
                color: allDone ? '#166534' : '#9A3412',
              }}
            >
              {doneCount}/{activeCount}件
            </span>
          </div>
          <span className="block truncate text-xs" style={{ color: '#B45309' }}>
            {address.replace(/^大阪府大阪市/, '')}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: '#B45309', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#B45309', flexShrink: 0 }} />}
      </button>

      {/* Room rows */}
      {expanded && points.map((point) => {
        const room = parseRoomNumber(point.subscriber.address_detail);
        const effectiveStatus = (point.is_suspended || point.is_schedule_skip)
          ? 'suspended'
          : (loggedPoints[point.id] ?? 'pending');
        const isDone = effectiveStatus === 'delivered';
        const isSusp = effectiveStatus === 'suspended';

        return (
          <div
            key={point.id}
            onClick={() => !isSusp && navigate(`/mobile/route/${routeId}/point/${point.id}`)}
            className="flex items-center gap-3 cursor-pointer"
            style={{
              height: '60px',
              padding: '0 16px 0 48px',
              borderTop: '1px solid var(--color-gray-100)',
              backgroundColor: isDone ? '#F0FDF4' : isSusp ? 'var(--color-gray-50)' : 'white',
            }}
          >
            {/* Room bubble */}
            <div
              className="flex-shrink-0 rounded-lg flex items-center justify-center font-bold"
              style={{
                minWidth: '44px', height: '28px', padding: '0 6px',
                backgroundColor: isDone ? '#22C55E' : isSusp ? '#D1D5DB' : '#D97706',
                color: 'white', fontSize: '11px',
              }}
            >
              {room ?? `#${point.sequence_order}`}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className="block truncate font-medium"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: isDone || isSusp ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
              >
                {point.subscriber.name}様
              </span>
              {(() => {
                const todayNp = point.subscriber.newspapers.filter(n => n.delivers_today);
                return todayNp.length > 0 && !isSusp ? (
                  <span style={{ fontSize: '11px', color: 'var(--color-primary-600)' }}>
                    📰 {todayNp.map(n => `${n.name}×${n.today_quantity ?? n.quantity}`).join('　')}
                  </span>
                ) : null;
              })()}
            </div>

            {isDone && <span style={{ fontSize: '13px', color: '#22C55E' }}>✓</span>}
            {isSusp && (
              <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                {point.is_schedule_skip ? '今日なし' : '留守'}
              </span>
            )}
            {effectiveStatus === 'pending' && !isSusp && (
              <ArrowRight size={16} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sortable row (drag-to-reorder) ────────────────────────────────────────────
function SortableRow({ point, loggedStatus, index }: { point: RoutePoint; loggedStatus: string | undefined; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: point.id });

  const effectiveStatus = (point.is_suspended || point.is_schedule_skip) ? 'suspended' : (loggedStatus ?? 'pending');
  const isDone      = effectiveStatus === 'delivered';
  const isSuspended = effectiveStatus === 'suspended';
  const isSkipped   = effectiveStatus === 'skipped' || effectiveStatus === 'failed';
  const draggable   = !isDone && !isSuspended;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : undefined,
        height: '64px',
        borderBottom: '1px solid var(--color-gray-100)',
        backgroundColor: isDone ? '#F0FDF4' : isSuspended || isSkipped ? 'var(--color-gray-50)' : 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 16px',
      }}
    >
      {/* Drag handle */}
      <div
        {...(draggable ? { ...attributes, ...listeners } : {})}
        className="flex-shrink-0 touch-none select-none"
        style={{ cursor: draggable ? 'grab' : 'default', color: draggable ? 'var(--color-gray-400)' : 'var(--color-gray-200)' }}
      >
        <GripVertical size={20} />
      </div>

      {/* Sequence number bubble */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
        style={{
          backgroundColor: isDone ? '#22C55E' : isSuspended ? '#D1D5DB' : isSkipped ? '#9CA3AF' : '#CC0000',
          color: 'white',
        }}
      >
        {isDone ? '✓' : isSuspended ? '—' : index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="block truncate font-medium"
          style={{
            fontSize: 'var(--text-base)',
            color: isDone || isSuspended ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {point.subscriber.name}様
        </span>
        <span className="block truncate text-sm" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {point.subscriber.address.replace(/^大阪府大阪市/, '')}
        </span>
      </div>

      {isSuspended && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', flexShrink: 0 }}>
          {point.is_schedule_skip ? '今日なし' : '留守'}
        </span>
      )}
      {isSkipped   && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', flexShrink: 0 }}>スキップ</span>}
    </div>
  );
}

// ── Normal swipe row ──────────────────────────────────────────────────────────
function RouteListItem({
  point, routeId, loggedStatus, onSkip, isMutating,
}: {
  point: RoutePoint; index: number; routeId: string;
  loggedStatus: string | undefined; onSkip: (id: number) => void; isMutating: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSwiped, setIsSwiped] = useState(false);

  const effectiveStatus = (point.is_suspended || point.is_schedule_skip) ? 'suspended' : (loggedStatus ?? 'pending');

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => { if (effectiveStatus === 'pending') setIsSwiped(true); },
    onSwipedRight: () => setIsSwiped(false),
    trackMouse: false,
  });

  const bgColor = () => {
    if (effectiveStatus === 'delivered') return '#F0FDF4';
    if (effectiveStatus === 'suspended' || effectiveStatus === 'skipped') return 'var(--color-gray-50)';
    return 'white';
  };

  return (
    <div className="relative" {...swipeHandlers}>
      {isSwiped && (
        <div className="absolute inset-0 flex items-center justify-end gap-2 px-4" style={{ backgroundColor: 'var(--color-gray-100)' }}>
          <button
            disabled={isMutating}
            onClick={() => { onSkip(point.id); setIsSwiped(false); }}
            className="flex items-center gap-1 px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-gray-600)', color: 'white' }}
          >
            <SkipForward size={16} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{t('route_list.skip')}</span>
          </button>
          <button
            onClick={() => setIsSwiped(false)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-warning-500)', color: 'white' }}
          >
            <AlertCircle size={16} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{t('route_list.back')}</span>
          </button>
        </div>
      )}
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
        {/* Sequence bubble */}
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
          style={{
            backgroundColor:
              effectiveStatus === 'delivered' ? '#22C55E' :
              effectiveStatus === 'suspended' ? '#D1D5DB' :
              effectiveStatus === 'skipped' || effectiveStatus === 'failed' ? '#9CA3AF' : '#CC0000',
            color: 'white',
          }}
        >
          {effectiveStatus === 'delivered' ? '✓' : effectiveStatus === 'suspended' ? '—' : point.sequence_order}
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="truncate block"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: effectiveStatus === 'pending' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
              color: effectiveStatus === 'delivered' || effectiveStatus === 'suspended' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {point.subscriber.name}様
          </span>
          <span className="text-sm truncate block" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {point.subscriber.address.replace(/^大阪府大阪市/, '')}
          </span>
          {/* Today's newspapers */}
          {effectiveStatus === 'pending' && (() => {
            const todayNp = point.subscriber.newspapers.filter(n => n.delivers_today);
            return todayNp.length > 0 ? (
              <span className="truncate block" style={{ fontSize: '11px', color: 'var(--color-primary-600)' }}>
                📰 {todayNp.map(n => `${n.name}×${n.today_quantity ?? n.quantity}`).join('　')}
              </span>
            ) : null;
          })()}
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          {effectiveStatus === 'delivered' && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-500)', fontWeight: 'var(--font-weight-medium)' }}>✓</span>
          )}
          {effectiveStatus === 'suspended' && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>
              {point.is_schedule_skip ? '今日なし' : '留守'}
            </span>
          )}
          {effectiveStatus === 'pending' && (
            <ArrowRight size={20} style={{ color: 'var(--color-primary-500)' }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function RouteList() {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const { id }      = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const {
    activeDelivery, loggedPoints, logPoint,
    pointOrder, setPointOrder, resetPointOrder,
    useCustomOrder, setUseCustomOrder,
  } = useDeliveryStore();

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showSearch,     setShowSearch]     = useState(false);
  const [isOffline,      setIsOffline]      = useState(!navigator.onLine);

  // Draft order for editing — separate from the saved order
  const [draftOrder, setDraftOrder] = useState<number[]>([]);
  const [isDirty,    setIsDirty]    = useState(false);

  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['my-routes', today],
    queryFn:  () => deliveryService.getMyRoutes(today),
  });

  const route     = useMemo(() => routes.find((r: any) => String(r.id) === id), [routes, id]);
  const allPoints = useMemo(() => route?.points ?? [], [route]);

  // Which mode is active for this route
  const routeMode: RouteMode = (id && useCustomOrder[id]) ? 'custom' : 'default';

  // Default order: admin's sequence_order (always available)
  const defaultOrderedPoints = useMemo(
    () => [...allPoints].sort((a: RoutePoint, b: RoutePoint) => a.sequence_order - b.sequence_order),
    [allPoints]
  );

  // Custom order: user's saved order
  const customOrderedPoints = useMemo(() => {
    const order = id ? pointOrder[id] : undefined;
    if (!order || order.length === 0) return defaultOrderedPoints;
    const pointMap = new globalThis.Map(allPoints.map((p: RoutePoint) => [p.id, p]));
    const sorted   = order.map((pid: number) => pointMap.get(pid)).filter(Boolean) as RoutePoint[];
    const inOrder  = new Set(order);
    const extra    = allPoints.filter((p: RoutePoint) => !inOrder.has(p.id));
    return [...sorted, ...extra];
  }, [allPoints, pointOrder, id, defaultOrderedPoints]);

  // Points shown based on active mode
  const activeOrderedPoints = routeMode === 'custom' ? customOrderedPoints : defaultOrderedPoints;

  // Initialize draft order when switching to custom mode
  useEffect(() => {
    if (routeMode === 'custom') {
      setDraftOrder(customOrderedPoints.map((p: RoutePoint) => p.id));
      setIsDirty(false);
    }
  }, [routeMode, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draft points for the drag editor
  const draftPoints = useMemo(() => {
    if (draftOrder.length === 0) return customOrderedPoints;
    const pointMap = new globalThis.Map(allPoints.map((p: RoutePoint) => [p.id, p]));
    return draftOrder.map((pid: number) => pointMap.get(pid)).filter(Boolean) as RoutePoint[];
  }, [draftOrder, allPoints, customOrderedPoints]);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = draftOrder.indexOf(Number(active.id));
    const newIdx = draftOrder.indexOf(Number(over.id));
    if (oldIdx !== -1 && newIdx !== -1) {
      setDraftOrder(arrayMove(draftOrder, oldIdx, newIdx));
      setIsDirty(true);
    }
  };

  const handleSaveCustomRoute = () => {
    if (!id) return;
    setPointOrder(id, draftOrder);
    setIsDirty(false);
    toast.success('マイルートを保存しました');
  };

  const handleResetToDefault = () => {
    if (!id) return;
    resetPointOrder(id);
    setUseCustomOrder(id, false);
    setIsDirty(false);
    toast.success('デフォルトルートに戻しました');
  };

  const handleSwitchMode = (mode: RouteMode) => {
    if (!id) return;
    if (mode === 'custom' && !pointOrder[id]) {
      // First time switching to custom — initialize from default
      setPointOrder(id, defaultOrderedPoints.map((p: RoutePoint) => p.id));
      setDraftOrder(defaultOrderedPoints.map((p: RoutePoint) => p.id));
    }
    setUseCustomOrder(id, mode === 'custom');
    setIsDirty(false);
  };

  // Skip mutation
  const skipMutation = useMutation({
    mutationFn: (pointId: number) =>
      deliveryService.logPoint({
        delivery_id:    activeDelivery!.id,
        route_point_id: pointId,
        status:         'skipped',
        delivered_at:   new Date().toISOString(),
      }),
    onSuccess: (_, pointId) => {
      logPoint(pointId, 'skipped');
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleSkip = (pointId: number) => {
    if (!activeDelivery) { toast.error(t('common.error')); return; }
    skipMutation.mutate(pointId);
  };

  const counts = useMemo(() => ({
    all:       allPoints.length,
    pending:   allPoints.filter((p: RoutePoint) => !p.is_suspended && !p.is_schedule_skip && !loggedPoints[p.id]).length,
    suspended: allPoints.filter((p: RoutePoint) => p.is_suspended || p.is_schedule_skip).length,
    completed: allPoints.filter((p: RoutePoint) => loggedPoints[p.id] === 'delivered').length,
  }), [allPoints, loggedPoints]);

  const filters = [
    { id: 'all',       label: t('route_list.all'),       count: counts.all },
    { id: 'pending',   label: t('route_list.pending'),   count: counts.pending },
    { id: 'suspended', label: t('route_list.suspended'), count: counts.suspended },
    { id: 'completed', label: t('home.completed'),       count: counts.completed },
  ];

  const filteredPoints = useMemo(() => {
    let pts = activeOrderedPoints;
    if (selectedFilter === 'pending')   pts = pts.filter((p: RoutePoint) => !p.is_suspended && !p.is_schedule_skip && !loggedPoints[p.id]);
    else if (selectedFilter === 'suspended') pts = pts.filter((p: RoutePoint) => p.is_suspended || p.is_schedule_skip);
    else if (selectedFilter === 'completed') pts = pts.filter((p: RoutePoint) => loggedPoints[p.id] === 'delivered');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pts = pts.filter((p: RoutePoint) =>
        p.subscriber.name.toLowerCase().includes(q) ||
        p.subscriber.address.toLowerCase().includes(q) ||
        String(p.sequence_order).includes(q)
      );
    }
    return pts;
  }, [activeOrderedPoints, selectedFilter, searchQuery, loggedPoints]);

  const nextPendingPoint = activeOrderedPoints.find((p: RoutePoint) => !p.is_suspended && !loggedPoints[p.id]);
  const progress  = counts.all > 0 ? (counts.completed / counts.all) * 100 : 0;

  // ── Building group render items (default mode only) ───────────────────────
  const renderItems = useMemo((): RenderItem[] => {
    // Count how many filtered points share each address (with address_detail)
    const addressCount = new globalThis.Map<string, RoutePoint[]>();
    filteredPoints.forEach((p: RoutePoint) => {
      if (!p.subscriber.address_detail) return;
      const key = p.subscriber.address;
      if (!addressCount.has(key)) addressCount.set(key, []);
      addressCount.get(key)!.push(p);
    });

    const grouped = new Set<string>();
    const items: RenderItem[] = [];

    filteredPoints.forEach((p: RoutePoint) => {
      const key = p.subscriber.address;
      const group = addressCount.get(key);
      if (group && group.length >= 2) {
        if (!grouped.has(key)) {
          grouped.add(key);
          const name = parseBuildingName(group[0].subscriber.address_detail) ?? key;
          items.push({ type: 'building', address: key, buildingName: name, points: group });
        }
        // individual point subsumed into building group — skip
      } else {
        items.push({ type: 'point', point: p });
      }
    });
    return items;
  }, [filteredPoints]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-page)' }}>

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{ height: '48px', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/mobile/route/${id}/map`)}>
            <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <span className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
            {route ? `${route.area.name} ${route.delivery_time === 'morning' ? t('route_list.morning') : t('route_list.evening')}` : t('route_list.title')}
          </span>
          {isOffline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#FEE2E2' }}>
              <WifiOff size={12} style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '10px', color: '#DC2626' }}>{t('route_list.offline')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/mobile/route/${id}/map`)}>
            <MapIcon size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
          {routeMode === 'default' && (
            <button onClick={() => setShowSearch(!showSearch)}>
              <Search size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
          <button
            onClick={() => navigate(`/mobile/route/${id}/add-subscriber`)}
            title="配達先を追加"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-500)', color: 'white' }}
          >
            <UserPlus size={16} />
          </button>
        </div>
      </header>

      {/* ── Route mode toggle ── */}
      <div className="bg-white border-b px-4 py-2" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => handleSwitchMode('default')}
            className="flex-1 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: routeMode === 'default' ? 'var(--color-gray-800)' : 'var(--color-gray-100)',
              color: routeMode === 'default' ? 'white' : 'var(--text-secondary)',
            }}
          >
            📋 デフォルトルート
          </button>
          <button
            onClick={() => handleSwitchMode('custom')}
            className="flex-1 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: routeMode === 'custom' ? 'var(--color-primary-500)' : 'var(--color-gray-100)',
              color: routeMode === 'custom' ? 'white' : 'var(--text-secondary)',
            }}
          >
            ⚡ マイルート
            {id && pointOrder[id] && (
              <span className="ml-1 text-xs opacity-75">✓保存済み</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Custom mode: editor toolbar ── */}
      {routeMode === 'custom' && (
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ backgroundColor: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={14} style={{ color: '#EA580C' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: '#9A3412' }}>
              ドラッグで順番を変更 · 完了済みは移動不可
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleSaveCustomRoute}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--color-primary-500)', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
              >
                <Save size={12} />
                保存
              </button>
            )}
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}
            >
              <RotateCcw size={12} />
              リセット
            </button>
          </div>
        </div>
      )}

      {/* Search (default mode only) */}
      {showSearch && routeMode === 'default' && (
        <div className="px-4 py-3 bg-white border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--color-gray-50)' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t('route_list.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
                autoFocus
              />
              {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} style={{ color: 'var(--text-secondary)' }} /></button>}
            </div>
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ backgroundColor: 'var(--color-gray-50)' }}>
        {[
          { icon: <Clock size={14} style={{ color: 'var(--color-primary-500)' }} />, label: t('home.completed'),        value: `${counts.completed}件` },
          { icon: <TrendingUp size={14} style={{ color: 'var(--color-success-500)' }} />, label: t('route_list.progress'), value: `${Math.round(progress)}%` },
          { icon: <Flag size={14} style={{ color: 'var(--color-warning-500)' }} />, label: t('route_list.remaining'),  value: `${counts.pending}件` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex flex-col items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-1 mb-1">{icon}<span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span></div>
            <span className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2 pt-1" style={{ backgroundColor: 'var(--color-gray-50)' }}>
        <div className="relative rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: 'var(--color-gray-200)' }}>
          <div className="absolute top-0 left-0 h-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'var(--color-success-500)' }} />
        </div>
      </div>

      {/* Filter tabs (default mode only) */}
      {routeMode === 'default' && (
        <div className="bg-white border-b" style={{ borderColor: 'var(--border-default)' }}>
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
      )}

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto pb-24">
        {routeMode === 'custom' ? (
          /* Custom mode: drag-to-reorder */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draftPoints.map((p: RoutePoint) => p.id)} strategy={verticalListSortingStrategy}>
              {draftPoints.map((point: RoutePoint, index: number) => (
                <SortableRow key={point.id} point={point} loggedStatus={loggedPoints[point.id]} index={index} />
              ))}
            </SortableContext>
          </DndContext>
        ) : filteredPoints.length === 0 ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? t('route_list.no_results') : t('route_list.no_points')}
          </div>
        ) : (
          /* Default mode: building-grouped swipe list */
          renderItems.map((item) =>
            item.type === 'building' ? (
              <BuildingGroupRow
                key={`building-${item.address}`}
                buildingName={item.buildingName}
                address={item.address}
                points={item.points}
                routeId={id!}
                loggedPoints={loggedPoints}
                onSkip={handleSkip}
                isMutating={skipMutation.isPending}
              />
            ) : (
              <RouteListItem
                key={item.point.id}
                point={item.point}
                index={0}
                routeId={id!}
                loggedStatus={loggedPoints[item.point.id]}
                onSkip={handleSkip}
                isMutating={skipMutation.isPending}
              />
            )
          )
        )}
      </div>

      {/* FAB */}
      {nextPendingPoint && routeMode === 'default' && (
        <button
          onClick={() => navigate(`/mobile/route/${id}/point/${nextPendingPoint.id}`)}
          className="fixed shadow-lg flex items-center gap-3 px-6 py-4 rounded-full transition-all active:scale-95"
          style={{ bottom: '24px', right: '16px', left: '16px', backgroundColor: 'var(--color-primary-500)', color: 'white', zIndex: 50 }}
        >
          <Navigation size={24} fill="white" />
          <div className="flex-1 text-left">
            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.9 }}>{t('route_list.next_point')}</div>
            <div className="font-semibold" style={{ fontSize: 'var(--text-base)' }}>
              #{nextPendingPoint.sequence_order} {nextPendingPoint.subscriber.name}様
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
