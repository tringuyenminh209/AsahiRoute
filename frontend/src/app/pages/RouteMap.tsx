import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Volume2, List, Navigation, CheckCircle2, SkipForward, XCircle, Zap, Route, Save, RefreshCw, TrendingDown, Clock, MapPin, GripVertical, Plus, Edit3 } from "lucide-react";

interface DeliveryPoint {
  id: string;
  number: number;
  name: string;
  lat: number;
  lng: number;
  address: string;
  building?: string;
  newspaper: string;
  memo?: string;
  status: 'pending' | 'completed' | 'skipped' | 'suspended' | 'new';
  distance?: string;
  estimatedTime?: number;
}

interface RouteOption {
  id: string;
  name: string;
  type: 'default' | 'optimized' | 'custom';
  points: DeliveryPoint[];
  totalDistance: number;
  totalTime: number;
  createdAt?: string;
}

// Mock delivery points data - moved outside component
const mockDeliveryPoints: DeliveryPoint[] = [
  { id: 'p1', number: 1, name: '田中 太郎', lat: 33.9597, lng: 131.2429, address: '山口県下関市○○町1-2-3', building: 'ライオンズマンション 301号', newspaper: '朝日新聞朝刊 ×1', memo: '2階ポスト、右から3番目', status: 'completed', distance: '120m', estimatedTime: 2 },
  { id: 'p2', number: 2, name: '佐藤 花子', lat: 33.9607, lng: 131.2439, address: '山口県下関市○○町2-4-5', building: 'グランドハイツ 205号', newspaper: '朝日新聞朝刊 ×1', status: 'completed', distance: '180m', estimatedTime: 3 },
  { id: 'p3', number: 3, name: '鈴木 一郎', lat: 33.9617, lng: 131.2449, address: '山口県下関市○○町3-6-7', newspaper: '朝日新聞朝刊 ×2', memo: 'ポスト奥に入れてください', status: 'pending', distance: '250m', estimatedTime: 4 },
  { id: 'p4', number: 4, name: '高橋 美咲', lat: 33.9627, lng: 131.2459, address: '山口県下関市○○町4-8-9', building: 'サンシャイン 102号', newspaper: '朝日新聞朝刊 ×1', status: 'pending', distance: '320m', estimatedTime: 5 },
  { id: 'p5', number: 5, name: '伊藤 健太', lat: 33.9637, lng: 131.2469, address: '山口県下関市○○町5-10-11', newspaper: '朝日新聞朝刊 ×1', status: 'pending', distance: '410m', estimatedTime: 6 },
  { id: 'p6', number: 6, name: '渡辺 優子', lat: 33.9587, lng: 131.2479, address: '山口県下関市○○町6-12-13', building: 'メゾン青空 303号', newspaper: '朝日新聞朝刊 ×1', status: 'pending', distance: '180m', estimatedTime: 3 },
  { id: 'p7', number: 7, name: '山本 大輔', lat: 33.9577, lng: 131.2449, address: '山口県下関市○○町7-14-15', newspaper: '朝日新聞朝刊 ×2', memo: '犬注意', status: 'new', distance: '220m', estimatedTime: 4 },
  { id: 'p8', number: 8, name: '中村 真理', lat: 33.9567, lng: 131.2429, address: '山口県下関市○○町8-16-17', building: 'パークサイド 201号', newspaper: '朝日新聞朝刊 ×1', status: 'suspended', distance: '140m', estimatedTime: 2 },
];

// Store location (starting point)
const storeLocation = { lat: 33.9587, lng: 131.2419, name: "朝日新聞販売店" };

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate total route metrics
const calculateRouteMetrics = (points: DeliveryPoint[], startLat: number, startLng: number) => {
  let totalDistance = 0;
  let totalTime = 0;
  let prevLat = startLat;
  let prevLng = startLng;

  points.forEach(point => {
    const distance = calculateDistance(prevLat, prevLng, point.lat, point.lng);
    totalDistance += distance;
    totalTime += point.estimatedTime || 3;
    prevLat = point.lat;
    prevLng = point.lng;
  });

  return {
    totalDistance: Math.round(totalDistance * 1000), // meters
    totalTime: totalTime, // minutes
  };
};

