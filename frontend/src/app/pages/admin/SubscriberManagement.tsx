import { useState, useMemo } from 'react';
import { SkeletonRow } from '../../components/Skeleton';
import { Plus, Download, Upload, Edit, Trash2, Camera, Search, Filter, Newspaper, Grid3X3, List, MapPin, Phone, Mail, Clock, Calendar, Tag, Star, QrCode, Printer, Eye, MoreVertical, TrendingUp, Users, UserCheck, UserX, FileText, ArrowUpDown, ChevronDown, X, AlertCircle, CheckCircle, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subscriberService } from '../../../services/admin.service';

interface Subscriber {
  id: string;
  code: string;
  name: string;
  address: string;
  area: string;
  areaColor: string;
  newspaper: string;
  copies: number;
  status: 'active' | 'suspended' | 'cancelled';
  photos: number;
  phone?: string;
  email?: string;
  notes?: string;
  startDate?: string;
  paymentStatus?: 'paid' | 'pending' | 'overdue';
  tags?: string[];
  isFavorite?: boolean;
  lastDelivery?: string;
}

const subscribers: Subscriber[] = [
  {
    id: '1',
    code: 'A-0001',
    name: '田中太郎様',
    address: '下関市○○町1-2-3',
    area: 'A区域',
    areaColor: '#3B82F6',
    newspaper: '朝刊',
    copies: 1,
    status: 'active',
    photos: 2,
    phone: '083-1234-5678',
    email: 'tanaka@example.com',
    notes: '玄関右側のポストに投函',
    startDate: '2023-01-15',
    paymentStatus: 'paid',
    tags: ['VIP', '優良顧客'],
    isFavorite: true,
    lastDelivery: '2時間前',
  },
  {
    id: '2',
    code: 'A-0002',
    name: '鈴木一郎様',
    address: '下関市○○町2-1-5',
    area: 'A区域',
    areaColor: '#3B82F6',
    newspaper: '朝刊+夕刊',
    copies: 2,
    status: 'suspended',
    photos: 1,
    phone: '083-2345-6789',
    notes: '留守止め: 2024/01/15 - 2024/01/30',
    startDate: '2022-06-20',
    paymentStatus: 'pending',
    tags: ['留守止め中'],
    isFavorite: false,
    lastDelivery: '3日前',
  },
  {
    id: '3',
    code: 'B-0015',
    name: '佐藤花子様',
    address: '下関市○○町3-4-8',
    area: 'B区域',
    areaColor: '#22C55E',
    newspaper: '朝刊',
    copies: 1,
    status: 'active',
    photos: 2,
    phone: '083-3456-7890',
    email: 'sato@example.com',
    startDate: '2023-03-10',
    paymentStatus: 'paid',
    tags: ['優良顧客'],
    isFavorite: true,
    lastDelivery: '1時間前',
  },
  {
    id: '4',
    code: 'C-0032',
    name: '高橋次郎様',
    address: '下関市○○町5-6-2',
    area: 'C区域',
    areaColor: '#8B5CF6',
    newspaper: '朝刊+夕刊',
    copies: 2,
    status: 'active',
    photos: 1,
    phone: '083-4567-8901',
    startDate: '2021-11-05',
    paymentStatus: 'overdue',
    tags: ['支払い遅延'],
    isFavorite: false,
    lastDelivery: '30分前',
  },
  {
    id: '5',
    code: 'B-0023',
    name: '山田美咲様',
    address: '下関市○○町7-8-9',
    area: 'B区域',
    areaColor: '#22C55E',
    newspaper: '朝刊',
    copies: 1,
    status: 'active',
    photos: 3,
    phone: '083-5678-9012',
    email: 'yamada@example.com',
    notes: '犬注意：玄関前でインターホンを押す',
    startDate: '2023-08-22',
    paymentStatus: 'paid',
    tags: ['新規'],
    isFavorite: false,
    lastDelivery: '45分前',
  },
  {
    id: '6',
    code: 'D-0008',
    name: '伊藤健太様',
    address: '下関市○○町9-10-11',
    area: 'D区域',
    areaColor: '#F59E0B',
    newspaper: '朝刊+夕刊',
    copies: 3,
    status: 'active',
    photos: 2,
    phone: '083-6789-0123',
    startDate: '2020-04-15',
    paymentStatus: 'paid',
    tags: ['長期契約', 'VIP'],
    isFavorite: true,
    lastDelivery: '15分前',
  },
];

