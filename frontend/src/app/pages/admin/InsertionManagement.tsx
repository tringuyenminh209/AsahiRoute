import { useState } from 'react';
import { Plus, Download, Upload, Edit, Trash2, Eye, X, CheckCircle, Clock, AlertTriangle, MapPin, Phone, Mail, FileText, TrendingUp, Users, Package, Calendar, ChevronDown, Search, Filter, Grid3X3, List as ListIcon, Columns, CheckSquare, XCircle, PlayCircle, Camera, Navigation, Home, User, Zap, Copy, Bell } from 'lucide-react';

interface Insertion {
  id: number;
  requestId: string;
  subscriber: string;
  phone: string;
  email?: string;
  address: string;
  detailedAddress: string;
  area: string;
  areaColor: string;
  suggestedRoute?: string;
  newspaper: string;
  copies: number;
  startDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'assigned' | 'completed';
  priority: 'normal' | 'high' | 'urgent';
  requestedBy: string;
  requestDate: string;
  assignedTo?: string;
  assignedDate?: string;
  completedDate?: string;
  notes?: string;
  deliveryInstructions?: string;
  photos?: number;
  hasContract?: boolean;
  verified?: boolean;
  estimatedDeliveryTime?: string;
  distance?: string;
}

const insertions: Insertion[] = [
  {
    id: 1,
    requestId: 'INS-2024-001',
    subscriber: '山田太郎様',
    phone: '083-1111-2222',
    email: 'yamada@example.com',
    address: '下関市○○町1-2-3',
    detailedAddress: 'マンション○○ 305号室',
    area: 'A区域',
    areaColor: '#3B82F6',
    suggestedRoute: 'A区域 朝刊ルート',
    newspaper: '朝刊',
    copies: 1,
    startDate: '2024-04-10',
    status: 'pending',
    priority: 'high',
    requestedBy: '営業部 田中',
    requestDate: '2024-04-02',
    notes: '玄関右側のポストに投函',
    deliveryInstructions: 'オートロック解除コード: 1234',
    photos: 2,
    hasContract: true,
    verified: false,
    estimatedDeliveryTime: '3分',
    distance: '0.5km',
  },
  {
    id: 2,
    requestId: 'INS-2024-002',
    subscriber: '佐藤花子様',
    phone: '083-2222-3333',
    address: '下関市○○町2-5-8',
    detailedAddress: '一戸建て',
    area: 'A区域',
    areaColor: '#3B82F6',
    suggestedRoute: 'A区域 朝刊ルート',
    newspaper: '朝刊+夕刊',
    copies: 2,
    startDate: '2024-04-08',
    status: 'approved',
    priority: 'normal',
    requestedBy: '営業部 鈴木',
    requestDate: '2024-04-01',
    assignedTo: '佐藤太郎',
    assignedDate: '2024-04-03',
    notes: '',
    deliveryInstructions: '犬がいるため注意',
    photos: 3,
    hasContract: true,
    verified: true,
    estimatedDeliveryTime: '4分',
    distance: '0.8km',
  },
  {
    id: 3,
    requestId: 'INS-2024-003',
    subscriber: '鈴木一郎様',
    phone: '083-3333-4444',
    email: 'suzuki@example.com',
    address: '下関市○○町3-7-2',
    detailedAddress: 'アパート○○ 201号',
    area: 'B区域',
    areaColor: '#22C55E',
    suggestedRoute: 'B区域 朝刊ルート',
    newspaper: '朝刊',
    copies: 1,
    startDate: '2024-04-05',
    status: 'assigned',
    priority: 'normal',
    requestedBy: '営業部 田中',
    requestDate: '2024-03-28',
    assignedTo: '田中花子',
    assignedDate: '2024-03-30',
    notes: 'ポスト満杯注意',
    deliveryInstructions: '',
    photos: 1,
    hasContract: true,
    verified: true,
    estimatedDeliveryTime: '2分',
    distance: '0.3km',
  },
  {
    id: 4,
    requestId: 'INS-2024-004',
    subscriber: '高橋美咲様',
    phone: '083-4444-5555',
    address: '下関市○○町5-1-9',
    detailedAddress: '一戸建て',
    area: 'C区域',
    areaColor: '#8B5CF6',
    suggestedRoute: 'C区域 朝刊ルート',
    newspaper: '朝刊+夕刊',
    copies: 1,
    startDate: '2024-04-03',
    status: 'completed',
    priority: 'normal',
    requestedBy: '営業部 佐藤',
    requestDate: '2024-03-25',
    assignedTo: '李 明',
    assignedDate: '2024-03-26',
    completedDate: '2024-04-03',
    notes: '配達完了',
    deliveryInstructions: '',
    photos: 2,
    hasContract: true,
    verified: true,
    estimatedDeliveryTime: '3分',
    distance: '0.6km',
  },
  {
    id: 5,
    requestId: 'INS-2024-005',
    subscriber: '伊藤健太様',
    phone: '083-5555-6666',
    email: 'ito@example.com',
    address: '下関市○○町4-3-6',
    detailedAddress: 'マンション△△ 1502号室',
    area: 'B区域',
    areaColor: '#22C55E',
    suggestedRoute: 'B区域 朝刊ルート',
    newspaper: '朝刊',
    copies: 3,
    startDate: '2024-04-12',
    status: 'pending',
    priority: 'urgent',
    requestedBy: '営業部 田中',
    requestDate: '2024-04-02',
    notes: '3部配達',
    deliveryInstructions: '管理人に確認必要',
    photos: 0,
    hasContract: false,
    verified: false,
    estimatedDeliveryTime: '5分',
    distance: '1.2km',
  },
  {
    id: 6,
    requestId: 'INS-2024-006',
    subscriber: '渡辺誠様',
    phone: '083-6666-7777',
    address: '下関市○○町6-2-4',
    detailedAddress: '一戸建て',
    area: 'A区域',
    areaColor: '#3B82F6',
    newspaper: '朝刊',
    copies: 1,
    startDate: '2024-04-15',
    status: 'rejected',
    priority: 'normal',
    requestedBy: '営業部 鈴木',
    requestDate: '2024-04-01',
    notes: '配達エリア外のため却下',
    deliveryInstructions: '',
    photos: 0,
    hasContract: false,
    verified: false,
  },
];

