import { FileDown, FileSpreadsheet, TrendingUp, BarChart, Filter, Calendar, Download, Printer, RefreshCw, AlertCircle, CheckCircle2, Clock, TrendingDown, Users, Package, AlertTriangle, PieChart as PieChartIcon, ChevronDown, X } from 'lucide-react';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Area, AreaChart, ComposedChart } from 'recharts';
import { useState } from 'react';

// Extended data with weekly and monthly views
const dailyData = [
  { date: '3/27', completed: 2580, target: 2600, suspended: 45, failed: 12, onTime: 2450, delayed: 130 },
  { date: '3/28', completed: 2592, target: 2600, suspended: 48, failed: 10, onTime: 2480, delayed: 112 },
  { date: '3/29', completed: 2605, target: 2600, suspended: 42, failed: 8, onTime: 2500, delayed: 105 },
  { date: '3/30', completed: 2598, target: 2600, suspended: 50, failed: 15, onTime: 2470, delayed: 128 },
  { date: '3/31', completed: 2610, target: 2600, suspended: 38, failed: 9, onTime: 2520, delayed: 90 },
  { date: '4/1', completed: 2620, target: 2600, suspended: 40, failed: 7, onTime: 2540, delayed: 80 },
  { date: '4/2', completed: 2645, target: 2600, suspended: 35, failed: 5, onTime: 2580, delayed: 65 },
];

const weeklyData = [
  { week: '第1週', completed: 18200, target: 18200, suspended: 280, failed: 85 },
  { week: '第2週', completed: 18450, target: 18200, suspended: 245, failed: 72 },
  { week: '第3週', completed: 18380, target: 18200, suspended: 265, failed: 68 },
  { week: '第4週', completed: 18520, target: 18200, suspended: 230, failed: 55 },
];

const monthlyData = [
  { month: '12月', completed: 78500, target: 78000, suspended: 1100, failed: 320 },
  { month: '1月', completed: 79200, target: 78000, suspended: 1050, failed: 285 },
  { month: '2月', completed: 71500, target: 70000, suspended: 980, failed: 298 },
  { month: '3月', completed: 80100, target: 78000, suspended: 1020, failed: 280 },
];

const delivererPerformance = [
  { name: '佐藤太郎', rate: 99.2, completed: 645, total: 650, avgTime: 3.2, onTimeRate: 97.5 },
  { name: '田中花子', rate: 97.8, completed: 587, total: 600, avgTime: 3.8, onTimeRate: 95.2 },
  { name: '李 明', rate: 96.5, completed: 540, total: 560, avgTime: 4.1, onTimeRate: 93.8 },
  { name: 'グエン', rate: 95.0, completed: 475, total: 500, avgTime: 4.5, onTimeRate: 91.5 },
  { name: '山田', rate: 98.5, completed: 393, total: 399, avgTime: 3.5, onTimeRate: 96.8 },
];

const areaReport = [
  {
    area: 'A区域',
    subscribers: 420,
    completed: 415,
    suspended: 3,
    failed: 2,
    rate: 98.8,
    avgTime: '78分',
    distance: '12.1km',
    issues: 1,
  },
  {
    area: 'B区域',
    subscribers: 380,
    completed: 372,
    suspended: 5,
    failed: 3,
    rate: 97.9,
    avgTime: '85分',
    distance: '14.3km',
    issues: 2,
  },
  {
    area: 'C区域',
    subscribers: 350,
    completed: 345,
    suspended: 3,
    failed: 2,
    rate: 98.6,
    avgTime: '72分',
    distance: '10.8km',
    issues: 0,
  },
  {
    area: 'D区域',
    subscribers: 290,
    completed: 285,
    suspended: 4,
    failed: 1,
    rate: 98.3,
    avgTime: '65分',
    distance: '9.2km',
    issues: 1,
  },
  {
    area: 'E区域',
    subscribers: 180,
    completed: 178,
    suspended: 2,
    failed: 0,
    rate: 98.9,
    avgTime: '52分',
    distance: '7.4km',
    issues: 0,
  },
];

// Distribution data for Pie Chart
const newspaperDistribution = [
  { name: '朝刊のみ', value: 820, color: '#3B82F6' },
  { name: '夕刊のみ', value: 340, color: '#F59E0B' },
  { name: '朝夕刊セット', value: 460, color: '#10B981' },
];