const statusConfig = {
  active: { label: '有効', color: '#22C55E', bg: '#DCFCE7', icon: CheckCircle },
  suspended: { label: '留守中', color: '#F59E0B', bg: '#FEF3C7', icon: AlertCircle },
  cancelled: { label: '解約済', color: '#94A3B8', bg: '#F1F5F9', icon: X },
};

const paymentConfig = {
  paid: { label: '支払済', color: '#22C55E', bg: '#DCFCE7' },
  pending: { label: '未払', color: '#F59E0B', bg: '#FEF3C7' },
  overdue: { label: '延滞', color: '#EF4444', bg: '#FEE2E2' },
};

export function SubscriberManagement() {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'map'>('table');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [newspaperFilter, setNewspaperFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'area' | 'status'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true, name: true, address: true, area: true,
    newspaper: true, copies: true, status: true, phone: true,
    payment: true, photos: true, tags: true,
  });

  // Real API
  const { data: apiResult, isLoading } = useQuery({
    queryKey: ['subscribers', { q: searchQuery, status: statusFilter === 'all' ? undefined : statusFilter, page }],
    queryFn: () => subscriberService.getList({
      q: searchQuery || undefined,
      suspended: statusFilter === 'suspended' ? true : undefined,
      page,
    }),
    placeholderData: (prev) => prev,
  });

  const apiSubscribers = apiResult?.data ?? [];
  const meta = apiResult?.meta;

  // Map API data to UI shape (keep same shape as mock for minimal UI changes)
  const filteredSubscribers = useMemo(() => apiSubscribers.map((s: any) => ({
    id: String(s.id),
    code: s.customer_code,
    name: s.name,
    address: s.address,
    area: s.area?.name ?? '--',
    areaColor: '#3B82F6',
    newspaper: (s.newspapers ?? []).map((n: any) => n.name).join('+') || '--',
    copies: (s.newspapers ?? []).reduce((sum: number, n: any) => sum + (n.quantity ?? 0), 0) || 1,
    status: s.is_suspended ? 'suspended' : 'active',
    photos: 0,
    phone: s.phone ?? '',
    email: '',
    notes: s.delivery_note ?? '',
    startDate: s.created_at?.split('T')[0] ?? '',
    paymentStatus: 'paid',
    tags: [],
    isFavorite: false,
    lastDelivery: '--',
  })), [apiSubscribers]);

  const stats = {
    total: meta?.total ?? filteredSubscribers.length,
    active: filteredSubscribers.filter((s: any) => s.status === 'active').length,
    suspended: filteredSubscribers.filter((s: any) => s.status === 'suspended').length,
    cancelled: 0,
    vip: 0,
    overdue: 0,
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await subscriberService.exportCsv();
      toast.success('CSVをエクスポートしました');
    } catch {
      toast.error('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredSubscribers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredSubscribers.map((s) => s.id));
    }
  };

  const toggleFavorite = (id: string) => {
    // TODO: Implement favorite toggle
    console.log('Toggle favorite:', id);
  };

  const handleSort = (field: 'code' | 'name' | 'area' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper size={28} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">購読者管理</h1>
          <span className="text-sm text-[var(--text-secondary)]">
            {filteredSubscribers.length.toLocaleString()}件
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2"
          >
            <TrendingUp size={16} />
            統計{showStats ? '非表示' : '表示'}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Printer size={16} />
            ラベル印刷
          </button>
          <button className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Download size={16} />
            エクスポート
          </button>
          <button className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
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
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">総購読者</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck size={20} className="text-green-600" />
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
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">留守止め</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.suspended}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserX size={20} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">解約済</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.cancelled}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">VIP</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.vip}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">支払延滞</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.overdue}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & View Mode */}
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
          <div className="flex items-center gap-2 bg-[var(--color-gray-100)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="テーブルビュー"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'card'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="カードビュー"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-[var(--color-primary-500)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="マップビュー"
            >
              <MapPin size={18} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
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
                  <option value="D区域">D区域</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">状態</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="active">有効</option>
                  <option value="suspended">留守���め中</option>
                  <option value="cancelled">解約済</option>
                </select>
              </div>

              {/* Newspaper Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">新聞</label>
                <select
                  value={newspaperFilter}
                  onChange={(e) => setNewspaperFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="朝刊">朝刊のみ</option>
                  <option value="朝刊+夕刊">朝刊+夕刊</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">支払状況</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="paid">支払済</option>
                  <option value="pending">未払</option>
                  <option value="overdue">延滞</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">並び替え</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="code">コード順</option>
                  <option value="name">名前順</option>
                  <option value="area">区域順</option>
                  <option value="status">状態順</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                placeholder="名前・住所・顧客コード・電話番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={16} />
                </button>
              )}
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
              <QrCode size={16} className="inline mr-2" />
              QRコード生成
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              一括留守止め
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              一括区域変更
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Printer size={16} className="inline mr-2" />
              ラベル印刷
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--color-danger-600)] bg-white border border-[var(--color-danger-200)] rounded-lg hover:bg-[var(--color-danger-50)]">
              一括削除
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'table' ? (
        // Table View
        <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('code')}
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      顧客コード
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      購読者名
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    連絡先
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    住所
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('area')}
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      区域
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    新聞・部数
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      状態
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    支払
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    タグ
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    写真
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : filteredSubscribers.map((subscriber) => {
                  const StatusIcon = statusConfig[subscriber.status].icon;
                  return (
                    <tr
                      key={subscriber.id}
                      className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(subscriber.id)}
                          onChange={() => toggleRow(subscriber.id)}
                          className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(subscriber.id)}
                            className="text-[var(--text-secondary)] hover:text-yellow-500"
                          >
                            <Star size={16} fill={subscriber.isFavorite ? '#EAB308' : 'none'} className={subscriber.isFavorite ? 'text-yellow-500' : ''} />
                          </button>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {subscriber.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/subscribers/${subscriber.id}`)}
                          className="text-sm text-[var(--color-primary-600)] hover:underline font-medium"
                        >
                          {subscriber.name}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {subscriber.phone && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <Phone size={12} />
                              {subscriber.phone}
                            </div>
                          )}
                          {subscriber.email && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <Mail size={12} />
                              {subscriber.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-[200px] truncate">
                        {subscriber.address}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-1 text-xs font-medium rounded text-white"
                          style={{ backgroundColor: subscriber.areaColor }}
                        >
                          {subscriber.area}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[var(--text-secondary)]">
                          {subscriber.newspaper}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {subscriber.copies}部
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                          style={{
                            color: statusConfig[subscriber.status].color,
                            backgroundColor: statusConfig[subscriber.status].bg,
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig[subscriber.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {subscriber.paymentStatus && (
                          <span
                            className="inline-flex px-2 py-1 text-xs font-medium rounded"
                            style={{
                              color: paymentConfig[subscriber.paymentStatus].color,
                              backgroundColor: paymentConfig[subscriber.paymentStatus].bg,
                            }}
                          >
                            {paymentConfig[subscriber.paymentStatus].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {subscriber.tags?.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-1 text-xs bg-[var(--color-gray-100)] text-[var(--text-secondary)] rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(subscriber.photos, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 bg-[var(--color-gray-100)] rounded flex items-center justify-center cursor-pointer hover:bg-[var(--color-gray-200)]"
                            >
                              <Camera size={14} className="text-[var(--text-muted)]" />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => navigate(`/admin/subscribers/${subscriber.id}`)}
                            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
                            title="詳細"
                          >
                            <Eye size={16} />
                          </button>
                          <button className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors" title="編集">
                            <Edit size={16} />
                          </button>
                          <button className="p-1 text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)] rounded transition-colors" title="QRコード">
                            <QrCode size={16} />
                          </button>
                          <button className="p-1 text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)] rounded transition-colors" title="削除">
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

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[var(--border-default)] flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">
              1-{filteredSubscribers.length} / 3,042件
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-lg hover:bg-[var(--color-gray-200)] disabled:opacity-50">
                前へ
              </button>
              <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--color-gray-100)] rounded-lg hover:bg-[var(--color-gray-200)]">
                次へ
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscribers.map((subscriber) => {
            const StatusIcon = statusConfig[subscriber.status].icon;
            return (
              <div
                key={subscriber.id}
                className="bg-white rounded-xl p-5 border border-[var(--border-default)] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/admin/subscribers/${subscriber.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(subscriber.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleRow(subscriber.id);
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(subscriber.id);
                      }}
                    >
                      <Star size={18} fill={subscriber.isFavorite ? '#EAB308' : 'none'} className={subscriber.isFavorite ? 'text-yellow-500' : 'text-[var(--text-secondary)]'} />
                    </button>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                    style={{
                      color: statusConfig[subscriber.status].color,
                      backgroundColor: statusConfig[subscriber.status].bg,
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusConfig[subscriber.status].label}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">{subscriber.code}</div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{subscriber.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded text-white"
                      style={{ backgroundColor: subscriber.areaColor }}
                    >
                      {subscriber.area}
                    </span>
                    {subscriber.paymentStatus && (
                      <span
                        className="inline-flex px-2 py-1 text-xs font-medium rounded"
                        style={{
                          color: paymentConfig[subscriber.paymentStatus].color,
                          backgroundColor: paymentConfig[subscriber.paymentStatus].bg,
                        }}
                      >
                        {paymentConfig[subscriber.paymentStatus].label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <MapPin size={14} />
                    <span className="truncate">{subscriber.address}</span>
                  </div>
                  {subscriber.phone && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Phone size={14} />
                      <span>{subscriber.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Package size={14} />
                    <span>{subscriber.newspaper} × {subscriber.copies}部</span>
                  </div>
                  {subscriber.lastDelivery && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Clock size={14} />
                      <span>配達: {subscriber.lastDelivery}</span>
                    </div>
                  )}
                </div>

                {subscriber.tags && subscriber.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {subscriber.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-gray-100)] text-[var(--text-secondary)] rounded"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(subscriber.photos, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-[var(--color-gray-100)] rounded flex items-center justify-center"
                      >
                        <Camera size={12} className="text-[var(--text-muted)]" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit action
                      }}
                      className="p-2 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // QR action
                      }}
                      className="p-2 text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)] rounded"
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Map View Placeholder
        <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-sm p-12 text-center">
          <MapPin size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">マップビュー</h3>
          <p className="text-[var(--text-secondary)]">
            購読者の位置をマップ上に表示します（開発中）
          </p>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > meta.per_page && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-[var(--border-default)]">
          <span className="text-sm text-[var(--text-secondary)]">
            {((page - 1) * meta.per_page) + 1}〜{Math.min(page * meta.per_page, meta.total)}件 / 全{meta.total}件
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] disabled:opacity-40"
            >
              前へ
            </button>
            {Array.from({ length: Math.min(5, Math.ceil(meta.total / meta.per_page)) }, (_, i) => {
              const totalPages = Math.ceil(meta.total / meta.per_page);
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return p <= totalPages ? (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg ${
                    p === page
                      ? 'bg-[var(--color-primary-500)] text-white font-bold'
                      : 'border border-[var(--border-default)] hover:bg-[var(--color-gray-50)]'
                  }`}
                >
                  {p}
                </button>
              ) : null;
            })}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * meta.per_page >= meta.total || isLoading}
              className="px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}