const statusConfig = {
  pending: { label: '承認待ち', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  approved: { label: '承認済み', color: '#3B82F6', bg: '#DBEAFE', icon: CheckCircle },
  rejected: { label: '却下', color: '#EF4444', bg: '#FEE2E2', icon: XCircle },
  assigned: { label: '割当済み', color: '#8B5CF6', bg: '#EDE9FE', icon: PlayCircle },
  completed: { label: '完了', color: '#22C55E', bg: '#DCFCE7', icon: CheckSquare },
};

const priorityConfig = {
  normal: { label: '通常', color: '#6B7280', bg: '#F3F4F6' },
  high: { label: '高', color: '#F59E0B', bg: '#FEF3C7' },
  urgent: { label: '緊急', color: '#EF4444', bg: '#FEE2E2' },
};

export function InsertionManagement() {
  const [view, setView] = useState<'table' | 'card' | 'kanban'>('table');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedInsertion, setSelectedInsertion] = useState<number | null>(null);

  // Calculate statistics
  const stats = {
    total: insertions.length,
    pending: insertions.filter(i => i.status === 'pending').length,
    approved: insertions.filter(i => i.status === 'approved').length,
    assigned: insertions.filter(i => i.status === 'assigned').length,
    completed: insertions.filter(i => i.status === 'completed').length,
    urgent: insertions.filter(i => i.priority === 'urgent').length,
    unverified: insertions.filter(i => !i.verified).length,
  };

  // Filter insertions
  let filteredInsertions = insertions.filter(ins => {
    const matchesStatus = statusFilter === 'all' || ins.status === statusFilter;
    const matchesArea = areaFilter === 'all' || ins.area === areaFilter;
    const matchesPriority = priorityFilter === 'all' || ins.priority === priorityFilter;
    const matchesSearch = !searchQuery || 
      ins.subscriber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesArea && matchesPriority && matchesSearch;
  });

  const toggleRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredInsertions.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredInsertions.map(i => i.id));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const calculateDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diff = start.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Group by status for Kanban view
  const kanbanColumns = {
    pending: filteredInsertions.filter(i => i.status === 'pending'),
    approved: filteredInsertions.filter(i => i.status === 'approved'),
    assigned: filteredInsertions.filter(i => i.status === 'assigned'),
    completed: filteredInsertions.filter(i => i.status === 'completed'),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Plus size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">新規挿入管理</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {filteredInsertions.length}件の申請
            </p>
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
          <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Download size={16} />
            エクスポート
          </button>
          <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Upload size={16} />
            インポート
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md">
            <Plus size={20} />
            新規挿入申請
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-7 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">総申請数</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">承認待ち</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.pending}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">承認済み</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.approved}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <PlayCircle size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">割当済み</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.assigned}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare size={20} className="text-green-600" />
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
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">緊急</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.urgent}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">未確認</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.unverified}</div>
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
              <ListIcon size={16} />
              テーブル
            </button>
            <button
              onClick={() => setView('card')}
              className={`px-3 py-2 text-sm font-medium rounded flex items-center gap-1 transition-colors ${
                view === 'card'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              <Grid3X3 size={16} />
              カード
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-2 text-sm font-medium rounded flex items-center gap-1 transition-colors ${
                view === 'kanban'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              }`}
            >
              <Columns size={16} />
              カンバン
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
                  <option value="all">全て ({insertions.length})</option>
                  <option value="pending">承認待ち ({stats.pending})</option>
                  <option value="approved">承認済み ({stats.approved})</option>
                  <option value="assigned">割当済み ({stats.assigned})</option>
                  <option value="completed">完了 ({stats.completed})</option>
                  <option value="rejected">却下</option>
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

              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">優先度</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="urgent">緊急</option>
                  <option value="high">高</option>
                  <option value="normal">通常</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">クイックフィルター</label>
                <select
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="unverified">未確認</option>
                  <option value="no-contract">契約書未提出</option>
                  <option value="urgent">緊急のみ</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">検索</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="申請ID、氏名、住所..."
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
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-4 flex items-center justify-between border border-orange-200">
          <span className="text-sm font-medium text-orange-700">
            {selectedRows.length}件選択中
          </span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <CheckCircle size={16} className="inline mr-2" />
              一括承認
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <PlayCircle size={16} className="inline mr-2" />
              一括割当
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Bell size={16} className="inline mr-2" />
              通知送信
            </button>
            <button className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50">
              一括却下
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
                      checked={selectedRows.length === filteredInsertions.length && filteredInsertions.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[var(--border-default)]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    申請ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    購読者
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    連絡先
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    住所
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    区域・ルート
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    新聞・部数
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    開始日
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    優先度
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    状態
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    確認
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInsertions.map((insertion) => {
                  const StatusIcon = statusConfig[insertion.status].icon;
                  const daysUntil = calculateDaysUntilStart(insertion.startDate);
                  return (
                    <tr
                      key={insertion.id}
                      className={`border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors ${
                        selectedInsertion === insertion.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedInsertion(insertion.id)}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(insertion.id)}
                          onChange={() => toggleRow(insertion.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-[var(--border-default)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{insertion.requestId}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{formatDate(insertion.requestDate)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{insertion.subscriber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Phone size={12} />
                            {insertion.phone}
                          </div>
                          {insertion.email && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <Mail size={12} />
                              {insertion.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm text-[var(--text-primary)]">{insertion.address}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{insertion.detailedAddress}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span
                            className="inline-flex px-2 py-1 text-xs font-medium rounded text-white"
                            style={{ backgroundColor: insertion.areaColor }}
                          >
                            {insertion.area}
                          </span>
                          {insertion.suggestedRoute && (
                            <div className="text-xs text-[var(--text-secondary)] mt-1">
                              {insertion.suggestedRoute}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[var(--text-secondary)]">
                          {insertion.newspaper}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {insertion.copies}部
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[var(--text-primary)]">{formatDate(insertion.startDate)}</div>
                        {daysUntil >= 0 && (
                          <div className={`text-xs ${daysUntil <= 3 ? 'text-red-600 font-bold' : 'text-[var(--text-secondary)]'}`}>
                            {daysUntil}日後
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-1 text-xs font-medium rounded"
                          style={{
                            color: priorityConfig[insertion.priority].color,
                            backgroundColor: priorityConfig[insertion.priority].bg,
                          }}
                        >
                          {priorityConfig[insertion.priority].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                          style={{
                            color: statusConfig[insertion.status].color,
                            backgroundColor: statusConfig[insertion.status].bg,
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig[insertion.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {insertion.verified ? (
                            <CheckCircle size={16} className="text-green-600" title="確認済み" />
                          ) : (
                            <AlertTriangle size={16} className="text-orange-600" title="未確認" />
                          )}
                          {insertion.hasContract ? (
                            <FileText size={16} className="text-blue-600" title="契約書あり" />
                          ) : (
                            <FileText size={16} className="text-gray-400" title="契約書なし" />
                          )}
                          {insertion.photos && insertion.photos > 0 && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <Camera size={14} />
                              {insertion.photos}
                            </div>
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
                              console.log('View:', insertion.id);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          {insertion.status === 'pending' && (
                            <>
                              <button 
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="承認"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Approve:', insertion.id);
                                }}
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button 
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="却下"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Reject:', insertion.id);
                                }}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
                            title="編集"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit:', insertion.id);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="削除"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Delete:', insertion.id);
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
              1-{filteredInsertions.length} / 15件
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
          {filteredInsertions.map((insertion) => {
            const StatusIcon = statusConfig[insertion.status].icon;
            const daysUntil = calculateDaysUntilStart(insertion.startDate);
            return (
              <div
                key={insertion.id}
                className="bg-white rounded-xl p-5 border border-[var(--border-default)] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedInsertion(insertion.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(insertion.id)}
                      onChange={() => toggleRow(insertion.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{insertion.subscriber}</h3>
                      <div className="text-xs text-[var(--text-secondary)]">{insertion.requestId}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                      style={{
                        color: statusConfig[insertion.status].color,
                        backgroundColor: statusConfig[insertion.status].bg,
                      }}
                    >
                      <StatusIcon size={12} />
                      {statusConfig[insertion.status].label}
                    </span>
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded"
                      style={{
                        color: priorityConfig[insertion.priority].color,
                        backgroundColor: priorityConfig[insertion.priority].bg,
                      }}
                    >
                      {priorityConfig[insertion.priority].label}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded text-white"
                      style={{ backgroundColor: insertion.areaColor }}
                    >
                      {insertion.area}
                    </span>
                    <span className="text-[var(--text-secondary)]">{insertion.newspaper} × {insertion.copies}部</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Home size={14} />
                    <span className="truncate">{insertion.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <MapPin size={14} />
                    <span className="text-xs">{insertion.detailedAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Phone size={14} />
                    <span>{insertion.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Calendar size={14} />
                    <span>開始: {formatDate(insertion.startDate)}</span>
                    {daysUntil >= 0 && (
                      <span className={daysUntil <= 3 ? 'text-red-600 font-bold' : ''}>
                        ({daysUntil}日後)
                      </span>
                    )}
                  </div>
                  {insertion.suggestedRoute && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Navigation size={14} />
                      <span className="text-xs">{insertion.suggestedRoute}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {insertion.verified ? (
                      <CheckCircle size={16} className="text-green-600" title="確認済み" />
                    ) : (
                      <AlertTriangle size={16} className="text-orange-600" title="未確認" />
                    )}
                    {insertion.hasContract && (
                      <FileText size={16} className="text-blue-600" title="契約書あり" />
                    )}
                    {insertion.photos && insertion.photos > 0 && (
                      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Camera size={14} />
                        {insertion.photos}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {insertion.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Approve:', insertion.id);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="承認"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Reject:', insertion.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="却下"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit:', insertion.id);
                      }}
                      className="p-2 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                {insertion.notes && (
                  <div className="mt-3 pt-3 border-t text-xs text-[var(--text-secondary)] italic">
                    📝 {insertion.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(kanbanColumns).map(([status, items]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            return (
              <div key={status} className="bg-[var(--color-gray-50)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon size={18} style={{ color: config.color }} />
                    <h3 className="font-bold text-[var(--text-primary)]">{config.label}</h3>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((insertion) => {
                    const daysUntil = calculateDaysUntilStart(insertion.startDate);
                    return (
                      <div
                        key={insertion.id}
                        className="bg-white rounded-lg p-3 border border-[var(--border-default)] hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedInsertion(insertion.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-[var(--text-primary)] text-sm">{insertion.subscriber}</h4>
                            <div className="text-xs text-[var(--text-secondary)]">{insertion.requestId}</div>
                          </div>
                          <span
                            className="inline-flex px-2 py-0.5 text-xs font-medium rounded"
                            style={{
                              color: priorityConfig[insertion.priority].color,
                              backgroundColor: priorityConfig[insertion.priority].bg,
                            }}
                          >
                            {priorityConfig[insertion.priority].label}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                          <div className="flex items-center gap-1">
                            <span
                              className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded text-white"
                              style={{ backgroundColor: insertion.areaColor }}
                            >
                              {insertion.area}
                            </span>
                            <span>{insertion.newspaper}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(insertion.startDate)}
                            {daysUntil >= 0 && (
                              <span className={daysUntil <= 3 ? 'text-red-600 font-bold' : ''}>
                                ({daysUntil}日後)
                              </span>
                            )}
                          </div>
                          {insertion.suggestedRoute && (
                            <div className="flex items-center gap-1">
                              <Navigation size={12} />
                              <span className="truncate">{insertion.suggestedRoute}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                          {insertion.verified ? (
                            <CheckCircle size={14} className="text-green-600" />
                          ) : (
                            <AlertTriangle size={14} className="text-orange-600" />
                          )}
                          {insertion.hasContract && (
                            <FileText size={14} className="text-blue-600" />
                          )}
                          {insertion.photos && insertion.photos > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Camera size={12} />
                              <span className="text-xs">{insertion.photos}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
