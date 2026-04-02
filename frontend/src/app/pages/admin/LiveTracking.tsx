import { useState } from 'react';
import { MapPin, ChevronRight, Activity, AlertTriangle, Layers, Clock, Zap, Battery, RefreshCw, Phone, MessageSquare, Radio, TrendingUp, Navigation, CloudRain, Wind, Eye, EyeOff, Filter, Users, Package, CheckCircle, XCircle, Pause } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const deliveryPersons: DeliveryPerson[] = [
  {
    id: '1',
    name: '佐藤太郎',
    area: 'A区域',
    status: 'active',
    progress: 78,
    completed: 112,
    total: 148,
    elapsed: '62分経過',
    estimatedCompletion: '6:45',
    lat: 33.955,
    lng: 130.94,
    trail: [
      [33.950, 130.935],
      [33.952, 130.937],
      [33.955, 130.94],
    ],
    speed: 18,
    batteryLevel: 78,
    lastUpdate: '30秒前',
    nextDelivery: '○○町1-2-3',
    phone: '090-1111-2222',
    vehicle: 'バイク',
  },
  {
    id: '2',
    name: '田中花子',
    area: 'B区域',
    status: 'delayed',
    progress: 52,
    completed: 68,
    total: 130,
    elapsed: '85分経過',
    estimatedCompletion: '7:10',
    lat: 33.950,
    lng: 130.945,
    trail: [
      [33.945, 130.940],
      [33.948, 130.943],
      [33.950, 130.945],
    ],
    speed: 12,
    batteryLevel: 45,
    lastUpdate: '1分前',
    nextDelivery: '○○町2-5-8',
    phone: '090-2222-3333',
    vehicle: '自転車',
  },
  {
    id: '3',
    name: '李 明',
    area: 'C区域',
    status: 'active',
    progress: 65,
    completed: 82,
    total: 126,
    elapsed: '58分経過',
    estimatedCompletion: '6:50',
    lat: 33.945,
    lng: 130.940,
    trail: [
      [33.940, 130.935],
      [33.943, 130.938],
      [33.945, 130.940],
    ],
    speed: 20,
    batteryLevel: 92,
    lastUpdate: '15秒前',
    nextDelivery: '○○町3-7-2',
    phone: '090-3333-4444',
    vehicle: 'バイク',
  },
  {
    id: '4',
    name: 'グエン',
    area: 'D区域',
    status: 'not-started',
    progress: 0,
    completed: 0,
    total: 98,
    elapsed: '未開始',
    estimatedCompletion: '-',
    lat: 33.940,
    lng: 130.935,
    trail: [],
    speed: 0,
    batteryLevel: 100,
    lastUpdate: '5分前',
    nextDelivery: '-',
    phone: '090-4444-5555',
    vehicle: '自転車',
  },
];

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

  // Calculate real-time statistics
  const stats = {
    total: deliveryPersons.length,
    active: deliveryPersons.filter(p => p.status === 'active').length,
    delayed: deliveryPersons.filter(p => p.status === 'delayed').length,
    completed: deliveryPersons.filter(p => p.status === 'completed').length,
    totalDeliveries: deliveryPersons.reduce((sum, p) => sum + p.total, 0),
    completedDeliveries: deliveryPersons.reduce((sum, p) => sum + p.completed, 0),
    avgProgress: Math.round(deliveryPersons.reduce((sum, p) => sum + p.progress, 0) / deliveryPersons.length),
    avgSpeed: Math.round(deliveryPersons.filter(p => p.speed && p.speed > 0).reduce((sum, p) => sum + (p.speed || 0), 0) / deliveryPersons.filter(p => p.speed && p.speed > 0).length),
  };

  // Filter delivery persons
  const filteredPersons = deliveryPersons.filter(person => {
    const matchesArea = areaFilter === 'all' || person.area === areaFilter;
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    return matchesArea && matchesStatus;
  });

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