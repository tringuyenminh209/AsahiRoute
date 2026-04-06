import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { areaService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';
import { Plus, Edit, MapIcon, Building2, Users, Route as RouteIcon, User2, Search, Filter, Grid3X3, List, Download, Upload, BarChart3, TrendingUp, AlertCircle, Eye, Settings, Layers, ZoomIn, ZoomOut, Target, Clock, CheckCircle, XCircle, Pause } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom icon for area labels
const createLabelIcon = (label: string, color: string) => {
  return L.divIcon({
    className: 'custom-area-label',
    html: `<div style="background-color: white; padding: 8px 16px; border-radius: 8px; border: 3px solid ${color}; font-weight: bold; font-size: 16px; color: ${color}; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const AREA_COLORS = ['#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

// Default bounds (Shimonoseki area) used as fallback when area has no boundary
const DEFAULT_BOUNDS_BASE: [number, number][][] = [
  [[33.955, 130.935], [33.960, 130.935], [33.960, 130.945], [33.955, 130.945]],
  [[33.950, 130.935], [33.955, 130.935], [33.955, 130.945], [33.950, 130.945]],
  [[33.945, 130.935], [33.950, 130.935], [33.950, 130.945], [33.945, 130.945]],
  [[33.940, 130.935], [33.945, 130.935], [33.945, 130.945], [33.940, 130.945]],
];


export function AreaManagement() {
  const queryClient = useQueryClient();

  // Real API
  const { data: apiAreas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areaService.getList(),
  });

  // Map API areas to UI shape
  const areas = useMemo(
    () =>
      apiAreas.map((a, i) => ({
        id: String(a.id),
        name: a.name,
        color: a.color ?? AREA_COLORS[i % AREA_COLORS.length],
        subscribers: a.subscribers_count,
        routes: a.routes_count,
        assignee: '---',
        area: '---',
        status: 'active' as const,
        completionRate: 0,
        avgDeliveryTime: 0,
        issues: 0,
        lastUpdated: '---',
        bounds: DEFAULT_BOUNDS_BASE[i % DEFAULT_BOUNDS_BASE.length],
      })),
    [apiAreas]
  );

  const updateAreaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color: string } }) =>
      areaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('エリアを更新しました');
      setShowEditModal(false);
      setEditingArea(null);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: number) => areaService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('エリアを削除しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'grid'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance'>('all');
  const [showLayers, setShowLayers] = useState({
    areas: true,
    routes: true,
    subscribers: true,
    issues: true,
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(true);
  const [editingArea, setEditingArea] = useState<typeof areas[0] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    color: '',
    subscribers: 0,
    routes: 0,
    assignee: '',
    area: '',
    status: 'active' as 'active' | 'maintenance',
  });

  // Calculate statistics
  const totalSubscribers = areas.reduce((sum, area) => sum + area.subscribers, 0);
  const totalRoutes = areas.reduce((sum, area) => sum + area.routes, 0);
  const totalIssues = areas.reduce((sum, area) => sum + area.issues, 0);
  const avgCompletionRate = areas.reduce((sum, area) => sum + area.completionRate, 0) / areas.length;

  // Filter areas
  let filteredAreas = areas;
  if (statusFilter !== 'all') {
    filteredAreas = filteredAreas.filter(area => area.status === statusFilter);
  }
  if (searchQuery) {
    filteredAreas = filteredAreas.filter(area => 
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Toggle area selection
  const toggleAreaSelection = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  // Chart data
  const performanceData = areas.map(area => ({
    name: area.name,
    完了率: area.completionRate,
    購読者: area.subscribers,
  }));

  const statusData = [
    { name: 'Active', value: areas.filter(a => a.status === 'active').length, color: '#22C55E' },
    { name: 'Maintenance', value: areas.filter(a => a.status === 'maintenance').length, color: '#F59E0B' },
    { name: 'Inactive', value: areas.filter(a => a.status === 'inactive').length, color: '#EF4444' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'maintenance':
        return <Pause size={16} className="text-yellow-600" />;
      case 'inactive':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '稼働中';
      case 'maintenance':
        return 'メンテナンス';
      case 'inactive':
        return '停止中';
      default:
        return '';
    }
  };

  // Handle edit button click
  const handleEditClick = (area: typeof areas[0], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingArea(area);
    setEditForm({
      name: area.name,
      color: area.color,
      subscribers: area.subscribers,
      routes: area.routes,
      assignee: area.assignee,
      area: area.area,
      status: area.status as 'active' | 'maintenance',
    });
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editForm.name.trim()) {
      toast.error('区域名を入力してください');
      return;
    }
    const numericId = Number(editingArea?.id);
    if (numericId && !isNaN(numericId)) {
      updateAreaMutation.mutate({ id: numericId, data: { name: editForm.name, color: editForm.color } });
    } else {
      // Fallback for mock data (non-numeric id)
      setShowEditModal(false);
      setEditingArea(null);
      toast.success(`${editForm.name}を更新しました`);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingArea(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="h-16 px-6 bg-white border-b border-[var(--border-default)] flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Building2 size={32} />
          区域管理
        </h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors flex items-center gap-2"
          >
            <BarChart3 size={18} />
            <span className="text-sm font-medium">統計{showStats ? '非表示' : '表示'}</span>
          </button>
          <button className="px-4 py-2 bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors flex items-center gap-2">
            <Download size={18} />
            <span className="text-sm font-medium">エクスポート</span>
          </button>
          <button className="px-4 py-2 bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors flex items-center gap-2">
            <Upload size={18} />
            <span className="text-sm font-medium">インポート</span>
          </button>
          <button className="px-6 py-3 bg-[var(--color-primary-500)] text-white rounded-xl font-bold text-lg hover:bg-[var(--color-primary-600)] transition-colors flex items-center gap-2 shadow-lg">
            <Plus size={24} />
            新規区域
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      {showStats && (
        <div className="px-6 py-4 bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">総区域数</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{areas.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">総購読者数</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{totalSubscribers.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <RouteIcon size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">総ルート数</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{totalRoutes}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">平均完了率</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(avgCompletionRate)}%</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">問題報告</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{totalIssues}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-[var(--border-default)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="区域名、担当者で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-[var(--color-gray-50)] rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              全て
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              稼働中
            </button>
            <button
              onClick={() => setStatusFilter('maintenance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'maintenance'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              メンテナンス
            </button>
          </div>

          {/* Selected Count */}
          {selectedAreas.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <span className="text-sm font-medium">{selectedAreas.length}個選択中</span>
              <button
                onClick={() => setSelectedAreas([])}
                className="text-xs underline hover:no-underline"
              >
                クリア
              </button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-[var(--color-gray-100)] rounded-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="マップビュー"
          >
            <MapIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="リストビュー"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="グリッドビュー"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' ? (
          // Map View
          <div className="flex h-full">
            {/* Left: Map - 60% */}
            <div className="flex-[60] relative">
              <MapContainer
                center={[33.9475, 130.94]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://mt{s}.google.com/vt/lyrs=m&hl=ja&gl=JP&x={x}&y={y}&z={z}"
                  subdomains="0123"
                  maxNativeZoom={20}
                  attribution="&copy; Google Maps"
                />
                {showLayers.areas && filteredAreas.map((area) => (
                  <Polygon
                    key={`polygon-${area.id}`}
                    positions={area.bounds as [number, number][]}
                    pathOptions={{
                      color: area.color,
                      fillColor: area.color,
                      fillOpacity: selectedArea === area.id ? 0.5 : 0.25,
                      weight: selectedArea === area.id ? 5 : 4,
                    }}
                    eventHandlers={{
                      click: () => setSelectedArea(area.id),
                    }}
                  >
                    <Popup>
                      <div className="font-bold text-lg">{area.name}</div>
                      <div className="text-base mt-1">購読者: {area.subscribers}件</div>
                      <div className="text-sm text-[var(--text-secondary)]">担当: {area.assignee}</div>
                    </Popup>
                  </Polygon>
                ))}
                {showLayers.areas && filteredAreas.map((area) => {
                  const center = [
                    (area.bounds[0][0] + area.bounds[2][0]) / 2,
                    (area.bounds[0][1] + area.bounds[2][1]) / 2,
                  ] as [number, number];

                  return (
                    <Marker
                      key={`marker-${area.id}`}
                      position={center}
                      icon={createLabelIcon(area.name, area.color)}
                    />
                  );
                })}
              </MapContainer>

              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-[1000]">
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2 pb-2 border-b">
                  レイヤー
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLayers.areas}
                    onChange={(e) => setShowLayers({ ...showLayers, areas: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">区域</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLayers.routes}
                    onChange={(e) => setShowLayers({ ...showLayers, routes: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">ルート</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLayers.subscribers}
                    onChange={(e) => setShowLayers({ ...showLayers, subscribers: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">購読者</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLayers.issues}
                    onChange={(e) => setShowLayers({ ...showLayers, issues: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">問題</span>
                </label>
              </div>
            </div>

            {/* Right: Area List - 40% */}
            <div className="flex-[40] bg-[var(--color-gray-50)] p-6 overflow-y-auto">
              {/* Performance Chart */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)] mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">区域別パフォーマンス</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar key="bar-completion-rate" dataKey="完了率" fill="var(--color-primary-500)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Area Cards */}
              <div className="space-y-4">
                {filteredAreas.map((area) => (
                  <div
                    key={area.id}
                    className={`bg-white rounded-2xl p-6 border-l-[6px] cursor-pointer transition-all ${
                      selectedArea === area.id
                        ? 'shadow-xl scale-[1.02]'
                        : 'shadow-md hover:shadow-lg'
                    }`}
                    style={{ borderLeftColor: area.color }}
                    onClick={() => setSelectedArea(area.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAreas.includes(area.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleAreaSelection(area.id);
                          }}
                          className="w-5 h-5 rounded"
                        />
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                          {area.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: area.status === 'active' ? '#DCFCE7' : area.status === 'maintenance' ? '#FEF3C7' : '#FEE2E2',
                          color: area.status === 'active' ? '#16A34A' : area.status === 'maintenance' ? '#CA8A04' : '#DC2626',
                        }}
                      >
                        {getStatusIcon(area.status)}
                        <span>{getStatusLabel(area.status)}</span>
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                        <div className="text-xs text-blue-600 mb-1">完了率</div>
                        <div className="text-xl font-bold text-blue-700">{area.completionRate}%</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
                        <div className="text-xs text-green-600 mb-1">平均時間</div>
                        <div className="text-xl font-bold text-green-700">{area.avgDeliveryTime}分</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-base text-[var(--text-secondary)]">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)] mb-0.5">購読者</div>
                          <div className="font-bold text-lg text-[var(--text-primary)]">{area.subscribers}件</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-base text-[var(--text-secondary)]">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <RouteIcon size={20} className="text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)] mb-0.5">ルート</div>
                          <div className="font-bold text-lg text-[var(--text-primary)]">{area.routes}本</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-base text-[var(--text-secondary)]">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                          <User2 size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)] mb-0.5">担当者</div>
                          <div className="font-bold text-lg text-[var(--text-primary)]">{area.assignee}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-base text-[var(--text-secondary)]">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                          <MapIcon size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)] mb-0.5">面積</div>
                          <div className="font-bold text-lg text-[var(--text-primary)]">{area.area}</div>
                        </div>
                      </div>

                      {area.issues > 0 && (
                        <div className="flex items-center gap-3 text-base">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <AlertCircle size={20} className="text-red-600" />
                          </div>
                          <div>
                            <div className="text-xs text-[var(--text-tertiary)] mb-0.5">問題</div>
                            <div className="font-bold text-lg text-red-600">{area.issues}件</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] pt-2 border-t">
                        <Clock size={14} />
                        <span>更新: {area.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t-2 border-[var(--border-default)]">
                      <button
                        onClick={(e) => handleEditClick(area, e)}
                        className="flex-1 px-4 py-3 text-base font-bold text-white bg-[var(--color-primary-500)] rounded-xl hover:bg-[var(--color-primary-600)] transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Edit size={18} />
                        編集
                      </button>
                      <button className="flex-1 px-4 py-3 text-base font-bold text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-xl hover:bg-[var(--color-gray-200)] transition-colors flex items-center justify-center gap-2">
                        <Eye size={18} />
                        詳細
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <div className="h-full overflow-y-auto p-6 bg-[var(--color-gray-50)]">
            <div className="bg-white rounded-xl shadow-sm border border-[var(--border-default)] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--color-gray-50)] border-b-2 border-[var(--border-default)]">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAreas.length === filteredAreas.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAreas(filteredAreas.map(a => a.id));
                          } else {
                            setSelectedAreas([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">区域名</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">ステータス</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">購読者</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">ルート</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">担当者</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">完了率</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[var(--text-primary)]">問題</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-[var(--text-primary)]">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area) => (
                    <tr 
                      key={area.id}
                      className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAreas.includes(area.id)}
                          onChange={() => toggleAreaSelection(area.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: area.color }}
                          />
                          <span className="font-bold text-[var(--text-primary)]">{area.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit"
                          style={{
                            backgroundColor: area.status === 'active' ? '#DCFCE7' : area.status === 'maintenance' ? '#FEF3C7' : '#FEE2E2',
                            color: area.status === 'active' ? '#16A34A' : area.status === 'maintenance' ? '#CA8A04' : '#DC2626',
                          }}
                        >
                          {getStatusIcon(area.status)}
                          <span>{getStatusLabel(area.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium">{area.subscribers}件</td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium">{area.routes}本</td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">{area.assignee}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[var(--color-gray-200)] rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className="h-full bg-[var(--color-success-500)] rounded-full"
                              style={{ width: `${area.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{area.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {area.issues > 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {area.issues}件
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] text-sm">なし</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors">
                            <Eye size={18} className="text-[var(--text-secondary)]" />
                          </button>
                          <button
                            onClick={(e) => handleEditClick(area, e)}
                            className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                          >
                            <Edit size={18} className="text-[var(--text-secondary)]" />
                          </button>
                          <button className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors">
                            <Settings size={18} className="text-[var(--text-secondary)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="h-full overflow-y-auto p-6 bg-[var(--color-gray-50)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAreas.map((area) => (
                <div
                  key={area.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)] hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedArea(area.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(area.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleAreaSelection(area.id);
                        }}
                        className="w-5 h-5 rounded"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: area.status === 'active' ? '#DCFCE7' : area.status === 'maintenance' ? '#FEF3C7' : '#FEE2E2',
                        color: area.status === 'active' ? '#16A34A' : area.status === 'maintenance' ? '#CA8A04' : '#DC2626',
                      }}
                    >
                      {getStatusIcon(area.status)}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{area.name}</h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-[var(--color-gray-50)] rounded-lg">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{area.subscribers}</div>
                      <div className="text-xs text-[var(--text-secondary)]">購読者</div>
                    </div>
                    <div className="text-center p-3 bg-[var(--color-gray-50)] rounded-lg">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{area.completionRate}%</div>
                      <div className="text-xs text-[var(--text-secondary)]">完了率</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">担当者</span>
                      <span className="font-medium text-[var(--text-primary)]">{area.assignee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">ルート</span>
                      <span className="font-medium text-[var(--text-primary)]">{area.routes}本</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">面積</span>
                      <span className="font-medium text-[var(--text-primary)]">{area.area}</span>
                    </div>
                    {area.issues > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">問題</span>
                        <span className="font-medium text-red-600">{area.issues}件</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={(e) => handleEditClick(area, e)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
                    >
                      編集
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-lg hover:bg-[var(--color-gray-200)] transition-colors">
                      詳細
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border-default)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <Edit size={24} />
                区域編集
              </h2>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Color Picker */}
                <div className="bg-[var(--color-gray-50)] rounded-xl p-4">
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-3">カラー</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg border-2 border-[var(--border-default)]" style={{ backgroundColor: editingArea.color }} />
                      <span className="text-xs text-[var(--text-secondary)]">現在</span>
                    </div>
                    <div className="text-2xl text-[var(--text-secondary)]">→</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-[var(--border-default)] cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">新規</span>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    区域名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="例: A区域"
                    className="w-full px-4 py-3 border-2 border-[var(--border-default)] rounded-xl text-base focus:outline-none focus:border-[var(--color-primary-500)] transition-colors"
                  />
                </div>

                {/* Subscribers */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">購読者数</label>
                  <input
                    type="number"
                    value={editForm.subscribers}
                    onChange={(e) => setEditForm({ ...editForm, subscribers: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-[var(--border-default)] rounded-xl text-base focus:outline-none focus:border-[var(--color-primary-500)] transition-colors"
                  />
                </div>

                {/* Routes */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">ルート数</label>
                  <input
                    type="number"
                    value={editForm.routes}
                    onChange={(e) => setEditForm({ ...editForm, routes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-[var(--border-default)] rounded-xl text-base focus:outline-none focus:border-[var(--color-primary-500)] transition-colors"
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">担当者</label>
                  <input
                    type="text"
                    value={editForm.assignee}
                    onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                    placeholder="例: 佐藤太郎"
                    className="w-full px-4 py-3 border-2 border-[var(--border-default)] rounded-xl text-base focus:outline-none focus:border-[var(--color-primary-500)] transition-colors"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">面積</label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    placeholder="例: 2.3km²"
                    className="w-full px-4 py-3 border-2 border-[var(--border-default)] rounded-xl text-base focus:outline-none focus:border-[var(--color-primary-500)] transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">ステータス</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'maintenance' })}
                    className="w-full px-4 py-3 border-2 border-[var(--border-default)] rounded-xl text-base focus:outline-none focus:border-[var(--color-primary-500)] transition-colors bg-white"
                  >
                    <option value="active">稼働中</option>
                    <option value="maintenance">メンテナンス</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="px-6 py-5 border-t border-[var(--border-default)] bg-[var(--color-gray-50)]">
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-6 py-3 bg-white text-[var(--text-secondary)] border-2 border-[var(--border-default)] rounded-xl font-bold text-base hover:bg-[var(--color-gray-100)] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-[var(--color-primary-500)] text-white rounded-xl font-bold text-base hover:bg-[var(--color-primary-600)] transition-colors shadow-lg"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}