import { useState, useEffect } from 'react';
import { CheckCircle, Users, Clock, UserX, AlertTriangle, TrendingUp, Circle, Cloud, CloudRain, CloudSnow, Sun, Wind, RefreshCw, Download, Calendar, Activity, PhoneCall, Shield, Server, Database, Wifi, MapPin, Award, FileText, BarChart3, TrendingDown, Zap, Bell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const kpiCards = [
  {
    label: '配達完了',
    value: '1,245',
    trend: '+48.2%',
    trendUp: true,
    icon: CheckCircle,
    bgColor: '#DCFCE7',
    iconColor: '#22C55E',
  },
  {
    label: '配達中',
    value: '523',
    trend: '',
    trendUp: true,
    icon: Users,
    bgColor: '#EDE9FE',
    iconColor: '#8B5CF6',
  },
  {
    label: '未開始',
    value: '832',
    trend: '',
    trendUp: true,
    icon: Clock,
    bgColor: '#FEF3C7',
    iconColor: '#F59E0B',
  },
  {
    label: '留守止め',
    value: '45',
    trend: '',
    trendUp: false,
    icon: UserX,
    bgColor: '#F1F5F9',
    iconColor: '#9CA3AF',
  },
];

const areaProgress = [
  { name: 'A区域', progress: 78, color: '#22C55E', deliverer: '佐藤', status: 'active' },
  { name: 'B区域', progress: 65, color: '#3B82F6', deliverer: '田中', status: 'active' },
  { name: 'C区域', progress: 52, color: '#3B82F6', deliverer: '李', status: 'active' },
  { name: 'D区域', progress: 0, color: '#E2E8F0', deliverer: 'グエン', status: 'not-started' },
];

const todayChanges = [
  { type: 'new', label: '新規挿入', count: 3, color: '#F59E0B', icon: 'circle' },
  { type: 'suspend', label: '新規留守止め', count: 5, color: '#EF4444', icon: 'circle' },
  { type: 'resume', label: '留守止め解除', count: 2, color: '#22C55E', icon: 'circle' },
];

const alerts = [
  { level: 'danger', message: 'D区域 配達未開始（6:30超過）' },
  { level: 'warning', message: 'B区域 田中さん 配達遅延（+20分）' },
];

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for charts
  const hourlyPerformance = [
    { hour: '5:00', completed: 45, target: 50 },
    { hour: '5:30', completed: 120, target: 100 },
    { hour: '6:00', completed: 280, target: 250 },
    { hour: '6:30', completed: 450, target: 400 },
    { hour: '7:00', completed: 620, target: 550 },
    { hour: '7:30', completed: 850, target: 750 },
    { hour: '8:00', completed: 1100, target: 1000 },
    { hour: '現在', completed: 1245, target: 1200 },
  ];

  const delivererStatus = [
    { name: '佐藤', area: 'A区域', status: 'active', completed: 145, total: 185, avatar: '👨', lastUpdate: '2分前', speed: '5.2分/件' },
    { name: '田中', area: 'B区域', status: 'active', completed: 98, total: 150, avatar: '👨', lastUpdate: '1分前', speed: '6.8分/件' },
    { name: '李', area: 'C区域', status: 'active', completed: 78, total: 150, avatar: '👨', lastUpdate: '30秒前', speed: '7.1分/件' },
    { name: 'グエン', area: 'D区域', status: 'break', completed: 0, total: 140, avatar: '👨', lastUpdate: '45分前', speed: '-' },
    { name: '山田', area: 'E区域', status: 'active', completed: 135, total: 160, avatar: '👨', lastUpdate: '3分前', speed: '5.8分/件' },
  ];

  const recentActivities = [
    { time: '8:23', type: 'complete', message: 'A区域 佐藤さん 配達完了 (#145/185)', color: 'var(--color-success-500)' },
    { time: '8:21', type: 'issue', message: 'B区域 田中さん 問題報告: 不在', color: 'var(--color-warning-500)' },
    { time: '8:18', type: 'complete', message: 'C区域 李さん 配達完了 (#78/150)', color: 'var(--color-success-500)' },
    { time: '8:15', type: 'break', message: 'D区域 グエンさん 休憩開始', color: 'var(--color-gray-400)' },
    { time: '8:12', type: 'complete', message: 'E区域 山田さん 配達完了 (#135/160)', color: 'var(--color-success-500)' },
    { time: '8:08', type: 'sos', message: 'B区域 田中さん SOSボタン押下 → 解決済み', color: 'var(--color-danger-500)' },
  ];

  const issueReports = [
    { id: 1, area: 'B区域', deliverer: '田中', issue: '不在（ポスト満杯）', time: '8:21', status: 'pending' },
    { id: 2, area: 'A区域', deliverer: '佐藤', issue: '住所不明', time: '7:45', status: 'resolved' },
    { id: 3, area: 'C区域', deliverer: '李', issue: '犬注意', time: '7:12', status: 'pending' },
  ];

  const comparisonData = [
    { label: '今日', value: 48.2, color: '#22C55E' },
    { label: '昨日', value: 45.1, color: '#94A3B8' },
    { label: '先週', value: 42.8, color: '#CBD5E1' },
  ];

  const systemHealth = [
    { name: 'API Server', status: 'healthy', uptime: '99.9%', icon: Server },
    { name: 'Database', status: 'healthy', uptime: '99.8%', icon: Database },
    { name: 'GPS Tracking', status: 'healthy', uptime: '100%', icon: MapPin },
    { name: 'Network', status: 'warning', uptime: '98.2%', icon: Wifi },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    console.log('Exporting dashboard report...');
    // TODO: Implement export functionality
  };

  const weatherIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 18) return <Sun size={24} className="text-yellow-500" />;
    return <Cloud size={24} className="text-gray-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar - Time, Weather, Quick Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Time & Date */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-gray-50)] rounded-lg">
              {weatherIcon()}
              <div>
                <div className="text-lg font-bold text-[var(--text-primary)]">15°C</div>
                <div className="text-xs text-[var(--text-secondary)]">晴れ</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => console.log('Change date')}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors"
            >
              <Calendar size={18} className="text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-primary)]">日付変更</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="text-sm">更新</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors"
            >
              <Download size={18} className="text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-primary)]">エクスポート</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-[var(--border-default)] hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon size={24} style={{ color: card.iconColor }} />
                </div>
                {card.trend && (
                  <div className="flex items-center gap-1 text-xs font-medium text-[var(--color-success-500)]">
                    <TrendingUp size={14} />
                    {card.trend}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                {card.value}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Chart + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Hourly Performance Chart - 75% */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">時間別パフォーマンス</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-primary-500)]"></div>
                  <span className="text-[var(--text-secondary)]">完了数</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-gray-300)]"></div>
                  <span className="text-[var(--text-secondary)]">目標</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hourlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#E5E7EB"
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  stroke="#E5E7EB"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="var(--color-primary-500)" 
                  strokeWidth={3}
                  dot={{ fill: 'var(--color-primary-500)', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#D1D5DB" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#D1D5DB', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison - 25% */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
            完了率比較
          </h2>
          <div className="space-y-4">
            {comparisonData.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-[var(--text-primary)]">{item.value}%</span>
                    {index === 0 && <TrendingUp size={16} className="text-[var(--color-success-500)]" />}
                  </div>
                </div>
                <div className="h-2 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
              <Zap size={16} />
              <span>目標達成!</span>
            </div>
            <p className="text-xs text-green-600">今日の配達は昨日より3.1%向上しています</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Progress - 60% */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">区域別進捗</h2>
              <span className="text-sm text-[var(--text-secondary)]">
                {currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </span>
            </div>

            <div className="space-y-4">
              {areaProgress.map((area) => (
                <div key={area.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)] w-16">
                        {area.name}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {area.deliverer}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {area.progress}%
                      </span>
                      {area.status === 'not-started' && (
                        <span className="px-2 py-1 text-xs font-medium text-[var(--color-danger-500)] bg-[#FEE2E2] rounded">
                          未開始
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${area.progress}%`,
                        backgroundColor: area.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverer Status Cards */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">配達員ステータス</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {delivererStatus.map((deliverer) => (
                <div 
                  key={deliverer.name}
                  className="p-4 border border-[var(--border-default)] rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{deliverer.avatar}</div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{deliverer.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{deliverer.area}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          deliverer.status === 'active' ? 'bg-green-500' : 
                          deliverer.status === 'break' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">
                        {deliverer.status === 'active' ? '配達中' : 
                         deliverer.status === 'break' ? '休憩中' : 'オフライン'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">進捗</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {deliverer.completed}/{deliverer.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary-500)] rounded-full transition-all"
                        style={{ width: `${(deliverer.completed / deliverer.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">速度: {deliverer.speed}</span>
                      <span className="text-[var(--text-secondary)]">{deliverer.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="space-y-6">
          {/* Today's Changes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              今日の変更
            </h2>
            <div className="space-y-3">
              {todayChanges.map((change) => (
                <div
                  key={change.type}
                  className="flex items-center justify-between p-3 bg-[var(--color-gray-50)] rounded-lg hover:bg-[var(--color-gray-100)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Circle
                      size={8}
                      fill={change.color}
                      color={change.color}
                    />
                    <span className="text-sm text-[var(--text-primary)]">
                      {change.label}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {change.count}件
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-[var(--color-warning-500)]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">アラート</h2>
              <span className="ml-auto w-6 h-6 bg-[var(--color-danger-500)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {alerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
                  <Circle
                    size={8}
                    fill={alert.level === 'danger' ? 'var(--color-danger-500)' : 'var(--color-warning-500)'}
                    color={alert.level === 'danger' ? 'var(--color-danger-500)' : 'var(--color-warning-500)'}
                    className="mt-2"
                  />
                  <p className="text-sm text-[var(--text-primary)] flex-1">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">最近のアクティビティ</h2>
              <Activity size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-[var(--border-default)] last:border-0">
                  <div className="text-xs text-[var(--text-secondary)] font-medium w-12 pt-1">
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <div 
                        className="w-2 h-2 rounded-full mt-1.5"
                        style={{ backgroundColor: activity.color }}
                      />
                      <p className="text-sm text-[var(--text-primary)]">{activity.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issue Reports */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">問題報告</h2>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                {issueReports.filter(r => r.status === 'pending').length} 未解決
              </span>
            </div>
            <div className="space-y-3">
              {issueReports.map((report) => (
                <div 
                  key={report.id}
                  className="p-3 border border-[var(--border-default)] rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {report.area}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {report.deliverer}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{report.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text-primary)]">{report.issue}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      report.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {report.status === 'pending' ? '未解決' : '解決済み'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-[var(--color-success-500)]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">システム状態</h2>
            </div>
            <div className="space-y-3">
              {systemHealth.map((system) => {
                const Icon = system.icon;
                return (
                  <div 
                    key={system.name}
                    className="flex items-center justify-between p-3 bg-[var(--color-gray-50)] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        system.status === 'healthy' ? 'bg-green-100' : 
                        system.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Icon size={16} className={
                          system.status === 'healthy' ? 'text-green-600' : 
                          system.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        } />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {system.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          稼働率: {system.uptime}
                        </div>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      system.status === 'healthy' ? 'bg-green-500' : 
                      system.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}