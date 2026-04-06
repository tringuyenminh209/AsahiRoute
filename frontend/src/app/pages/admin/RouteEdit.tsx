import { useState, useMemo } from 'react';
import { ArrowLeft, Save, Printer, MapPin, Loader2, Users, RotateCcw } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DraggableRoutePoint } from '../../components/DraggableRoutePoint';
import { routeService, userService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function RouteEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [orderedPoints, setOrderedPoints] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch route + points
  const { data: route, isLoading, error } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routeService.getById(Number(id)),
    enabled: !!id,
  });

  // Map points when route loads
  useMemo(() => {
    if (!route) return;
    const pts = (route.points ?? []).map((p: any) => ({
      id: p.id,
      lat: p.subscriber?.lat ?? 33.955,
      lng: p.subscriber?.lng ?? 130.94,
      name: p.subscriber?.name ?? '--',
      address: p.subscriber?.address ?? '--',
      code: p.subscriber?.customer_code ?? '--',
      newspaper: (p.subscriber?.newspapers ?? []).map((n: any) => n.name).join('+') || '--',
      copies: (p.subscriber?.newspapers ?? []).reduce((s: number, n: any) => s + (n.quantity ?? 0), 0) || 1,
      isNew: false,
      isSuspended: p.subscriber?.is_suspended ?? false,
      notes: p.subscriber?.delivery_note ?? '',
      deliveryTime: '3分',
      distance: '0.5km',
    }));
    setOrderedPoints(pts);
    setHasChanges(false);
  }, [route]);

  // Fetch users for assign modal
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getList(),
    enabled: showAssignModal,
  });

  // Mutations
  const reorderMutation = useMutation({
    mutationFn: (orders: { id: number; sequence_order: number }[]) =>
      routeService.reorder(Number(id), orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', id] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setHasChanges(false);
      toast.success('配達順序を保存しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: number) => routeService.assign(Number(id), userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', id] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setShowAssignModal(false);
      toast.success('配達員を割り当てました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedPoints((items) => {
        const oldIndex = items.findIndex((p) => p.id === active.id);
        const newIndex = items.findIndex((p) => p.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    const orders = orderedPoints.map((p, idx) => ({ id: p.id, sequence_order: idx + 1 }));
    reorderMutation.mutate(orders);
  };

  const handleReset = () => {
    const pts = (route?.points ?? []).map((p: any) => ({
      id: p.id,
      lat: p.subscriber?.lat ?? 33.955,
      lng: p.subscriber?.lng ?? 130.94,
      name: p.subscriber?.name ?? '--',
      address: p.subscriber?.address ?? '--',
      code: p.subscriber?.customer_code ?? '--',
      newspaper: (p.subscriber?.newspapers ?? []).map((n: any) => n.name).join('+') || '--',
      copies: (p.subscriber?.newspapers ?? []).reduce((s: number, n: any) => s + (n.quantity ?? 0), 0) || 1,
      isNew: false,
      isSuspended: p.subscriber?.is_suspended ?? false,
      notes: p.subscriber?.delivery_note ?? '',
      deliveryTime: '3分',
      distance: '0.5km',
    }));
    setOrderedPoints(pts);
    setHasChanges(false);
  };

  const routePath = orderedPoints
    .filter(p => !p.isSuspended && p.lat && p.lng)
    .map(p => [p.lat, p.lng] as [number, number]);

  const centerLat = orderedPoints[0]?.lat ?? 33.955;
  const centerLng = orderedPoints[0]?.lng ?? 130.94;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="p-6">
        <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200">
          <p className="text-red-600 font-medium">ルートが見つかりません (ID: {id})</p>
          <Link to="/admin/routes" className="mt-4 inline-block text-sm text-[var(--color-primary-600)] hover:underline">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="h-14 px-6 bg-white border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/routes"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={20} />
            ルート管理
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {route.name ?? `ルート #${id}`} 編集
          </h1>
          {hasChanges && (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
              未保存の変更あり
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]"
          >
            <Users size={16} />
            担当者: {route.deliverer?.name ?? '未割当'}
          </button>
          <Link
            to={`/admin/routes/${id}/print`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]"
          >
            <Printer size={16} />
            印刷
          </Link>
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]"
            >
              <RotateCcw size={16} />
              リセット
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || reorderMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] disabled:opacity-40 transition-colors"
          >
            {reorderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            保存
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sortable List */}
        <div className="w-96 border-r border-[var(--border-default)] flex flex-col bg-white">
          {/* Route meta */}
          <div className="px-4 py-3 bg-[var(--color-gray-50)] border-b border-[var(--border-default)] space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>{orderedPoints.length}件</span>
              <span>{orderedPoints.filter(p => p.isSuspended).length}件 留守</span>
              <span>{orderedPoints.filter(p => !p.isSuspended).length}件 配達</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">ドラッグして配達順序を変更</p>
          </div>

          {/* Scrollable points */}
          <div className="flex-1 overflow-y-auto p-3">
            {orderedPoints.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-secondary)] text-sm">
                <MapPin size={32} className="mx-auto mb-2 opacity-40" />
                配達ポイントなし
              </div>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedPoints.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {orderedPoints.map((point, index) => (
                    <DraggableRoutePoint
                      key={point.id}
                      point={point}
                      index={index}
                      selectedPoint={selectedPoint}
                      setSelectedPoint={setSelectedPoint}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right: Map */}
        <div className="flex-1">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://mt{s}.google.com/vt/lyrs=m&hl=ja&gl=JP&x={x}&y={y}&z={z}"
              subdomains="0123"
              maxNativeZoom={20}
              attribution="&copy; Google Maps"
            />
            {routePath.length >= 2 && (
              <Polyline positions={routePath} color="#CC0000" weight={3} opacity={0.7} dashArray="8 4" />
            )}
            {orderedPoints.map((point, index) => (
              point.lat && point.lng ? (
                <Marker
                  key={point.id}
                  position={[point.lat, point.lng]}
                  icon={L.divIcon({
                    html: `<div style="
                      width:28px;height:28px;
                      background:${point.isSuspended ? '#9CA3AF' : selectedPoint === point.id ? '#CC0000' : '#3B82F6'};
                      border:2px solid white;border-radius:50%;
                      display:flex;align-items:center;justify-content:center;
                      font-size:11px;font-weight:bold;color:white;
                      box-shadow:0 2px 4px rgba(0,0,0,0.3);
                    ">${index + 1}</div>`,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                  })}
                  eventHandlers={{ click: () => setSelectedPoint(point.id) }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold">#{index + 1} {point.name}</div>
                      <div className="text-gray-500">{point.address}</div>
                      <div>{point.newspaper} × {point.copies}部</div>
                      {point.notes && <div className="text-orange-600 italic">{point.notes}</div>}
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Assign Deliverer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-[var(--border-default)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">配達員を割り当て</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{route.name}</p>
            </div>
            <div className="p-6 space-y-2 max-h-80 overflow-y-auto">
              {(users as any[]).filter((u: any) => u.role === 'deliverer' || u.role === 'staff').map((u: any) => (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUserId === u.id
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                      : 'border-[var(--border-default)] hover:bg-[var(--color-gray-50)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="assignUser"
                    value={u.id}
                    checked={selectedUserId === u.id}
                    onChange={() => setSelectedUserId(u.id)}
                    className="text-[var(--color-primary-500)]"
                  />
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-sm font-bold text-[var(--color-primary-600)]">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{u.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{u.email}</div>
                  </div>
                </label>
              ))}
              {(users as any[]).length === 0 && (
                <p className="text-sm text-center py-4 text-[var(--text-secondary)]">配達員なし</p>
              )}
            </div>
            <div className="p-4 border-t border-[var(--border-default)] flex gap-2 justify-end">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedUserId(null); }}
                className="px-4 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]"
              >
                キャンセル
              </button>
              <button
                onClick={() => selectedUserId && assignMutation.mutate(selectedUserId)}
                disabled={!selectedUserId || assignMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-lg disabled:opacity-40 flex items-center gap-2"
              >
                {assignMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                割り当て
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
