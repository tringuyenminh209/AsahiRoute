import { useState, useMemo } from 'react';
import { Sparkles, Save, Printer, ChevronDown, MapPin, Clock, Ruler, Map as MapIcon, Plus, Copy, Download, Upload, Settings, BarChart3, TrendingUp, AlertTriangle, CheckCircle, X, Edit, Trash2, Eye, Calendar, CloudRain, Navigation, Zap, Filter, Search, Grid3X3, List as ListIcon, Share2, FileText, Info, Users, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { DraggableRoutePoint } from '../../components/DraggableRoutePoint';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { routeService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const allRoutes = [
  {
    id: 'route-1',
    name: 'A区域 朝刊ルート',
    area: 'A区域',
    type: '朝刊',
    deliverer: '佐藤太郎',
    totalPoints: 148,
    activePoints: 145,
    suspended: 3,
    newPoints: 1,
    distance: '12.5km',
    estimatedTime: '85分',
    status: 'active',
    completionRate: 96,
    avgDeliveryTime: 3.2,
    lastOptimized: '2024-04-01',
    notes: 'Main morning route',
  },
  {
    id: 'route-2',
    name: 'A区域 夕刊ルート',
    area: 'A区域',
    type: '夕刊',
    deliverer: '佐藤太郎',
    totalPoints: 98,
    activePoints: 95,
    suspended: 3,
    newPoints: 0,
    distance: '8.2km',
    estimatedTime: '55分',
    status: 'active',
    completionRate: 98,
    avgDeliveryTime: 2.8,
    lastOptimized: '2024-03-28',
    notes: '',
  },
  {
    id: 'route-3',
    name: 'B区域 朝刊ルート',
    area: 'B区域',
    type: '朝刊',
    deliverer: '田中花子',
    totalPoints: 132,
    activePoints: 130,
    suspended: 2,
    newPoints: 2,
    distance: '11.8km',
    estimatedTime: '78分',
    status: 'active',
    completionRate: 94,
    avgDeliveryTime: 3.5,
    lastOptimized: '2024-04-02',
    notes: '',
  },
  {
    id: 'route-4',
    name: 'B区域 夕刊ルート',
    area: 'B区域',
    type: '夕刊',
    deliverer: '田中花子',
    totalPoints: 85,
    activePoints: 85,
    suspended: 0,
    newPoints: 1,
    distance: '7.5km',
    estimatedTime: '48分',
    status: 'active',
    completionRate: 99,
    avgDeliveryTime: 2.5,
    lastOptimized: '2024-03-30',
    notes: '',
  },
  {
    id: 'route-5',
    name: 'C区域 朝刊ルート',
    area: 'C区域',
    type: '朝刊',
    deliverer: '李 明',
    totalPoints: 156,
    activePoints: 150,
    suspended: 6,
    newPoints: 3,
    distance: '14.2km',
    estimatedTime: '92分',
    status: 'warning',
    completionRate: 89,
    avgDeliveryTime: 3.8,
    lastOptimized: '2024-03-15',
    notes: 'Needs optimization',
  },
];

const routePoints = [
  { id: 1, lat: 33.955, lng: 130.94, name: '山本様', address: '○○町1-1', code: 'A-0001', newspaper: '朝刊', copies: 1, isNew: false, isSuspended: false, notes: '玄関右側', deliveryTime: '3分', distance: '0.5km' },
  { id: 2, lat: 33.956, lng: 130.941, name: '田中様', address: '○○町1-2', code: 'A-0002', newspaper: '朝刊', copies: 1, isNew: false, isSuspended: false, notes: '', deliveryTime: '2分', distance: '0.3km' },
  { id: 3, lat: 33.957, lng: 130.942, name: '鈴木様', address: '○○町1-3', code: 'A-0003', newspaper: '朝刊', copies: 2, isNew: false, isSuspended: false, notes: 'ポスト満杯注意', deliveryTime: '3分', distance: '0.4km' },
  { id: 4, lat: 33.958, lng: 130.943, name: '佐藤様', address: '○○町2-3', code: 'A-0045', newspaper: '朝刊', copies: 1, isNew: true, isSuspended: false, notes: '新規挿入', deliveryTime: '3分', distance: '0.5km' },
  { id: 5, lat: 33.959, lng: 130.944, name: '高橋様', address: '○○町2-5', code: 'A-0005', newspaper: '朝刊', copies: 1, isNew: false, isSuspended: false, notes: '', deliveryTime: '2分', distance: '0.3km' },
  { id: 6, lat: 33.960, lng: 130.945, name: '鈴木様', address: '○○町3-1', code: 'A-0006', newspaper: '朝刊', copies: 1, isNew: false, isSuspended: true, notes: '留守止め 4/1-4/10', deliveryTime: '0分', distance: '0.0km' },
  { id: 7, lat: 33.9545, lng: 130.9465, name: '伊藤様', address: '○○町3-2', code: 'A-0007', newspaper: '朝刊', copies: 3, isNew: false, isSuspended: false, notes: '3部配達', deliveryTime: '4分', distance: '0.2km' },
  { id: 8, lat: 33.9535, lng: 130.948, name: '渡辺様', address: '○○町3-5', code: 'A-0008', newspaper: '朝刊', copies: 1, isNew: false, isSuspended: false, notes: '', deliveryTime: '3分', distance: '0.5km' },
];

const createCustomIcon = (number: number, isNew: boolean, isSuspended: boolean) => {
  const color = isNew ? '#F59E0B' : isSuspended ? '#9CA3AF' : '#3B82F6';
  const bgColor = isNew ? '#FEF3C7' : isSuspended ? '#F1F5F9' : '#DBEAFE';

  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${bgColor};
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: ${color};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${number}
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Available deliverers list
const availableDeliverers = [
  { id: '1', name: '佐藤太郎', area: 'A区域', activeRoutes: 2 },
  { id: '2', name: '田中花子', area: 'B区域', activeRoutes: 2 },
  { id: '3', name: '李 明', area: 'C区域', activeRoutes: 1 },
  { id: '4', name: 'グエン', area: 'D区域', activeRoutes: 1 },
  { id: '5', name: '山田', area: 'E区域', activeRoutes: 3 },
];

export function RouteManagement() {
  const queryClient = useQueryClient();
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [areaFilter, setAreaFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit route states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    area: '',
    type: '朝刊' as '朝刊' | '夕刊',
    deliverer: '',
    notes: '',
  });

  // Drag & Drop for route points
  const [orderedPoints, setOrderedPoints] = useState<any[]>([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  // Real API: routes list
  const { data: routesResult, isLoading: routesLoading } = useQuery({
    queryKey: ['routes', { areaFilter, typeFilter }],
    queryFn: () => routeService.getList({
      area_id: undefined,
      delivery_time: typeFilter !== 'all' ? typeFilter : undefined,
    }),
  });

  const allRoutes = useMemo(() => (routesResult?.data ?? []).map((r: any) => ({
    id: String(r.id),
    name: r.name,
    area: r.area?.name ?? '--',
    type: r.delivery_time === 'evening' ? '夕刊' : '朝刊',
    deliverer: r.deliverer?.name ?? '未割当',
    totalPoints: r.total_points ?? 0,
    activePoints: r.active_points ?? 0,
    suspended: r.suspended_points ?? 0,
    newPoints: 0,
    distance: r.total_distance_m ? `${(r.total_distance_m / 1000).toFixed(1)}km` : '--',
    estimatedTime: r.estimated_minutes ? `${r.estimated_minutes}分` : '--',
    status: r.status ?? 'active',
    completionRate: r.completion_rate ?? 0,
    avgDeliveryTime: 3.0,
    lastOptimized: r.last_optimized_at?.split('T')[0] ?? '--',
    notes: r.notes ?? '',
    _raw: r,
  })), [routesResult]);

  // Real API: selected route detail (for points)
  const selectedRouteId = selectedRoute || (allRoutes[0]?.id ?? '');
  const { data: routeDetail } = useQuery({
    queryKey: ['route', selectedRouteId],
    queryFn: () => routeService.getById(Number(selectedRouteId)),
    enabled: !!selectedRouteId,
  });

  const routePoints = useMemo(() => {
    const pts = routeDetail?.points ?? [];
    return pts.map((p: any) => ({
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
  }, [routeDetail]);

  // Sync orderedPoints when routePoints change
  useMemo(() => {
    setOrderedPoints(routePoints);
    setHasOrderChanges(false);
  }, [routePoints]);

  // Mutations
  const reorderMutation = useMutation({
    mutationFn: (orders: { id: number; sequence_order: number }[]) =>
      routeService.reorder(Number(selectedRouteId), orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', selectedRouteId] });
      setHasOrderChanges(false);
      toast.success('配達順序を保存しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const optimizeMutation = useMutation({
    mutationFn: () => routeService.optimize(Number(selectedRouteId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', selectedRouteId] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setShowOptimization(false);
      toast.success('最適化が完了しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const currentRoute = allRoutes.find(r => r.id === selectedRouteId) || allRoutes[0];

  // Drag & drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedPoints((items) => {
        const oldIndex = items.findIndex((p) => p.id === active.id);
        const newIndex = items.findIndex((p) => p.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasOrderChanges(true);
    }
  };

  // Save new order
  const handleSaveOrder = () => {
    const orders = orderedPoints.map((p, idx) => ({ id: p.id, sequence_order: idx + 1 }));
    reorderMutation.mutate(orders);
  };

  // Reset order
  const handleResetOrder = () => {
    setOrderedPoints(routePoints);
    setHasOrderChanges(false);
  };

  // Filter routes
  let filteredRoutes = allRoutes.filter(route => {
    const matchesArea = areaFilter === 'all' || route.area === areaFilter;
    const matchesType = typeFilter === 'all' || route.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    const matchesSearch = !searchQuery ||
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.deliverer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesArea && matchesType && matchesStatus && matchesSearch;
  });

  // Calculate overall stats
  const stats = {
    totalRoutes: allRoutes.length,
    totalPoints: allRoutes.reduce((sum, r) => sum + r.totalPoints, 0),
    activeRoutes: allRoutes.filter(r => r.status === 'active').length,
    avgCompletionRate: allRoutes.length ? allRoutes.reduce((sum, r) => sum + r.completionRate, 0) / allRoutes.length : 0,
    totalDistance: allRoutes.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0).toFixed(1),
    needsOptimization: allRoutes.filter(r => r.status === 'warning').length,
  };

  const routePath = routePoints
    .filter(p => !p.isSuspended)
    .map((p) => [p.lat, p.lng] as [number, number]);

  const handleDuplicateRoute = () => {
    console.log('Duplicating route:', selectedRoute);
  };

  const handleExportRoute = () => {
    console.log('Exporting route:', selectedRoute);
  };

  // Handle edit route button click
  const handleEditRouteClick = (route: typeof allRoutes[0]) => {
    setEditingRoute(route);
    setEditForm({
      name: route.name,
      area: route.area,
      type: route.type as '朝刊' | '夕刊',
      deliverer: route.deliverer,
      notes: route.notes,
    });
    setShowEditModal(true);
  };

  // Handle save edit (UI-only for now, no route update API in service)
  const handleSaveRoute = () => {
    if (!editForm.name.trim()) { toast.error('ルート名を入力してください'); return; }
    if (!editForm.deliverer.trim()) { toast.error('配達員を選択してください'); return; }
    toast.success(`${editForm.name}を更新しました`);
    setShowEditModal(false);
    setEditingRoute(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRoute(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="h-14 px-6 bg-white border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <MapIcon size={24} />
            ルート管理
          </h1>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-[var(--color-gray-100)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MapIcon size={16} className="inline mr-1" />
              単一ルート
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListIcon size={16} className="inline mr-1" />
              全ルート一覧
            </button>
          </div>

          {viewMode === 'single' && (
            <select 
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {allRoutes.map(route => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {viewMode === 'single' ? (
            <>
              <button 
                onClick={() => setShowStats(!showStats)}
                className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
              >
                <BarChart3 size={16} />
                統計{showStats ? '非表示' : '表示'}
              </button>
              <button 
                onClick={handleDuplicateRoute}
                className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
              >
                <Copy size={16} />
                複製
              </button>
              <button 
                onClick={handleExportRoute}
                className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                エクスポート
              </button>
              <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
                <Printer size={16} />
                印刷
              </button>
              <button
                onClick={() => optimizeMutation.mutate()}
                disabled={optimizeMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {optimizeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                AI最適化
              </button>
              <button className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] transition-colors flex items-center gap-2">
                <Save size={16} />
                保存
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
              >
                <Filter size={16} />
                フィルター
              </button>
              <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
                <Upload size={16} />
                インポート
              </button>
              <button className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] transition-colors flex items-center gap-2">
                <Plus size={20} />
                新規ルート作成
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'single' ? (
        // Single Route View
        <>
          {/* Stats Bar */}
          {showStats && (
            <div className="px-6 py-4 bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
              <div className="grid grid-cols-6 gap-4">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--border-default)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-blue-600" />
                    <span className="text-xs text-[var(--text-secondary)]">配達員</span>
                  </div>
                  <div className="font-bold text-[var(--text-primary)]">{currentRoute.deliverer}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--border-default)]">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-green-600" />
                    <span className="text-xs text-[var(--text-secondary)]">配達地点</span>
                  </div>
                  <div className="font-bold text-[var(--text-primary)]">{currentRoute.totalPoints}件</div>
                  <div className="text-xs text-[var(--text-secondary)]">有効: {currentRoute.activePoints}件</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--border-default)]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} className="text-yellow-600" />
                    <span className="text-xs text-[var(--text-secondary)]">特別対応</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">留守:</span>
                      <span className="font-bold text-[var(--text-primary)] ml-1">{currentRoute.suspended}</span>
                    </div>
                    <div>
                      <span className="text-yellow-600">新規:</span>
                      <span className="font-bold text-[var(--text-primary)] ml-1">{currentRoute.newPoints}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--border-default)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler size={16} className="text-purple-600" />
                    <span className="text-xs text-[var(--text-secondary)]">距離</span>
                  </div>
                  <div className="font-bold text-[var(--text-primary)]">{currentRoute.distance}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--border-default)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-orange-600" />
                    <span className="text-xs text-[var(--text-secondary)]">予想時間</span>
                  </div>
                  <div className="font-bold text-[var(--text-primary)]">{currentRoute.estimatedTime}</div>
                  <div className="text-xs text-[var(--text-secondary)]">平均: {currentRoute.avgDeliveryTime}分/件</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--border-default)]">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="text-xs text-[var(--text-secondary)]">完了率</span>
                  </div>
                  <div className="font-bold text-green-600">{currentRoute.completionRate}%</div>
                  <div className="text-xs text-[var(--text-secondary)]">最終最適化: {currentRoute.lastOptimized}</div>
                </div>
              </div>
            </div>
          )}

          {/* Two Pane Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Map - 60% */}
            <div className="flex-[60] relative">
              <MapContainer
                center={[33.9575, 130.9425]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
                  url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
                  maxZoom={18}
                />
                <Polyline
                  positions={routePath}
                  pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7 }}
                />
                {routePoints.map((point) => (
                  <Marker
                    key={`marker-${point.id}`}
                    position={[point.lat, point.lng]}
                    icon={createCustomIcon(point.id, point.isNew, point.isSuspended)}
                    eventHandlers={{
                      click: () => setSelectedPoint(point.id),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-lg">#{point.id} {point.name}</div>
                          {point.isNew && (
                            <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-white rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="text-[var(--text-secondary)]">コード: {point.code}</div>
                          <div className="text-[var(--text-secondary)]">{point.address}</div>
                          <div className="text-[var(--text-secondary)]">{point.newspaper} × {point.copies}部</div>
                          {point.notes && (
                            <div className="text-[var(--text-secondary)] italic">📝 {point.notes}</div>
                          )}
                          <div className="flex gap-2 mt-2 pt-2 border-t">
                            <div className="text-xs">
                              <Clock size={12} className="inline" /> {point.deliveryTime}
                            </div>
                            <div className="text-xs">
                              <Navigation size={12} className="inline" /> {point.distance}
                            </div>
                          </div>
                        </div>
                        {point.isSuspended && (
                          <div className="mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            🚫 留守止め期間中
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map Overlay Info */}
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2">凡例</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-200 border-2 border-blue-500"></div>
                    <span>通常配達</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-200 border-2 border-yellow-500"></div>
                    <span>新規挿入</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-400"></div>
                    <span>留守止め</span>
                  </div>
                </div>
              </div>

              {/* Weather Info */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                <div className="flex items-center gap-2 text-sm">
                  <CloudRain size={20} className="text-blue-500" />
                  <div>
                    <div className="font-bold">15°C</div>
                    <div className="text-xs text-[var(--text-secondary)]">晴れ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Point List - 40% */}
            <div className="flex-[40] bg-white flex flex-col border-l border-[var(--border-default)]">
              <div className="p-4 border-b border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">配達順序</h3>
                  <div className="flex items-center gap-2">
                    {hasOrderChanges && (
                      <>
                        <button
                          onClick={handleResetOrder}
                          className="px-2 py-1 text-xs font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded hover:bg-[var(--color-gray-200)]"
                        >
                          リセット
                        </button>
                        <button
                          onClick={handleSaveOrder}
                          disabled={reorderMutation.isPending}
                          className="px-2 py-1 text-xs font-medium text-white bg-[var(--color-success-600)] rounded hover:bg-[var(--color-success-700)] animate-pulse disabled:opacity-50 flex items-center gap-1"
                        >
                          {reorderMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                          保存
                        </button>
                      </>
                    )}
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Info size={12} />
                      ドラッグで並び替え
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="名前・住所・コードで絞り込み..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedPoints.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 overflow-y-auto p-2">
                    {orderedPoints
                      .filter(p =>
                        !searchQuery ||
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.code.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((point, index) => (
                        <DraggableRoutePoint
                          key={point.id}
                          point={point}
                          index={index}
                          selectedPoint={selectedPoint}
                          setSelectedPoint={setSelectedPoint}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Summary Footer */}
              <div className="p-4 border-t border-[var(--border-default)] bg-[var(--color-gray-50)]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">総地点:</span>
                    <span className="font-bold">{routePoints.length}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">有効:</span>
                    <span className="font-bold">{routePoints.filter(p => !p.isSuspended).length}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">総距離:</span>
                    <span className="font-bold">{currentRoute.distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">総時間:</span>
                    <span className="font-bold">{currentRoute.estimatedTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // List View - All Routes
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Statistics Overview */}
          <div className="px-6 py-4 bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
            <div className="grid grid-cols-6 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">総ルート数</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalRoutes}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">総配達地点</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalPoints}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">稼働中</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.activeRoutes}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">平均完了率</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(stats.avgCompletionRate)}%</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Ruler size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">総距離</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalDistance}km</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">要最適化</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.needsOptimization}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-6 py-4 bg-white border-b border-[var(--border-default)]">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">区域</label>
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="all">全区域</option>
                    <option value="A区域">A区域</option>
                    <option value="B区域">B区域</option>
                    <option value="C区域">C区域</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">種類</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="all">全て</option>
                    <option value="朝刊">朝刊</option>
                    <option value="夕刊">夕刊</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">ステータス</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="all">全て</option>
                    <option value="active">稼働中</option>
                    <option value="warning">要最適化</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">検索</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      placeholder="ルート名、配達員..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Routes Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-gray-50)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-[var(--border-default)] hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedRoute(route.id);
                    setViewMode('single');
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{route.name}</h3>
                      <div className="text-sm text-[var(--text-secondary)]">{route.deliverer}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      route.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {route.status === 'active' ? '稼働中' : '要最適化'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-[var(--color-gray-50)] rounded">
                      <div className="text-xl font-bold text-[var(--text-primary)]">{route.totalPoints}</div>
                      <div className="text-xs text-[var(--text-secondary)]">配達地点</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--color-gray-50)] rounded">
                      <div className="text-xl font-bold text-green-600">{route.completionRate}%</div>
                      <div className="text-xs text-[var(--text-secondary)]">完了率</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">距離:</span>
                      <span className="font-medium">{route.distance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">時間:</span>
                      <span className="font-medium">{route.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">留守止め:</span>
                      <span className="font-medium">{route.suspended}件</span>
                    </div>
                    {route.newPoints > 0 && (
                      <div className="flex justify-between">
                        <span className="text-yellow-600">新規:</span>
                        <span className="font-medium text-yellow-600">{route.newPoints}件</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRouteClick(route);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)]"
                    >
                      <Edit size={14} className="inline mr-1" />
                      編集
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('View route:', route.id);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-lg hover:bg-[var(--color-gray-200)]"
                    >
                      <Eye size={14} className="inline mr-1" />
                      詳細
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Optimization Modal */}
      {showOptimization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border-default)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="text-purple-500" />
                AI最適化結果
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Comparison Table */}
              <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--color-gray-50)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold"></th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">現在</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">最適化後</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">改善</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--border-default)]">
                      <td className="px-4 py-3 font-medium">距離</td>
                      <td className="px-4 py-3 text-center">{currentRoute.distance}</td>
                      <td className="px-4 py-3 text-center font-bold">9.8km</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded text-sm font-bold">
                          -21.6% ✅
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t border-[var(--border-default)]">
                      <td className="px-4 py-3 font-medium">時間</td>
                      <td className="px-4 py-3 text-center">{currentRoute.estimatedTime}</td>
                      <td className="px-4 py-3 text-center font-bold">68分</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded text-sm font-bold">
                          -20.0% ✅
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t border-[var(--border-default)]">
                      <td className="px-4 py-3 font-medium">CO₂排出量</td>
                      <td className="px-4 py-3 text-center">2.5kg</td>
                      <td className="px-4 py-3 text-center font-bold">2.0kg</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded text-sm font-bold">
                          -20.0% 🌱
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Zap size={20} className="text-purple-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-bold text-purple-900 mb-1">最適化のポイント</div>
                    <ul className="space-y-1 text-purple-800">
                      <li>• 配達順序を再構成し、往復を削減</li>
                      <li>• 交通量の少ない経路を優先的に選択</li>
                      <li>• 新規挿入地点を最適な位置に配置</li>
                      <li>• 留守止め地点をスキップして効率化</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--border-default)] flex justify-end gap-3">
              <button
                onClick={() => setShowOptimization(false)}
                className="px-6 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]"
              >
                キャンセル
              </button>
              <button
                onClick={() => setShowOptimization(false)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:opacity-90 flex items-center gap-2 shadow-md"
              >
                <CheckCircle size={16} />
                この結果を適用する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border-default)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Edit className="text-blue-500" />
                ルート編集
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">ルート名</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">配達員</label>
                  <select
                    value={editForm.deliverer}
                    onChange={(e) => setEditForm({ ...editForm, deliverer: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    {availableDeliverers.map(deliverer => (
                      <option key={deliverer.id} value={deliverer.name}>{deliverer.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">区域</label>
                  <select
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="A区域">A区域</option>
                    <option value="B区域">B区域</option>
                    <option value="C区域">C区域</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">種類</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as '朝刊' | '夕刊' })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="朝刊">朝刊</option>
                    <option value="夕刊">夕刊</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">備考</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  rows={4}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[var(--border-default)] flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveRoute}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:opacity-90 flex items-center gap-2 shadow-md"
              >
                <CheckCircle size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}