const issueReport = [
  { id: 1, date: '2026-04-02', area: 'B区域', deliverer: '田中花子', type: '配達遅延', address: '○○町3-5', status: '解決済み', priority: 'low' },
  { id: 2, date: '2026-04-02', area: 'A区域', deliverer: '佐藤太郎', type: 'ポスト満杯', address: '○○町1-8', status: '対応中', priority: 'medium' },
  { id: 3, date: '2026-04-01', area: 'D区域', deliverer: 'グエン', type: '配達不可', address: '○○町2-3', status: '解決済み', priority: 'high' },
  { id: 4, date: '2026-04-01', area: 'B区域', deliverer: '田中花子', type: '誤配', address: '○○町4-2', status: '対応中', priority: 'high' },
];

const timeSlotPerformance = [
  { time: '3:00-4:00', deliveries: 420, rate: 98.5 },
  { time: '4:00-5:00', deliveries: 890, rate: 97.8 },
  { time: '5:00-6:00', deliveries: 785, rate: 96.2 },
  { time: '6:00-7:00', deliveries: 550, rate: 99.1 },
];

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState('2026-03-27');
  const [endDate, setEndDate] = useState('2026-04-02');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedDeliverer, setSelectedDeliverer] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Get data based on selected period
  const getChartData = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return weeklyData;
      case 'monthly':
        return monthlyData;
      default:
        return dailyData;
    }
  };

  const chartData = getChartData();
  const xAxisKey = selectedPeriod === 'daily' ? 'date' : selectedPeriod === 'weekly' ? 'week' : 'month';

  // Export handlers
  const handleExportPDF = () => {
    console.log('Exporting PDF report...');
    alert('PDF レポートをダウンロード中...');
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV report...');
    alert('CSV レポートをダウンロード中...');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter data
  const filteredAreaReport = areaReport.filter(area => {
    if (selectedArea !== 'all' && area.area !== selectedArea) return false;
    return true;
  });

  const filteredDelivererPerformance = delivererPerformance.filter(deliverer => {
    if (selectedDeliverer !== 'all' && deliverer.name !== selectedDeliverer) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BarChart size={28} className="text-[var(--color-primary-500)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">レポート</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Toggle */}
          <div className="flex gap-1 bg-[var(--color-gray-100)] rounded-lg p-1">
            <button 
              onClick={() => setSelectedPeriod('daily')}
              className={`px-3 py-2 text-sm font-medium rounded transition-all ${
                selectedPeriod === 'daily'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              日次
            </button>
            <button 
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-3 py-2 text-sm font-medium rounded transition-all ${
                selectedPeriod === 'weekly'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              週次
            </button>
            <button 
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-2 text-sm font-medium rounded transition-all ${
                selectedPeriod === 'monthly'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              月次
            </button>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 border border-[var(--border-default)] rounded-lg px-3 py-2 bg-white">
            <Calendar size={16} className="text-[var(--text-secondary)]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm focus:outline-none"
            />
            <span className="text-[var(--text-secondary)]">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm focus:outline-none"
            />
          </div>

          {/* Filter Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters
                ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                : 'text-[var(--text-secondary)] bg-white border-[var(--border-default)] hover:bg-[var(--color-gray-50)]'
            }`}
          >
            <Filter size={16} />
            フィルター
          </button>

          {/* Export Buttons */}
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
          >
            <FileDown size={16} />
            PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            CSV
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
          >
            <Printer size={16} />
            印刷
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">フィルター</h3>
            <button 
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-[var(--color-gray-100)] rounded"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">区域</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全区域</option>
                <option value="A区域">A区域</option>
                <option value="B区域">B区域</option>
                <option value="C区域">C区域</option>
                <option value="D区域">D区域</option>
                <option value="E区域">E区域</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">配達員</label>
              <select
                value={selectedDeliverer}
                onChange={(e) => setSelectedDeliverer(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全配達員</option>
                {delivererPerformance.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">種類</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全て</option>
                <option value="morning">朝刊</option>
                <option value="evening">夕刊</option>
                <option value="both">朝夕刊セット</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">配達完了率</div>
            <CheckCircle2 size={20} className="text-[var(--color-success-500)]" />
          </div>
          <div className="text-3xl font-bold text-[var(--color-success-500)] mb-1">98.2%</div>
          <div className="flex items-center gap-1 text-xs text-[var(--color-success-600)]">
            <TrendingUp size={12} />
            前週比+0.5%
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">平均配達時間</div>
            <Clock size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">74分</div>
          <div className="flex items-center gap-1 text-xs text-[var(--color-success-600)]">
            <TrendingDown size={12} />
            前週比-3分
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">留守止め件数</div>
            <Package size={20} className="text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">45</div>
          <div className="text-xs text-[var(--text-muted)]">前週比+8</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">新規挿入</div>
            <Users size={20} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">12</div>
          <div className="text-xs text-[var(--text-muted)]">前週比+3</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">問題・トラブル</div>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">4</div>
          <div className="text-xs text-[var(--text-muted)]">対応中: 2件</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Trend - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">配達件数推移</h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSuspended" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey={xAxisKey} stroke="#64748B" style={{ fontSize: 12 }} />
              <YAxis stroke="#64748B" style={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#22C55E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="配達完了"
              />
              <Area
                type="monotone"
                dataKey="suspended"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSuspended)"
                name="留守止め"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="目標"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Newspaper Distribution Pie Chart - 1/3 width */}
        <div className="bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">購読種別分布</h2>
          <ResponsiveContainer width="100%" height={320}>
            <RechartsPie>
              <Pie
                data={newspaperDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {newspaperDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {newspaperDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{item.value}件</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Slot Performance & Deliverer Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Slot Performance */}
        <div className="bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">時間帯別パフォーマンス</h2>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={timeSlotPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="time" stroke="#64748B" style={{ fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="#64748B" style={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748B" style={{ fontSize: 12 }} domain={[90, 100]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="deliveries" fill="#3B82F6" name="配達件数" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} name="完了率 (%)" dot={{ fill: '#22C55E', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Deliverer Performance Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">配達員別パフォーマンス</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsBarChart data={filteredDelivererPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" domain={[90, 100]} stroke="#64748B" style={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" stroke="#64748B" style={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="rate" fill="#3B82F6" radius={[0, 4, 4, 0]} name="完了率 (%)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Deliverer Performance Table */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">配達員詳細レポート</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">配達員</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">配達完了</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">総配達数</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">完了率</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">平均時間/件</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">定時配達率</th>
              </tr>
            </thead>
            <tbody>
              {filteredDelivererPerformance.map((deliverer, index) => (
                <tr
                  key={deliverer.name}
                  className={`border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors ${
                    index % 2 === 0 ? '' : 'bg-[var(--color-gray-50)]/30'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{deliverer.name}</td>
                  <td className="px-6 py-4 text-center text-[var(--color-success-600)] font-medium">{deliverer.completed}</td>
                  <td className="px-6 py-4 text-center text-[var(--text-primary)]">{deliverer.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      deliverer.rate >= 98 ? 'bg-green-100 text-green-700' :
                      deliverer.rate >= 95 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {deliverer.rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{deliverer.avgTime}分</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium text-[var(--text-primary)]">{deliverer.onTimeRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Area Report Table */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">区域別レポート</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">区域</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">購読者数</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">配達完了</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">留守</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">失敗</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">完了率</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">平均時間</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">距離</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">問題</th>
              </tr>
            </thead>
            <tbody>
              {filteredAreaReport.map((area, index) => (
                <tr
                  key={area.area}
                  className={`border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors ${
                    index % 2 === 0 ? '' : 'bg-[var(--color-gray-50)]/30'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{area.area}</td>
                  <td className="px-6 py-4 text-center text-[var(--text-primary)]">{area.subscribers}</td>
                  <td className="px-6 py-4 text-center font-medium text-[var(--color-success-600)]">{area.completed}</td>
                  <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{area.suspended}</td>
                  <td className="px-6 py-4 text-center text-[var(--color-danger-600)]">{area.failed}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-[var(--color-success-600)]">{area.rate}%</span>
                  </td>
                  <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{area.avgTime}</td>
                  <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{area.distance}</td>
                  <td className="px-6 py-4 text-center">
                    {area.issues > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {area.issues}件
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue/Problem Report */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">問題・トラブルレポート</h2>
          <span className="text-sm text-[var(--text-secondary)]">過去7日間</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">日付</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">区域</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">配達員</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">問題種別</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">住所</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">優先度</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {issueReport.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{issue.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{issue.area}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{issue.deliverer}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-primary)]">{issue.type}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{issue.address}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      issue.priority === 'high' ? 'bg-red-100 text-red-700' :
                      issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {issue.priority === 'high' ? '高' : issue.priority === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === '解決済み' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}