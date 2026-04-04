import { FileDown, FileSpreadsheet, TrendingUp, BarChart, Filter, Calendar, Printer, CheckCircle2, Clock, TrendingDown, Users, Package, AlertTriangle, ChevronDown, X, Loader2 } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Line } from 'recharts';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/admin.service';


export function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedDeliverer, setSelectedDeliverer] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // ── API queries ──────────────────────────────────────────────────────────
  const { data: weeklyApiData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['reports-weekly'],
    queryFn: () => reportService.getWeekly(),
    enabled: selectedPeriod === 'weekly',
  });

  const { data: monthlyApiData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports-monthly'],
    queryFn: () => reportService.getMonthly(),
    enabled: selectedPeriod === 'monthly',
  });

  const { data: dailyApiData, isLoading: dailyLoading } = useQuery({
    queryKey: ['reports-daily', startDate],
    queryFn: () => reportService.getDaily(startDate),
    enabled: selectedPeriod === 'daily',
  });

  const { data: areaStatsData, isLoading: areaLoading } = useQuery({
    queryKey: ['reports-area-stats', startDate, endDate],
    queryFn: () => reportService.getAreaStats(startDate, endDate),
  });

  const { data: userPerfData, isLoading: userLoading } = useQuery({
    queryKey: ['reports-user-perf', startDate, endDate],
    queryFn: () => reportService.getUserPerformance(startDate, endDate),
  });

  const isChartLoading = weeklyLoading || monthlyLoading || dailyLoading;

  // ── Map API data to chart format ─────────────────────────────────────────
  const chartData = useMemo(() => {
    const mapRow = (row: any) => ({
      date: row.date?.slice(5).replace('-', '/') ?? row.date,
      completed: Number(row.delivered ?? 0),
      target: Number(row.total ?? 0),
      suspended: 0,
      failed: 0,
    });
    if (selectedPeriod === 'weekly' && weeklyApiData?.daily?.length) {
      return weeklyApiData.daily.map(mapRow);
    }
    if (selectedPeriod === 'monthly' && monthlyApiData?.daily?.length) {
      return monthlyApiData.daily.map(mapRow);
    }
    if (selectedPeriod === 'daily' && dailyApiData) {
      return [{
        date: dailyApiData.date?.slice(5).replace('-', '/') ?? today,
        completed: Number(dailyApiData.summary?.total_delivered ?? 0),
        target: Number(dailyApiData.summary?.total_points ?? 0),
        suspended: 0,
        failed: 0,
      }];
    }
    return [];
  }, [selectedPeriod, weeklyApiData, monthlyApiData, dailyApiData, today]);

  // ── Area report from API ──────────────────────────────────────────────────
  const filteredAreaReport = useMemo(() => {
    const rows = (areaStatsData ?? []).map((a: any) => ({
      area: a.name,
      subscribers: Number(a.total_points ?? 0),
      completed: Number(a.delivered ?? 0),
      suspended: 0,
      failed: 0,
      rate: a.total_points > 0 ? Math.round(a.delivered / a.total_points * 1000) / 10 : 0,
      avgTime: '---',
      distance: '---',
      issues: 0,
    }));
    if (selectedArea !== 'all') return rows.filter((r: any) => r.area === selectedArea);
    return rows;
  }, [areaStatsData, selectedArea]);

  // ── User performance from API ─────────────────────────────────────────────
  const filteredDelivererPerformance = useMemo(() => {
    const rows = (userPerfData ?? []).map((u: any) => ({
      name: u.name,
      rate: Number(u.completion_rate ?? 0),
      completed: Number(u.delivered ?? 0),
      total: Number(u.total_points ?? 0),
      avgTime: u.avg_duration_min ? Math.round(u.avg_duration_min * 10) / 10 : 0,
      onTimeRate: Number(u.completion_rate ?? 0),
    }));
    if (selectedDeliverer !== 'all') return rows.filter((r: any) => r.name === selectedDeliverer);
    return rows;
  }, [userPerfData, selectedDeliverer]);

  // ── Export handlers ──────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = chartData.map(r => [r.date, r.completed, r.target].join(','));
    const csv = ['日付,配達完了,目標', ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

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
                {filteredDelivererPerformance.map(d => (
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

        {/* Deliverer Summary KPI - 1/3 width */}
        <div className="bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">配達員サマリー</h2>
          {userLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
          ) : filteredDelivererPerformance.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">データなし</div>
          ) : (
            <div className="space-y-3">
              {filteredDelivererPerformance.slice(0, 5).map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--text-primary)] w-20 truncate">{d.name}</span>
                  <div className="flex-1 bg-[var(--color-gray-100)] rounded-full h-2">
                    <div className="h-2 rounded-full bg-[var(--color-primary-500)]" style={{ width: `${Math.min(d.rate, 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)] w-14 text-right">{d.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deliverer Performance Bar Chart + Area Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Area Stats Table */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">区域別レポート</h2>
          <span className="text-sm text-[var(--text-secondary)]">{startDate} 〜 {endDate}</span>
        </div>
        {areaLoading ? (
          <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-[var(--text-muted)]" /></div>
        ) : filteredAreaReport.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-[var(--text-muted)]">対象期間にデータがありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">区域</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">配達完了</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">総件数</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">完了率</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreaReport.map((area) => (
                  <tr key={area.area} className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{area.area}</td>
                    <td className="px-6 py-4 text-center font-medium text-[var(--color-success-600)]">{area.completed}</td>
                    <td className="px-6 py-4 text-center text-[var(--text-primary)]">{area.subscribers}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${area.rate >= 95 ? 'text-[var(--color-success-600)]' : 'text-[var(--color-warning-600)]'}`}>{area.rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}