import { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronRight, Activity, AlertTriangle, Layers, Clock, Zap, Battery, RefreshCw, Phone, MessageSquare, Radio, TrendingUp, Navigation, CloudRain, Wind, Eye, EyeOff, Filter, Users, Package, CheckCircle, XCircle, Pause } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardService } from '../../../services/admin.service';
import { useAuthStore } from '../../../stores/auth.store';
import { useEcho } from '../../../hooks/useEcho';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DeliveryPerson {
  id: string;
  name: string;
  area: string;
  status: 'active' | 'completed' | 'not-started' | 'delayed';
  progress: number;
  completed: number;
  total: number;
  elapsed: string;
  estimatedCompletion: string;
  lat: number;
  lng: number;
  trail: [number, number][];
  speed?: number;
  batteryLevel?: number;
  lastUpdate?: string;
  nextDelivery?: string;
  phone?: string;
  vehicle?: string;
}


const statusConfig = {
  active: {
    label: '配達中',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  completed: {
    label: '完了',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  'not-started': {
    label: '未開始',
    color: '#9CA3AF',
    bgColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  delayed: {
    label: '遅延',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
};

const createPersonIcon = (name: string, status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig];
  const initial = name.charAt(0);

  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${config.bgColor};
        border: 3px solid ${config.borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        color: ${config.color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: pulse 2s infinite;
      ">
        ${initial}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export function LiveTracking() {
  const user = useAuthStore((s) => s.user);
  const shopId = user?.shop_id;

  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard');
  const [showTrails, setShowTrails] = useState(true);
  const [showGeofence, setShowGeofence] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showWeather, setShowWeather] = useState(false);
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Real API: poll today data for initial deliverer state
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['dashboard-today'],
    queryFn: () => dashboardService.getToday(),
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  // Map API deliverers to UI shape + maintain local state for real-time updates
  const initialPersons = useMemo((): DeliveryPerson[] =>
    (todayData?.deliverers ?? []).map((d: any) => ({
      id: String(d.user_id ?? d.id),
      name: d.name,
      area: d.area ?? '--',
      status: d.status === 'completed' ? 'completed'
        : d.status === 'active' ? 'active'
        : d.status === 'delayed' ? 'delayed'
        : 'not-started',
      progress: d.progress ?? 0,
      completed: d.completed ?? 0,
      total: d.total ?? 0,
      elapsed: d.elapsed ?? '--',
      estimatedCompletion: d.estimated_completion ?? '--',
      lat: d.lat ?? 33.955 + Math.random() * 0.01,
      lng: d.lng ?? 130.94 + Math.random() * 0.01,
      trail: d.trail ?? [],
      speed: d.speed ?? 0,
      batteryLevel: d.battery_level ?? null,
      lastUpdate: d.last_update ?? '--',
      nextDelivery: d.next_delivery ?? '--',
      phone: d.phone ?? '',
      vehicle: d.vehicle ?? '--',
    }))
  , [todayData]);

  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);

  // Sync deliveryPersons when query data updates
  useEffect(() => {
    setDeliveryPersons(initialPersons);
  }, [initialPersons]);

  // WebSocket: subscribe to shop channel
  useEcho(
    `shop.${shopId}`,
    [
      {
        event: 'location.updated',
        callback: (data: any) => {
          setDeliveryPersons(prev => prev.map(p =>
            p.id === String(data.user_id)
              ? {
                  ...p,
                  lat: data.lat,
                  lng: data.lng,
                  speed: data.speed ?? p.speed,
                  lastUpdate: new Date(data.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                  trail: [...(p.trail ?? []).slice(-19), [data.lat, data.lng] as [number, number]],
                }
              : p
          ));
        },
      },
      {
        event: 'delivery.point_logged',
        callback: (data: any) => {
          setDeliveryPersons(prev => prev.map(p =>
            p.id === String(data.user_id)
              ? {
                  ...p,
                  completed: data.completed_count,
                  total: data.total_count,
                  progress: Math.round((data.completed_count / data.total_count) * 100),
                  status: 'active',
                }
              : p
          ));
        },
      },
      {
        event: 'delivery.completed',
        callback: (data: any) => {
          setDeliveryPersons(prev => prev.map(p =>
            p.id === String(data.user_id)
              ? { ...p, status: 'completed', progress: 100 }
              : p
          ));
          toast.success(`${data.user_name} が配達を完了しました (${data.completion_rate}%)`);
        },
      },
      {
        event: 'delivery.started',
        callback: (data: any) => {
          setDeliveryPersons(prev => prev.map(p =>
            p.id === String(data.user_id)
              ? { ...p, status: 'active' }
              : p
          ));
          toast.info(`${data.user_name} が配達を開始しました`);
        },
      },
      {
        event: 'deliverer.status_changed',
        callback: (data: any) => {
          setDeliveryPersons(prev => prev.map(p =>
            p.id === String(data.user_id)
              ? { ...p, status: data.status === 'delivering' ? 'active' : p.status }
              : p
          ));
        },
      },
    ],
    !!shopId,
  );

  // Calculate real-time statistics
  const stats = {
    total: deliveryPersons.length,
    active: deliveryPersons.filter(p => p.status === 'active').length,
    delayed: deliveryPersons.filter(p => p.status === 'delayed').length,
    completed: deliveryPersons.filter(p => p.status === 'completed').length,
    totalDeliveries: deliveryPersons.reduce((sum, p) => sum + p.total, 0),
    completedDeliveries: deliveryPersons.reduce((sum, p) => sum + p.completed, 0),
    avgProgress: deliveryPersons.length
      ? Math.round(deliveryPersons.reduce((sum, p) => sum + p.progress, 0) / deliveryPersons.length)
      : 0,
    avgSpeed: deliveryPersons.filter(p => p.speed && p.speed > 0).length
      ? Math.round(deliveryPersons.filter(p => p.speed && p.speed > 0).reduce((sum, p) => sum + (p.speed || 0), 0) / deliveryPersons.filter(p => p.speed && p.speed > 0).length)
      : 0,
  };

  // Filter delivery persons
  const filteredPersons = deliveryPersons.filter(person => {
    const matchesArea = areaFilter === 'all' || person.area === areaFilter;
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    return matchesArea && matchesStatus;
  });

  // Loading skeleton — shown on first load before any data arrives
  if (isLoading && deliveryPersons.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="h-14 px-6 bg-white border-b border-[var(--border-default)] flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-gray-100 p-4 flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1 bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="h-14 px-6 bg-white border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <MapPin size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              配達状況（ライブ）
            </h1>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Activity size={12} className="animate-pulse text-red-500" />
              <span>リアルタイム更新中</span>
              <span>•</span>
              <span>{autoRefresh ? `${refreshInterval}秒ごと` : '停止中'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
          >
            <TrendingUp size={16} />
            統計{showStats ? '非表示' : '表示'}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors flex items-center gap-2 ${
              autoRefresh
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
            自動更新
          </button>
          <select 
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:border-[var(--border-focus)]"
          >
            <option value="all">全区域</option>
            <option value="A区域">A区域</option>
            <option value="B区域">B区域</option>
            <option value="C区域">C区域</option>
            <option value="D区域">D区域</option>
          </select>
          <div className="flex gap-1 bg-[var(--color-gray-100)] rounded-lg p-1">
            <button className="px-3 py-1 text-sm font-medium bg-white text-[var(--text-primary)] rounded shadow-sm">
              朝刊
            </button>
            <button className="px-3 py-1 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/50 rounded">
              夕刊
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Statistics Dashboard */}
      {showStats && (
        <div className="bg-white border-b border-[var(--border-default)] px-6 py-3">
          <div className="grid grid-cols-8 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-900">総配達員</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-green-600" />
                <span className="text-xs font-medium text-green-900">配達中</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.active}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-xs font-medium text-red-900">遅延中</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{stats.delayed}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-900">総配達数</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.totalDeliveries}</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 border border-teal-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} className="text-teal-600" />
                <span className="text-xs font-medium text-teal-900">完了数</span>
              </div>
              <div className="text-2xl font-bold text-teal-900">{stats.completedDeliveries}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-900">平均進捗</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{stats.avgProgress}%</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 border border-cyan-200">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-cyan-600" />
                <span className="text-xs font-medium text-cyan-900">平均速度</span>
              </div>
              <div className="text-2xl font-bold text-cyan-900">{stats.avgSpeed} <span className="text-xs">km/h</span></div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 border border-pink-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-pink-600" />
                <span className="text-xs font-medium text-pink-900">完了率</span>
              </div>
              <div className="text-2xl font-bold text-pink-900">{Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Two Pane Layout */}
      <div className="flex h-[calc(100%-3.5rem)]" style={{ height: showStats ? 'calc(100% - 9rem)' : 'calc(100% - 3.5rem)' }}>
        {/* Left: Map - 70% */}
        <div className="flex-[70] relative">
          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 z-[1000] space-y-2">
            <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
              <button
                onClick={() => setMapLayer(mapLayer === 'standard' ? 'satellite' : 'standard')}
                className="w-full px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--color-gray-50)] rounded flex items-center gap-2"
                title="地図レイヤー切替"
              >
                <Layers size={16} />
                {mapLayer === 'standard' ? '標準地図' : '衛星画像'}
              </button>
              <button
                onClick={() => setShowTrails(!showTrails)}
                className={`w-full px-3 py-2 text-sm font-medium rounded flex items-center gap-2 ${
                  showTrails ? 'bg-blue-50 text-blue-700' : 'text-[var(--text-primary)] hover:bg-[var(--color-gray-50)]'
                }`}
                title="移動軌跡"
              >
                {showTrails ? <Eye size={16} /> : <EyeOff size={16} />}
                移動軌跡
              </button>
              <button
                onClick={() => setShowGeofence(!showGeofence)}
                className={`w-full px-3 py-2 text-sm font-medium rounded flex items-center gap-2 ${
                  showGeofence ? 'bg-purple-50 text-purple-700' : 'text-[var(--text-primary)] hover:bg-[var(--color-gray-50)]'
                }`}
                title="区域境界"
              >
                <Radio size={16} />
                区域境界
              </button>
              <button
                onClick={() => setShowWeather(!showWeather)}
                className={`w-full px-3 py-2 text-sm font-medium rounded flex items-center gap-2 ${
                  showWeather ? 'bg-cyan-50 text-cyan-700' : 'text-[var(--text-primary)] hover:bg-[var(--color-gray-50)]'
                }`}
                title="天気情報"
              >
                <CloudRain size={16} />
                天気
              </button>
            </div>
          </div>

          {/* Weather Info Overlay */}
          {showWeather && (
            <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center gap-3">
                <CloudRain size={32} className="text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">18°C</div>
                  <div className="text-sm text-[var(--text-secondary)]">曇り</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t space-y-1 text-xs">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Wind size={12} />
                  風速: 5 m/s
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <CloudRain size={12} />
                  降水確率: 20%
                </div>
              </div>
            </div>
          )}

          <MapContainer
            center={[33.9475, 130.94]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
              url={mapLayer === 'standard' 
                ? "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
                : "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"
              }
              maxZoom={18}
            />
            
            {/* Geofence circles */}
            {showGeofence && filteredPersons.map((person) => (
              <Circle
                key={`geofence-${person.id}`}
                center={[person.lat, person.lng]}
                radius={500}
                pathOptions={{
                  color: statusConfig[person.status].color,
                  weight: 2,
                  opacity: 0.3,
                  fillOpacity: 0.1,
                  dashArray: '10, 10',
                }}
              />
            ))}

            {/* Trails */}
            {showTrails && filteredPersons
              .filter((person) => person.trail.length > 0)
              .map((person) => (
                <Polyline
                  key={`trail-${person.id}`}
                  positions={person.trail}
                  pathOptions={{
                    color: statusConfig[person.status].color,
                    weight: 3,
                    opacity: 0.6,
                    dashArray: '5, 10',
                  }}
                />
              ))}
            
            {/* Markers */}
            {filteredPersons.map((person) => (
              <Marker
                key={`marker-${person.id}`}
                position={[person.lat, person.lng]}
                icon={createPersonIcon(person.name, person.status)}
                eventHandlers={{
                  click: () => setSelectedPerson(person.id),
                }}
              >
                <Popup>
                  <div className="min-w-[240px]">
                    <div className="font-bold text-base mb-1">{person.name}</div>
                    <div className="text-sm text-[var(--text-secondary)] mb-2">
                      {person.area} • {person.vehicle}
                    </div>
                    <div className="text-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>進捗:</span>
                        <span className="font-bold">{person.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>配達:</span>
                        <span>{person.completed}/{person.total}件</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>速度:</span>
                        <span>{person.speed} km/h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>バッテリー:</span>
                        <span className={person.batteryLevel! < 30 ? 'text-red-600 font-bold' : ''}>{person.batteryLevel}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>更新:</span>
                        <span className="text-xs">{person.lastUpdate}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-[var(--text-secondary)]">次の配達先:</div>
                        <div className="text-xs font-medium">{person.nextDelivery}</div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Right: Status List - 30% */}
        <div className="flex-[30] bg-white flex flex-col">
          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-primary)]">
                配達員 ({filteredPersons.filter((p) => p.status === 'active').length}/
                {filteredPersons.length} 稼働中)
              </h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-[var(--border-default)] rounded"
              >
                <option value="all">全て</option>
                <option value="active">配達中</option>
                <option value="delayed">遅延</option>
                <option value="not-started">未開始</option>
                <option value="completed">完了</option>
              </select>
            </div>
            
            {/* Status Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[var(--text-secondary)]">配達中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[var(--text-secondary)]">遅延</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-[var(--text-secondary)]">未開始</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredPersons.map((person) => {
              const config = statusConfig[person.status];
              return (
                <div
                  key={person.id}
                  className={`mb-2 bg-white border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                    selectedPerson === person.id ? 'shadow-md ring-2 ring-blue-200' : 'shadow-sm'
                  }`}
                  style={{ borderLeftColor: config.borderColor }}
                  onClick={() => setSelectedPerson(person.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                      style={{ backgroundColor: config.bgColor, color: config.color }}
                    >
                      {person.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {person.name}
                        </span>
                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[var(--text-secondary)]">{person.area}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">•</span>
                        <span className="text-xs text-[var(--text-secondary)]">{person.vehicle}</span>
                      </div>

                      {person.status !== 'not-started' && (
                        <>
                          <div className="h-2 bg-[var(--color-gray-100)] rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${person.progress}%`,
                                backgroundColor: config.color,
                              }}
                            />
                          </div>

                          <div className="text-xs text-[var(--text-secondary)] space-y-1.5">
                            <div className="flex justify-between">
                              <span>
                                {person.completed}/{person.total}件
                              </span>
                              <span className="font-bold" style={{ color: config.color }}>
                                {person.progress}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Clock size={10} />
                                <span>{person.elapsed}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap size={10} />
                                <span>{person.speed} km/h</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Battery size={10} className={person.batteryLevel! < 30 ? 'text-red-600' : ''} />
                                <span className={person.batteryLevel! < 30 ? 'text-red-600 font-bold' : ''}>
                                  {person.batteryLevel}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity size={10} />
                                <span>{person.lastUpdate}</span>
                              </div>
                            </div>
                            {person.nextDelivery && person.nextDelivery !== '-' && (
                              <div className="pt-1.5 border-t">
                                <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                                  <Navigation size={10} />
                                  <span>次: {person.nextDelivery}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-1 mt-3 pt-3 border-t">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Call:', person.id);
                              }}
                              className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 flex items-center justify-center gap-1"
                            >
                              <Phone size={12} />
                              通話
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Message:', person.id);
                              }}
                              className="flex-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 flex items-center justify-center gap-1"
                            >
                              <MessageSquare size={12} />
                              連絡
                            </button>
                          </div>
                        </>
                      )}

                      {person.status === 'not-started' && (
                        <div className="text-sm text-[var(--text-muted)] italic">
                          まだ配達を開始していません
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SOS Alert Banner - Conditional */}
      {false && (
        <div className="absolute top-14 left-0 right-0 bg-[#FEE2E2] border-b-2 border-[var(--color-danger-500)] p-4 z-[1000]">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle size={32} className="text-[var(--color-danger-600)]" />
              <div>
                <div className="font-bold text-[var(--color-danger-600)]">
                  SOS: 佐藤太郎（A区域）- 4:52発報
                </div>
                <div className="text-sm text-[var(--color-danger-600)]">
                  対応してください
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white text-[var(--color-danger-600)] border border-[var(--color-danger-300)] rounded-lg font-medium hover:bg-[var(--color-danger-50)]">
                位置を確認
              </button>
              <button className="px-4 py-2 bg-[var(--color-danger-600)] text-white rounded-lg font-medium hover:bg-[var(--color-danger-700)]">
                確認済みにする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}