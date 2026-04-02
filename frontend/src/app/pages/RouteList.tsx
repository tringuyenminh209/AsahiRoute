import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Map, Search, Circle, CircleCheck, Star, CircleSlash, ArrowRight, Navigation, ChevronDown, X, Flag, AlertCircle, Clock, TrendingUp, WifiOff, SkipForward, MessageSquare } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import PullToRefresh from "react-pull-to-refresh";

export function RouteList() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<"order" | "distance" | "time">("order");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [swipedItemId, setSwipedItemId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pull to refresh handler
  const handleRefresh = () => {
    return new Promise<void>((resolve) => {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        resolve();
      }, 1500);
    });
  };

  const filters = [
    { id: "all", label: "全て", count: 148 },
    { id: "pending", label: "未配達", count: 100 },
    { id: "suspended", label: "留守止め", count: 3 },
    { id: "new", label: "新規", count: 1 },
    { id: "completed", label: "完了", count: 45 },
  ];

  const deliveryPoints = [
    { 
      id: 1, 
      number: 1, 
      name: "山本様", 
      address: "○○町1-1-1", 
      status: "completed", 
      time: "5:23",
      icon: CircleCheck,
      iconColor: 'var(--color-success-500)',
      bgColor: '#F0FDF4',
      distance: 0,
      estimatedTime: 0,
    },
    { 
      id: 2, 
      number: 2, 
      name: "伊藤様", 
      address: "○○町1-1-2", 
      status: "completed", 
      time: "5:28",
      icon: CircleCheck,
      iconColor: 'var(--color-success-500)',
      bgColor: '#F0FDF4',
      distance: 0,
      estimatedTime: 0,
    },
    { 
      id: 3, 
      number: 3, 
      name: "田中様", 
      address: "○○町1-2-3", 
      status: "current",
      icon: ArrowRight,
      iconColor: 'var(--color-primary-500)',
      bgColor: 'var(--color-primary-50)',
      borderLeft: true,
      distance: 0,
      estimatedTime: 0,
    },
    { 
      id: 4, 
      number: 4, 
      name: "佐藤様", 
      address: "○○町1-2-4", 
      status: "new",
      badge: "NEW",
      icon: Star,
      iconColor: 'var(--color-warning-500)',
      bgColor: '#FFFBEB',
      borderLeft: true,
      borderColor: 'var(--color-warning-500)',
      distance: 120,
      estimatedTime: 2,
    },
    { 
      id: 5, 
      number: 5, 
      name: "鈴木様", 
      address: "○○町1-2-5", 
      status: "suspended",
      info: "留守 4/1-4/10",
      icon: CircleSlash,
      iconColor: 'var(--color-gray-400)',
      bgColor: 'var(--color-gray-50)',
      distance: 250,
      estimatedTime: 4,
    },
    { 
      id: 6, 
      number: 6, 
      name: "高橋様", 
      address: "○○町1-3-1", 
      status: "pending",
      icon: Circle,
      iconColor: 'var(--color-gray-300)',
      bgColor: 'white',
      distance: 180,
      estimatedTime: 3,
    },
    { 
      id: 7, 
      number: 7, 
      name: "中村様", 
      address: "○○町1-3-2", 
      status: "pending",
      icon: Circle,
      iconColor: 'var(--color-gray-300)',
      bgColor: 'white',
      distance: 340,
      estimatedTime: 5,
    },
    { 
      id: 8, 
      number: 8, 
      name: "小林様", 
      address: "○○町1-3-3", 
      status: "pending",
      icon: Circle,
      iconColor: 'var(--color-gray-300)',
      bgColor: 'white',
      distance: 420,
      estimatedTime: 6,
    },
  ];

  // Calculate statistics
  const totalCompleted = deliveryPoints.filter(p => p.status === 'completed').length;
  const avgTimePerPoint = totalCompleted > 0 ? 5 : 0; // 5 minutes average
  const remainingPoints = deliveryPoints.filter(p => p.status !== 'completed').length;
  const estimatedCompletionTime = remainingPoints * avgTimePerPoint;

  const completedCount = totalCompleted;
  const totalCount = deliveryPoints.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get next point
  const nextPoint = deliveryPoints.find(p => p.status !== 'completed' && p.status !== 'suspended');

  // Filter and search logic
  let filteredPoints = deliveryPoints;
  
  if (selectedFilter !== "all") {
    filteredPoints = filteredPoints.filter(point => {
      if (selectedFilter === "pending") return point.status === "pending" || point.status === "current";
      if (selectedFilter === "suspended") return point.status === "suspended";
      if (selectedFilter === "new") return point.status === "new";
      if (selectedFilter === "completed") return point.status === "completed";
      return true;
    });
  }

  if (searchQuery) {
    filteredPoints = filteredPoints.filter(point => 
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.number.toString().includes(searchQuery)
    );
  }

  // Sort logic
  if (sortBy === "distance") {
    filteredPoints = [...filteredPoints].sort((a, b) => a.distance - b.distance);
  } else if (sortBy === "time") {
    filteredPoints = [...filteredPoints].sort((a, b) => a.estimatedTime - b.estimatedTime);
  }

  const handleSkip = (pointId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Skip point:", pointId);
    setSwipedItemId(null);
    // TODO: Implement skip logic
  };

  const handleReportIssue = (pointId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Report issue:", pointId);
    setSwipedItemId(null);
    // TODO: Implement report issue logic
  };

  return (
    <PullToRefresh 
      onRefresh={handleRefresh}
      resistance={3}
      style={{ 
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div 
        className="h-screen flex flex-col"
        style={{ backgroundColor: 'var(--surface-page)' }}
      >
        {/* Header */}
        <header 
          className="flex items-center justify-between px-4 bg-white border-b relative"
          style={{
            height: '48px',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/mobile')}>
              <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
            </button>
            <span 
              className="font-semibold"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
              }}
            >
              A区域 朝刊
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
          <div 
            className="px-4 py-3 bg-white border-b"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ 
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--color-gray-50)',
                }}
              >
                <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="名前、住所、番号で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div 
          className="px-4 py-3 grid grid-cols-3 gap-2"
          style={{ backgroundColor: 'var(--color-gray-50)' }}
        >
          <div className="flex flex-col items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock size={14} style={{ color: 'var(--color-primary-500)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                平均時間
              </span>
            </div>
            <span 
              className="font-semibold"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
            >
              {avgTimePerPoint}分/件
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={14} style={{ color: 'var(--color-success-500)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                完了予測
              </span>
            </div>
            <span 
              className="font-semibold"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
            >
              {estimatedCompletionTime}分
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Flag size={14} style={{ color: 'var(--color-warning-500)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                残り
              </span>
            </div>
            <span 
              className="font-semibold"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
            >
              {remainingPoints}件
            </span>
          </div>
        </div>

        {/* Progress */}
        <div 
          className="px-4 py-3"
          style={{ backgroundColor: 'var(--color-gray-50)' }}
        >
          <div 
            className="relative rounded-full overflow-hidden mb-2"
            style={{
              height: '8px',
              backgroundColor: 'var(--color-gray-200)',
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--color-success-500)',
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span 
              className="font-semibold"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            >
              {completedCount} / {totalCount} 完了
            </span>
            <span 
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Sort & Filters */}
        <div 
          className="bg-white border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {/* Sort button */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--color-gray-50)',
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  並び替え: {sortBy === 'order' ? '順番' : sortBy === 'distance' ? '距離' : '時間'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
              
              {/* Sort dropdown */}
              {showSortMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white rounded-lg border shadow-lg z-10"
                  style={{ 
                    borderColor: 'var(--border-default)',
                    minWidth: '160px',
                  }}
                >
                  <button
                    onClick={() => {
                      setSortBy('order');
                      setShowSortMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: sortBy === 'order' ? 'var(--color-primary-500)' : 'var(--text-primary)',
                      fontWeight: sortBy === 'order' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    }}
                  >
                    順番順
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('distance');
                      setShowSortMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: sortBy === 'distance' ? 'var(--color-primary-500)' : 'var(--text-primary)',
                      fontWeight: sortBy === 'distance' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    }}
                  >
                    距離が近い順
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('time');
                      setShowSortMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: sortBy === 'time' ? 'var(--color-primary-500)' : 'var(--text-primary)',
                      fontWeight: sortBy === 'time' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    }}
                  >
                    時間が早い順
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-2 overflow-x-auto">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className="px-4 py-2 rounded-full whitespace-nowrap transition-all"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: selectedFilter === filter.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    backgroundColor: selectedFilter === filter.id 
                      ? 'var(--color-primary-800)' 
                      : 'var(--color-gray-100)',
                    color: selectedFilter === filter.id 
                      ? 'white' 
                      : 'var(--text-secondary)',
                  }}
                >
                  {filter.label}({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPoints.map((point) => {
            const Icon = point.icon;
            
            const swipeHandlers = useSwipeable({
              onSwipedLeft: () => {
                if (point.status !== 'completed') {
                  setSwipedItemId(point.id);
                }
              },
              onSwipedRight: () => setSwipedItemId(null),
              trackMouse: true,
            });

            const isSwiped = swipedItemId === point.id;

            return (
              <div key={point.id} className="relative" {...swipeHandlers}>
                {/* Swipe actions background */}
                {isSwiped && (
                  <div 
                    className="absolute inset-0 flex items-center justify-end gap-2 px-4"
                    style={{ backgroundColor: 'var(--color-gray-100)' }}
                  >
                    <button
                      onClick={(e) => handleReportIssue(point.id, e)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-warning-500)',
                        color: 'white',
                      }}
                    >
                      <AlertCircle size={16} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>問題報告</span>
                    </button>
                    <button
                      onClick={(e) => handleSkip(point.id, e)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-gray-600)',
                        color: 'white',
                      }}
                    >
                      <SkipForward size={16} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>スキップ</span>
                    </button>
                  </div>
                )}

                {/* List item */}
                <div
                  onClick={() => navigate(`/mobile/route/${id}/point/${point.id}`)}
                  className="flex items-center gap-3 px-4 border-b cursor-pointer relative transition-transform"
                  style={{
                    height: '72px',
                    borderColor: 'var(--color-gray-100)',
                    backgroundColor: point.bgColor,
                    borderLeft: point.borderLeft ? `3px solid ${point.borderColor || 'var(--color-primary-500)'}` : 'none',
                    transform: isSwiped ? 'translateX(-160px)' : 'translateX(0)',
                  }}
                >
                  {/* Icon */}
                  <Icon 
                    size={24} 
                    style={{ 
                      color: point.iconColor,
                      strokeWidth: point.status === 'current' ? 2.5 : 2,
                    }} 
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: point.status === 'current' ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
                          color: point.status === 'completed' || point.status === 'suspended' 
                            ? 'var(--text-muted)' 
                            : 'var(--text-primary)',
                        }}
                      >
                        #{point.number} {point.name}
                      </span>
                      {point.badge && (
                        <span 
                          className="px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-weight-bold)',
                          }}
                        >
                          {point.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {point.address}
                      </span>
                      {point.info && (
                        <span 
                          className="px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-gray-100)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {point.info}
                        </span>
                      )}
                      {point.distance > 0 && (
                        <span 
                          className="flex items-center gap-1"
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-primary-500)',
                          }}
                        >
                          📍{point.distance}m · {point.estimatedTime}分
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time/Status */}
                  {point.time && (
                    <span 
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-success-500)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      ✓{point.time}
                    </span>
                  )}
                  {point.status === 'current' && (
                    <ArrowRight 
                      size={20} 
                      style={{ color: 'var(--color-primary-500)' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB - Next Point */}
        {nextPoint && (
          <button
            onClick={() => navigate(`/mobile/route/${id}/point/${nextPoint.id}`)}
            className="fixed shadow-lg flex items-center gap-3 px-6 py-4 rounded-full transition-all active:scale-95"
            style={{
              bottom: '24px',
              right: '16px',
              left: '16px',
              backgroundColor: 'var(--color-primary-500)',
              color: 'white',
              zIndex: 50,
            }}
          >
            <Navigation size={24} fill="white" />
            <div className="flex-1 text-left">
              <div style={{ fontSize: 'var(--text-xs)', opacity: 0.9 }}>
                次の配達先
              </div>
              <div 
                className="font-semibold"
                style={{ fontSize: 'var(--text-base)' }}
              >
                #{nextPoint.number} {nextPoint.name}
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontSize: 'var(--text-xs)', opacity: 0.9 }}>
                {nextPoint.distance}m
              </div>
              <div 
                className="font-semibold"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {nextPoint.estimatedTime}分
              </div>
            </div>
          </button>
        )}
      </div>
    </PullToRefresh>
  );
}