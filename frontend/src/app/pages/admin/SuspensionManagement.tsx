import { useState, useMemo } from 'react';
import { Plus, Calendar, Ban, Download, Upload, Edit, Trash2, Eye, X, AlertCircle, CheckCircle, Clock, Phone, Mail, FileText, TrendingUp, Users, Pause, Play, RotateCcw, Search, Filter, ChevronDown, Copy, Bell, Package, MapPin, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { suspensionService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';

interface Suspension {
  id: number;
  subscriberId: string;
  subscriber: string;
  area: string;
  areaColor: string;
  newspapers: string;
  startDate: string;
  endDate: string;
  daysLeft: number | null;
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
  phone?: string;
  email?: string;
  copies?: number;
  notes?: string;
  createdAt?: string;
  autoResume?: boolean;
  notificationSent?: boolean;
}

const suspensions: Suspension[] = [
  {
    id: 1,
    subscriberId: 'A-0002',
    subscriber: '鈴木一郎様',
    area: 'A区域',
    areaColor: '#3B82F6',
    newspapers: '朝刊・夕刊',
    startDate: '2024-04-01',
    endDate: '2024-04-10',
    daysLeft: 8,
    status: 'active',
    reason: '旅行',
    phone: '083-1234-5678',
    email: 'suzuki@example.com',
    copies: 2,
    notes: '4/10夕方に帰宅予定',
    createdAt: '2024-03-25',
    autoResume: true,
    notificationSent: true,
  },
  {
    id: 2,
    subscriberId: 'A-0015',
    subscriber: '高橋花子様',
    area: 'A区域',
    areaColor: '#3B82F6',
    newspapers: '朝刊のみ',
    startDate: '2024-04-02',
    endDate: '2024-04-05',
    daysLeft: 3,
    status: 'active',
    reason: '入院',
    phone: '083-2345-6789',
    copies: 1,
    notes: '退院日は変更の可能性あり',
    createdAt: '2024-03-30',
    autoResume: true,
    notificationSent: false,
  },
  {
    id: 3,
    subscriberId: 'B-0023',
    subscriber: '佐々木様',
    area: 'B区域',
    areaColor: '#22C55E',
    newspapers: '全て',
    startDate: '2024-04-05',
    endDate: '2024-04-15',
    daysLeft: null,
    status: 'scheduled',
    reason: '出張',
    phone: '083-3456-7890',
    email: 'sasaki@example.com',
    copies: 1,
    notes: '',
    createdAt: '2024-04-01',
    autoResume: true,
    notificationSent: false,
  },
  {
    id: 4,
    subscriberId: 'C-0008',
    subscriber: '松田様',
    area: 'C区域',
    areaColor: '#8B5CF6',
    newspapers: '全て',
    startDate: '2024-03-20',
    endDate: '2024-04-01',
    daysLeft: null,
    status: 'completed',
    reason: '帰省',
    phone: '083-4567-8901',
    copies: 1,
    notes: '無事再開済み',
    createdAt: '2024-03-15',
    autoResume: true,
    notificationSent: true,
  },
  {
    id: 5,
    subscriberId: 'B-0045',
    subscriber: '田中太郎様',
    area: 'B区域',
    areaColor: '#22C55E',
    newspapers: '朝刊・夕刊',
    startDate: '2024-04-10',
    endDate: '2024-04-20',
    daysLeft: null,
    status: 'scheduled',
    reason: '海外旅行',
    phone: '083-5678-9012',
    email: 'tanaka@example.com',
    copies: 2,
    notes: '配達再開は4/21朝刊から',
    createdAt: '2024-04-02',
    autoResume: true,
    notificationSent: false,
  },
  {
    id: 6,
    subscriberId: 'A-0087',
    subscriber: '山田美咲様',
    area: 'A区域',
    areaColor: '#3B82F6',
    newspapers: '朝刊のみ',
    startDate: '2024-03-15',
    endDate: '2024-03-25',
    daysLeft: null,
    status: 'completed',
    reason: '入院',
    phone: '083-6789-0123',
    copies: 1,
    notes: '',
    createdAt: '2024-03-10',
    autoResume: true,
    notificationSent: true,
  },
  {
    id: 7,
    subscriberId: 'C-0056',
    subscriber: '伊藤健太様',
    area: 'C区域',
    areaColor: '#8B5CF6',
    newspapers: '朝刊・夕刊',
    startDate: '2024-04-03',
    endDate: '2024-04-08',
    daysLeft: 6,
    status: 'active',
    reason: '家族旅行',
    phone: '083-7890-1234',
    email: 'ito@example.com',
    copies: 3,
    notes: '3部全て停止',
    createdAt: '2024-03-28',
    autoResume: true,
    notificationSent: true,
  },
];

const statusConfig = {
  active: { label: '有効', color: '#22C55E', bg: '#DCFCE7', icon: Pause },
  scheduled: { label: '予定', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  completed: { label: '完了', color: '#94A3B8', bg: '#F1F5F9', icon: CheckCircle },
  cancelled: { label: 'キャンセル', color: '#EF4444', bg: '#FEE2E2', icon: X },
};

const reasonOptions = ['旅行', '出張', '入院', '帰省', '海外旅行', '家族旅行', 'その他'];

export function SuspensionManagement() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'calendar' | 'timeline' | 'card'>('table');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedSuspension, setSelectedSuspension] = useState<number | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Real API
  const { data: apiResult, isLoading } = useQuery({
    queryKey: ['suspensions', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: () => suspensionService.getList({ status: statusFilter !== 'all' ? statusFilter : undefined }),
    placeholderData: (prev) => prev,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => suspensionService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      toast.success('留守止めを解除しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  // Map API to UI shape
  const suspensions = useMemo(() => (apiResult?.data ?? []).map((s: any) => {
    const today = new Date();
    const endDate = new Date(s.end_date);
    const daysLeft = s.status === 'active'
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      id: s.id,
      subscriberId: s.subscriber?.customer_code ?? '--',
      subscriber: s.subscriber?.name ?? '--',
      area: s.subscriber?.area?.name ?? '--',
      areaColor: '#3B82F6',
      newspapers: (s.subscriber?.newspapers ?? []).map((n: any) => n.name).join('・') || '--',
      startDate: s.start_date,
      endDate: s.end_date,
      daysLeft,
      status: s.status as 'active' | 'scheduled' | 'completed' | 'cancelled',
      reason: s.reason ?? '',
      phone: s.subscriber?.phone ?? '',
      copies: (s.subscriber?.newspapers ?? []).reduce((sum: number, n: any) => sum + (n.quantity ?? 0), 0) || 1,
      notes: s.notes ?? '',
      createdAt: s.created_at?.split('T')[0] ?? '',
      autoResume: true,
      notificationSent: false,
    };
  }), [apiResult]);

  // Calculate statistics
  const stats = {
    total: suspensions.length,
    active: suspensions.filter(s => s.status === 'active').length,
    scheduled: suspensions.filter(s => s.status === 'scheduled').length,
    completed: suspensions.filter(s => s.status === 'completed').length,
    endingSoon: suspensions.filter(s => s.daysLeft !== null && s.daysLeft !== undefined && s.daysLeft <= 3).length,
    autoResume: suspensions.filter(s => s.autoResume).length,
  };

  // Filter suspensions
  let filteredSuspensions = suspensions.filter(sus => {
    const matchesStatus = statusFilter === 'all' || sus.status === statusFilter;
    const matchesArea = areaFilter === 'all' || sus.area === areaFilter;
    const matchesSearch = !searchQuery || 
      sus.subscriber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sus.subscriberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sus.reason && sus.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesArea && matchesSearch;
  });

  const toggleRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredSuspensions.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredSuspensions.map(s => s.id));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ban size={28} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">留守止め管理</h1>
          <span className="text-sm text-[var(--text-secondary)]">
            {filteredSuspensions.length}件
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
          >
            <TrendingUp size={16} />
            統計{showStats ? '非表示' : '表示'}
          </button>
          <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Download size={16} />
            エクスポート
          </button>
          <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Upload size={16} />
            インポート
          </button>
          <button className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] transition-colors flex items-center gap-2">
            <Plus size={20} />
            新規登録
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">総件数</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Pause size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">有効</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.active}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">予定</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.scheduled}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">完了</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.completed}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">終了間近</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.endingSoon}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <RotateCcw size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">自動再開</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.autoResume}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode & Filters */}
      <div className="bg-white rounded-xl p-4 border border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">フィルター</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-[var(--color-primary-600)] hover:underline"
            >
              {showFilters ? '非表示' : '表示'}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-[var(--color-gray-100)] rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 text-sm font-medium rounded flex items-center gap-1 transition-colors ${
                view === 'table'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              📋 テーブル
            </button>
            <button
              onClick={() => setView('card')}
              className={`px-3 py-2 text-sm font-medium rounded flex items-center gap-1 transition-colors ${
                view === 'card'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              📇 カード
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-2 text-sm font-medium rounded flex items-center gap-1 transition-colors ${
                view === 'timeline'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              📊 タイムライン
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 text-sm font-medium rounded flex items-center gap-1 transition-colors ${
                view === 'calendar'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              <Calendar size={16} />
              カレンダー
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">状態</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て ({suspensions.length})</option>
                  <option value="active">有効 ({stats.active})</option>
                  <option value="scheduled">予定 ({stats.scheduled})</option>
                  <option value="completed">完了 ({stats.completed})</option>
                </select>
              </div>

              {/* Area Filter */}
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

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">期間</label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全期間</option>
                  <option value="today">今日</option>
                  <option value="week">今週</option>
                  <option value="month">今月</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">クイックフィルター</label>
                <select
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="ending-soon">終了間近</option>
                  <option value="auto-resume">自動再開</option>
                  <option value="no-notification">未通知</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">検索</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="購読者名、コード..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selection Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-[var(--color-primary-50)] rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-primary-700)]">
            {selectedRows.length}件選択中
          </span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Play size={16} className="inline mr-2" />
              一括再開
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Copy size={16} className="inline mr-2" />
              一括延長
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Bell size={16} className="inline mr-2" />
              通知送信
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--color-danger-600)] bg-white border border-[var(--color-danger-200)] rounded-lg hover:bg-[var(--color-danger-50)]">
              一括キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredSuspensions.length && filteredSuspensions.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[var(--border-default)]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    購読者
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    連絡先
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    区域
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    対象新聞
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    期間
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    残日数
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    理由
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    状態
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    自動再開
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSuspensions.map((suspension) => {
                  const StatusIcon = statusConfig[suspension.status].icon;
                  const duration = calculateDuration(suspension.startDate, suspension.endDate);
                  return (
                    <tr
                      key={suspension.id}
                      className={`border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors ${
                        selectedSuspension === suspension.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedSuspension(suspension.id)}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(suspension.id)}
                          onChange={() => toggleRow(suspension.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-[var(--border-default)]"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                        {suspension.id}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{suspension.subscriber}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{suspension.subscriberId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {suspension.phone && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <Phone size={12} />
                              {suspension.phone}
                            </div>
                          )}
                          {suspension.email && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <Mail size={12} />
                              {suspension.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-1 text-xs font-medium rounded text-white"
                          style={{ backgroundColor: suspension.areaColor }}
                        >
                          {suspension.area}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[var(--text-secondary)]">
                          {suspension.newspapers}
                        </div>
                        {suspension.copies && (
                          <div className="text-xs text-[var(--text-tertiary)]">
                            {suspension.copies}部
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-[var(--text-primary)]">{formatDate(suspension.startDate)} - {formatDate(suspension.endDate)}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{duration}日間</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {suspension.daysLeft !== null ? (
                          <div className={`text-sm font-bold ${suspension.daysLeft <= 3 ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                            {suspension.daysLeft}日
                            {suspension.daysLeft <= 3 && (
                              <AlertCircle size={14} className="inline ml-1" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--text-secondary)]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {suspension.reason || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                          style={{
                            color: statusConfig[suspension.status].color,
                            backgroundColor: statusConfig[suspension.status].bg,
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig[suspension.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {suspension.autoResume ? (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <RotateCcw size={12} />
                              ON
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-secondary)]">OFF</span>
                          )}
                          {suspension.notificationSent && (
                            <Bell size={12} className="text-blue-500" title="通知済み" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
                            title="詳細"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
                            title="編集"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          {suspension.status === 'active' && (
                            <button 
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="再開"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Play size={16} />
                            </button>
                          )}
                          <button 
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="解除"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`留守止めを解除しますか?`)) {
                                cancelMutation.mutate(suspension.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[var(--border-default)] flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">
              1-{filteredSuspensions.length} / 23件
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-lg hover:bg-[var(--color-gray-200)]">
                前へ
              </button>
              <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-lg hover:bg-[var(--color-gray-200)]">
                次へ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card View */}
      {view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuspensions.map((suspension) => {
            const StatusIcon = statusConfig[suspension.status].icon;
            const duration = calculateDuration(suspension.startDate, suspension.endDate);
            return (
              <div
                key={suspension.id}
                className="bg-white rounded-xl p-5 border border-[var(--border-default)] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedSuspension(suspension.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(suspension.id)}
                      onChange={() => toggleRow(suspension.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{suspension.subscriber}</h3>
                      <div className="text-xs text-[var(--text-secondary)]">{suspension.subscriberId}</div>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                    style={{
                      color: statusConfig[suspension.status].color,
                      backgroundColor: statusConfig[suspension.status].bg,
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusConfig[suspension.status].label}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded text-white"
                      style={{ backgroundColor: suspension.areaColor }}
                    >
                      {suspension.area}
                    </span>
                    <span className="text-[var(--text-secondary)]">{suspension.newspapers}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Calendar size={14} />
                    <span>{formatDate(suspension.startDate)} - {formatDate(suspension.endDate)} ({duration}日間)</span>
                  </div>
                  {suspension.daysLeft !== null && (
                    <div className={`flex items-center gap-2 ${suspension.daysLeft <= 3 ? 'text-red-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
                      <Clock size={14} />
                      <span>残り {suspension.daysLeft}日</span>
                      {suspension.daysLeft <= 3 && <AlertCircle size={14} />}
                    </div>
                  )}
                  {suspension.phone && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Phone size={14} />
                      <span>{suspension.phone}</span>
                    </div>
                  )}
                  {suspension.reason && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Info size={14} />
                      <span>理由: {suspension.reason}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    {suspension.autoResume && (
                      <div className="flex items-center gap-1 text-green-600">
                        <RotateCcw size={12} />
                        自動再開
                      </div>
                    )}
                    {suspension.notificationSent && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Bell size={12} />
                        通知済
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded"
                    >
                      <Edit size={16} />
                    </button>
                    {suspension.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {suspension.notes && (
                  <div className="mt-3 pt-3 border-t text-xs text-[var(--text-secondary)] italic">
                    📝 {suspension.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <div className="space-y-6">
            {filteredSuspensions
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map((suspension, index) => {
                const StatusIcon = statusConfig[suspension.status].icon;
                const duration = calculateDuration(suspension.startDate, suspension.endDate);
                return (
                  <div key={suspension.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: statusConfig[suspension.status].bg,
                          color: statusConfig[suspension.status].color 
                        }}
                      >
                        <StatusIcon size={20} />
                      </div>
                      {index < filteredSuspensions.length - 1 && (
                        <div className="w-0.5 h-full bg-[var(--border-default)] mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-[var(--text-primary)]">{suspension.subscriber}</h3>
                            <div className="text-sm text-[var(--text-secondary)]">{suspension.subscriberId}</div>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                            style={{
                              color: statusConfig[suspension.status].color,
                              backgroundColor: statusConfig[suspension.status].bg,
                            }}
                          >
                            <StatusIcon size={12} />
                            {statusConfig[suspension.status].label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-[var(--text-secondary)]">期間</div>
                            <div className="font-medium">{formatDate(suspension.startDate)} - {formatDate(suspension.endDate)}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{duration}日間</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--text-secondary)]">区域・新聞</div>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex px-2 py-0.5 text-xs font-medium rounded text-white"
                                style={{ backgroundColor: suspension.areaColor }}
                              >
                                {suspension.area}
                              </span>
                              <span className="text-sm">{suspension.newspapers}</span>
                            </div>
                          </div>
                          {suspension.reason && (
                            <div>
                              <div className="text-xs text-[var(--text-secondary)]">理由</div>
                              <div className="font-medium">{suspension.reason}</div>
                            </div>
                          )}
                          {suspension.daysLeft !== null && (
                            <div>
                              <div className="text-xs text-[var(--text-secondary)]">残日数</div>
                              <div className={`font-bold ${suspension.daysLeft <= 3 ? 'text-red-600' : ''}`}>
                                {suspension.daysLeft}日
                              </div>
                            </div>
                          )}
                        </div>
                        {suspension.notes && (
                          <div className="mt-3 pt-3 border-t text-xs text-[var(--text-secondary)] italic">
                            📝 {suspension.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white rounded-xl p-6 border border-[var(--border-default)]">
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-secondary)]">
              カレンダービューは実装予定です
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