// Route optimization algorithm (Nearest Neighbor TSP approximation)
const optimizeRoute = (points: DeliveryPoint[], startLat: number, startLng: number): DeliveryPoint[] => {
  const unvisited = [...points.filter(p => p.status === 'pending' || p.status === 'new')];
  const optimized: DeliveryPoint[] = [];
  let currentLat = startLat;
  let currentLng = startLng;

  // Add already completed/skipped points first
  const completedPoints = points.filter(p => p.status === 'completed' || p.status === 'skipped' || p.status === 'suspended');
  optimized.push(...completedPoints);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    unvisited.forEach((point, index) => {
      const distance = calculateDistance(currentLat, currentLng, point.lat, point.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = unvisited[nearestIndex];
    optimized.push(nearest);
    currentLat = nearest.lat;
    currentLng = nearest.lng;
    unvisited.splice(nearestIndex, 1);
  }

  return optimized;
};

// Get point color based on status
const getPointColor = (status: string) => {
  switch (status) {
    case 'completed': return '#22C55E';
    case 'pending': return '#3B82F6';
    case 'skipped': return '#6B7280';
    case 'suspended': return '#6B7280';
    case 'new': return '#F59E0B';
    default: return '#3B82F6';
  }
};

// Initial route calculation
const getInitialRoute = (): RouteOption => ({
  id: 'default',
  name: '店舗デフォルト',
  type: 'default',
  points: mockDeliveryPoints,
  ...calculateRouteMetrics(mockDeliveryPoints, storeLocation.lat, storeLocation.lng),
});

export function RouteMap() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // All useState hooks must be at the top
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(280);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('default');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([getInitialRoute()]);
  const [customRoutePoints, setCustomRoutePoints] = useState<DeliveryPoint[]>([...mockDeliveryPoints]);

  // Derived values
  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const totalPoints = currentRoute.points.length;
  const currentPoint = currentRoute.points[currentPointIndex];

  // Auto-optimize route
  const handleOptimizeRoute = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const optimizedPoints = optimizeRoute(currentRoute.points, storeLocation.lat, storeLocation.lng);
      const metrics = calculateRouteMetrics(optimizedPoints, storeLocation.lat, storeLocation.lng);
      
      const newRoute: RouteOption = {
        id: `optimized-${Date.now()}`,
        name: `最適化 ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
        type: 'optimized',
        points: optimizedPoints,
        ...metrics,
        createdAt: new Date().toISOString(),
      };

      setRoutes([...routes, newRoute]);
      setSelectedRouteId(newRoute.id);
      setIsOptimizing(false);
      setShowRouteSelector(false);
    }, 1500);
  };

  // Save custom route
  const handleSaveCustomRoute = () => {
    const metrics = calculateRouteMetrics(customRoutePoints, storeLocation.lat, storeLocation.lng);
    const newRoute: RouteOption = {
      id: `custom-${Date.now()}`,
      name: `カスタム ${routes.filter(r => r.type === 'custom').length + 1}`,
      type: 'custom',
      points: customRoutePoints,
      ...metrics,
      createdAt: new Date().toISOString(),
    };

    setRoutes([...routes, newRoute]);
    setSelectedRouteId(newRoute.id);
    setShowRouteBuilder(false);
  };

  // Drag and drop reorder
  const handleDragStart = (index: number) => {
    (window as any).dragStartIndex = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    const startIndex = (window as any).dragStartIndex;
    if (startIndex !== undefined && startIndex !== index) {
      const newPoints = [...customRoutePoints];
      const [removed] = newPoints.splice(startIndex, 1);
      newPoints.splice(index, 0, removed);
      setCustomRoutePoints(newPoints);
    }
  };

  const handleComplete = () => {
    const updatedPoints = [...currentRoute.points];
    updatedPoints[currentPointIndex].status = 'completed';
    
    const updatedRoutes = routes.map(r => 
      r.id === selectedRouteId ? { ...r, points: updatedPoints } : r
    );
    setRoutes(updatedRoutes);

    if (currentPointIndex < totalPoints - 1) {
      setCurrentPointIndex(currentPointIndex + 1);
    } else {
      navigate(`/delivery/${id}/summary`);
    }
  };

  const handleSkip = () => {
    const updatedPoints = [...currentRoute.points];
    updatedPoints[currentPointIndex].status = 'skipped';
    
    const updatedRoutes = routes.map(r => 
      r.id === selectedRouteId ? { ...r, points: updatedPoints } : r
    );
    setRoutes(updatedRoutes);

    if (currentPointIndex < totalPoints - 1) {
      setCurrentPointIndex(currentPointIndex + 1);
    }
  };

  // Calculate map bounds
  const getMapBounds = () => {
    const allPoints = [storeLocation, ...currentRoute.points];
    const lats = allPoints.map(p => p.lat);
    const lngs = allPoints.map(p => p.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  };

  const bounds = getMapBounds();

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Header */}
      <header 
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{
          height: '56px',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/mobile')}
            className="p-1"
          >
            <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <span 
            className="font-bold"
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
            }}
          >
            A区域 朝刊
          </span>
          <button 
            onClick={() => setShowRouteSelector(!showRouteSelector)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary-50)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-primary-600)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            <Route size={16} />
            {currentRoute.type === 'default' ? '標準' : currentRoute.type === 'optimized' ? '最適化' : 'カスタム'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span 
            className="font-bold"
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-primary-500)',
            }}
          >
            {currentPointIndex + 1} / {totalPoints}
          </span>
          <button className="p-1">
            <Volume2 size={24} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button 
            onClick={() => navigate(`/mobile/route/${id}/list`)}
            className="p-1"
          >
            <List size={24} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div 
        className="relative"
        style={{
          height: '4px',
          backgroundColor: 'var(--color-gray-200)',
        }}
      >
        <div 
          className="absolute top-0 left-0 h-full transition-all"
          style={{
            width: `${((currentPointIndex + 1) / totalPoints) * 100}%`,
            backgroundColor: 'var(--color-success-500)',
          }}
        />
      </div>

      {/* Route Selector Modal */}
      {showRouteSelector && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowRouteSelector(false)}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ルート選択
              </h2>
              <button onClick={() => setShowRouteSelector(false)}>
                <XCircle size={24} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleOptimizeRoute}
                disabled={isOptimizing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: isOptimizing ? 'var(--color-gray-200)' : 'var(--color-primary-500)',
                  color: 'white',
                }}
              >
                {isOptimizing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                {isOptimizing ? '最適化中...' : '自動最適化'}
              </button>
              <button
                onClick={() => {
                  setShowRouteSelector(false);
                  setShowRouteBuilder(true);
                  setCustomRoutePoints([...currentRoute.points]);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: 'var(--color-gray-100)',
                  color: 'var(--text-primary)',
                }}
              >
                <Plus size={18} />
                カスタム作成
              </button>
            </div>

            {/* Routes List */}
            <div className="space-y-3">
              {routes.map((route) => {
                const isSelected = route.id === selectedRouteId;
                const completedCount = route.points.filter(p => p.status === 'completed').length;
                const distanceKm = (route.totalDistance / 1000).toFixed(1);
                
                return (
                  <button
                    key={route.id}
                    onClick={() => {
                      setSelectedRouteId(route.id);
                      setShowRouteSelector(false);
                    }}
                    className="w-full p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor: isSelected ? 'var(--color-primary-500)' : 'var(--border-default)',
                      backgroundColor: isSelected ? 'var(--color-primary-50)' : 'white',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {route.type === 'default' && <Route size={20} style={{ color: 'var(--text-secondary)' }} />}
                        {route.type === 'optimized' && <Zap size={20} style={{ color: 'var(--color-warning-500)' }} />}
                        {route.type === 'custom' && <Edit3 size={20} style={{ color: 'var(--color-primary-500)' }} />}
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {route.name}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={20} style={{ color: 'var(--color-success-500)' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {distanceKm}km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {route.totalTime}分
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        {completedCount}/{route.points.length}
                      </span>
                    </div>
                    {route.type === 'optimized' && (
                      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-success-600)' }}>
                        <TrendingDown size={12} />
                        最短距離で最適化済み
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Custom Route Builder Modal */}
      {showRouteBuilder && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowRouteBuilder(false)}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                カスタムルート作成
              </h2>
              <button onClick={() => setShowRouteBuilder(false)}>
                <XCircle size={24} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              ドラッグして配達順序を並べ替えてください
            </p>

            {/* Draggable Points List */}
            <div className="space-y-2 mb-4">
              {customRoutePoints.map((point, index) => (
                <div
                  key={point.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  className="flex items-center gap-3 p-3 bg-white border-2 rounded-lg cursor-move"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <GripVertical size={20} style={{ color: 'var(--text-secondary)' }} />
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: getPointColor(point.status) }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {point.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {point.address}
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {point.distance}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveCustomRoute}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              <Save size={20} />
              カ��タムルートを保存
            </button>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{ backgroundColor: '#E5E3DF' }}
      >
        {/* Mock Map with Points */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines for map look */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#D1D5DB" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Route lines */}
          {currentRoute.points.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = index === 0 ? storeLocation : currentRoute.points[index - 1];
            const x1 = ((prevPoint.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10;
            const y1 = ((bounds.maxLat - prevPoint.lat) / (bounds.maxLat - bounds.minLat)) * 80 + 10;
            const x2 = ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10;
            const y2 = ((bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)) * 80 + 10;
            
            return (
              <line
                key={`line-${point.id}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={point.status === 'completed' ? '#22C55E' : '#3B82F6'}
                strokeWidth="0.5"
                strokeDasharray={point.status === 'pending' ? '2,1' : '0'}
                opacity="0.6"
              />
            );
          })}

          {/* Store marker */}
          <g>
            {(() => {
              const x = ((storeLocation.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10;
              const y = ((bounds.maxLat - storeLocation.lat) / (bounds.maxLat - bounds.minLat)) * 80 + 10;
              return (
                <>
                  <circle cx={x} cy={y} r="2" fill="#EF4444" stroke="white" strokeWidth="0.3" />
                  <circle cx={x} cy={y} r="3" fill="none" stroke="#EF4444" strokeWidth="0.2" opacity="0.4" />
                </>
              );
            })()}
          </g>

          {/* Delivery point markers */}
          {currentRoute.points.map((point, index) => {
            const x = ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10;
            const y = ((bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)) * 80 + 10;
            const color = getPointColor(point.status);
            const isCurrentPoint = index === currentPointIndex;

            return (
              <g key={point.id}>
                {isCurrentPoint && (
                  <circle cx={x} cy={y} r="4" fill="none" stroke={color} strokeWidth="0.3" opacity="0.3">
                    <animate attributeName="r" from="4" to="6" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isCurrentPoint ? "2.5" : "1.5"} 
                  fill={color} 
                  stroke="white" 
                  strokeWidth="0.3"
                />
                <text 
                  x={x} 
                  y={y - 2.5} 
                  fontSize="1.5" 
                  fontWeight="bold" 
                  fill={color}
                  textAnchor="middle"
                >
                  {point.number}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Route Info Card */}
        <div 
          className="absolute top-4 left-4 right-4 rounded-xl p-3 shadow-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentRoute.type === 'optimized' ? (
                <Zap size={16} style={{ color: 'var(--color-warning-500)' }} />
              ) : currentRoute.type === 'custom' ? (
                <Edit3 size={16} style={{ color: 'var(--color-primary-500)' }} />
              ) : (
                <Route size={16} style={{ color: 'var(--text-secondary)' }} />
              )}
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {currentRoute.name}
              </span>
            </div>
            <button
              onClick={() => setShowRouteSelector(true)}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-600)',
              }}
            >
              変更
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {(currentRoute.totalDistance / 1000).toFixed(1)}km
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              約{currentRoute.totalTime}分
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} />
              {currentRoute.points.filter(p => p.status === 'completed').length}/{currentRoute.points.length}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div 
          className="absolute bottom-4 left-4 rounded-lg p-2"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span>配達済み</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
            <span>未配達</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6B7280' }} />
            <span>留守止め</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            <span>新規</span>
          </div>
        </div>

        {/* Current Location Button */}
        <button 
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
        >
          <Navigation size={20} style={{ color: 'var(--color-primary-500)' }} />
        </button>
      </div>

      {/* Bottom Sheet */}
      {currentPoint && (
        <div 
          className="relative bg-white rounded-t-3xl shadow-2xl"
          style={{ height: `${sheetHeight}px` }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-3">
            <div 
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: 'var(--color-gray-300)' }}
            />
          </div>

          <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: `${sheetHeight - 60}px` }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span 
                    className="font-bold"
                    style={{
                      fontSize: 'var(--text-2xl)',
                      color: 'var(--color-primary-500)',
                    }}
                  >
                    #{currentPoint.number}
                  </span>
                  <span 
                    className="font-bold"
                    style={{
                      fontSize: 'var(--text-xl)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {currentPoint.name} 様
                  </span>
                </div>
                <p 
                  className="mb-1"
                  style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-gray-600)',
                  }}
                >
                  {currentPoint.address}
                </p>
                {currentPoint.building && (
                  <p 
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {currentPoint.building}
                  </p>
                )}
              </div>
              <span 
                className="px-2 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-gray-100)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                {currentPoint.distance}
              </span>
            </div>

            {/* Newspaper */}
            <div 
              className="flex items-center gap-2 mb-3"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
              }}
            >
              <span>📰</span>
              <span>{currentPoint.newspaper}</span>
            </div>

            {/* Memo */}
            {currentPoint.memo && (
              <div 
                className="p-3 rounded-lg mb-3"
                style={{
                  backgroundColor: '#FEF3C7',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <div className="flex items-start gap-2">
                  <span>📝</span>
                  <span style={{ color: '#92400E' }}>
                    {currentPoint.memo}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={handleComplete}
              className="w-full rounded-lg font-bold text-white mb-2 flex items-center justify-center gap-2"
              style={{
                height: '56px',
                backgroundColor: 'var(--color-success-500)',
                fontSize: 'var(--text-lg)',
              }}
            >
              <CheckCircle2 size={24} />
              配達完了
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="flex-1 rounded-lg font-medium flex items-center justify-center gap-2"
                style={{
                  height: '44px',
                  backgroundColor: 'var(--color-gray-100)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <SkipForward size={18} />
                スキップ
              </button>
              <button
                className="flex-1 rounded-lg font-medium flex items-center justify-center gap-2"
                style={{
                  height: '44px',
                  backgroundColor: '#FEF2F2',
                  color: 'var(--color-danger-600)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <XCircle size={18} />
                配達できず
              </button>
            </div>

            {/* Swipe Hint */}
            <p 
              className="text-center mt-3"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              ← スキップ | 完了 →
            </p>
          </div>
        </div>
      )}
    </div>
  );
}