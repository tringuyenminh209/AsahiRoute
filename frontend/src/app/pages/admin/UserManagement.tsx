import { useState, useMemo } from 'react';
import { Plus, Download, Upload, Edit, Trash2, Eye, X, CheckCircle, Clock, AlertTriangle, MapPin, Phone, Mail, Calendar, TrendingUp, Users, UserCheck, UserX, Pause, Star, Award, Package, Navigation, Bike, FileText, Search, Filter, Grid3X3, List as ListIcon, BarChart3, Settings, Bell, Shield, Home, Briefcase, User, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';

interface Deliverer {
  id: number;
  employeeId: string;
  name: string;
  nameKana: string;
  phone: string;
  email: string;
  emergencyContact?: string;
  emergencyName?: string;
  address: string;
  status: 'active' | 'on-leave' | 'inactive';
  joinDate: string;
  assignedRoutes: string[];
  assignedAreas: string[];
  shift: 'morning' | 'evening' | 'both';
  workDays: string[];
  totalDeliveries: number;
  completionRate: number;
  avgDeliveryTime: number;
  rating: number;
  reviews: number;
  lastDelivery?: string;
  vehicle?: string;
  vehicleNumber?: string;
  hasLicense: boolean;
  hasContract: boolean;
  isVerified: boolean;
  photo?: string;
  notes?: string;
  salary?: string;
  paymentMethod?: string;
}

const deliverers: Deliverer[] = [
  {
    id: 1,
    employeeId: 'DEL-001',
    name: '佐藤太郎',
    nameKana: 'サトウタロウ',
    phone: '090-1111-2222',
    email: 'sato@asahi.com',
    emergencyContact: '090-1111-3333',
    emergencyName: '佐藤花子（妻）',
    address: '下関市○○町1-2-3',
    status: 'active',
    joinDate: '2020-04-01',
    assignedRoutes: ['A区域 朝刊ルート', 'A区域 夕刊ルート'],
    assignedAreas: ['A区域'],
    shift: 'both',
    workDays: ['月', '火', '水', '木', '金', '土'],
    totalDeliveries: 15420,
    completionRate: 98.5,
    avgDeliveryTime: 3.2,
    rating: 4.8,
    reviews: 156,
    lastDelivery: '2時間前',
    vehicle: 'バイク',
    vehicleNumber: '下関 あ 1234',
    hasLicense: true,
    hasContract: true,
    isVerified: true,
    notes: 'ベテラン配達員。地域の地理に精通。',
    salary: '月給 250,000円',
    paymentMethod: '銀行振込',
  },
  {
    id: 2,
    employeeId: 'DEL-002',
    name: '田中花子',
    nameKana: 'タナカハナコ',
    phone: '090-2222-3333',
    email: 'tanaka@asahi.com',
    emergencyContact: '090-2222-4444',
    emergencyName: '田中一郎（夫）',
    address: '下関市○○町2-5-8',
    status: 'active',
    joinDate: '2021-06-15',
    assignedRoutes: ['B区域 朝刊ルート', 'B区域 夕刊ルート'],
    assignedAreas: ['B区域'],
    shift: 'both',
    workDays: ['月', '火', '水', '木', '金'],
    totalDeliveries: 8940,
    completionRate: 97.2,
    avgDeliveryTime: 3.5,
    rating: 4.6,
    reviews: 89,
    lastDelivery: '1時間前',
    vehicle: '自転車',
    hasLicense: false,
    hasContract: true,
    isVerified: true,
    notes: '丁寧な配達で顧客満足度高い。',
    salary: '時給 1,200円',
    paymentMethod: '銀行振込',
  },
  {
    id: 3,
    employeeId: 'DEL-003',
    name: '李 明',
    nameKana: 'リ ミン',
    phone: '090-3333-4444',
    email: 'li@asahi.com',
    emergencyContact: '090-3333-5555',
    emergencyName: '李 美香（妻）',
    address: '下関市○○町3-7-2',
    status: 'active',
    joinDate: '2022-01-10',
    assignedRoutes: ['C区域 朝刊ルート'],
    assignedAreas: ['C区域'],
    shift: 'morning',
    workDays: ['月', '火', '水', '木', '金', '土', '日'],
    totalDeliveries: 5680,
    completionRate: 96.8,
    avgDeliveryTime: 3.8,
    rating: 4.5,
    reviews: 67,
    lastDelivery: '30分前',
    vehicle: 'バイク',
    vehicleNumber: '下関 い 5678',
    hasLicense: true,
    hasContract: true,
    isVerified: true,
    notes: '早朝勤務専門。時間厳守。',
    salary: '月給 220,000円',
    paymentMethod: '銀行振込',
  },
  {
    id: 4,
    employeeId: 'DEL-004',
    name: '鈴木次郎',
    nameKana: 'スズキジロウ',
    phone: '090-4444-5555',
    email: 'suzuki@asahi.com',
    address: '下関市○○町4-3-6',
    status: 'on-leave',
    joinDate: '2021-03-20',
    assignedRoutes: ['D区域 朝刊ルート'],
    assignedAreas: ['D区域'],
    shift: 'morning',
    workDays: ['月', '火', '水', '木', '金'],
    totalDeliveries: 7230,
    completionRate: 95.5,
    avgDeliveryTime: 4.0,
    rating: 4.3,
    reviews: 52,
    lastDelivery: '5日前',
    vehicle: '自転車',
    hasLicense: false,
    hasContract: true,
    isVerified: true,
    notes: '休暇中（2024/04/01 - 2024/04/10）',
    salary: '時給 1,100円',
    paymentMethod: '銀行振込',
  },
  {
    id: 5,
    employeeId: 'DEL-005',
    name: '高橋美咲',
    nameKana: 'タカハシミサキ',
    phone: '090-5555-6666',
    email: 'takahashi@asahi.com',
    emergencyContact: '090-5555-7777',
    emergencyName: '高橋健太（兄）',
    address: '下関市○○町5-1-9',
    status: 'active',
    joinDate: '2023-02-01',
    assignedRoutes: ['A区域 夕刊ルート'],
    assignedAreas: ['A区域'],
    shift: 'evening',
    workDays: ['月', '火', '水', '木', '金'],
    totalDeliveries: 3420,
    completionRate: 98.2,
    avgDeliveryTime: 3.0,
    rating: 4.9,
    reviews: 45,
    lastDelivery: '3時間前',
    vehicle: 'バイク',
    vehicleNumber: '下関 う 9012',
    hasLicense: true,
    hasContract: true,
    isVerified: true,
    notes: '夕刊専門。スピーディーな配達。',
    salary: '時給 1,300円',
    paymentMethod: '銀行振込',
  },
  {
    id: 6,
    employeeId: 'DEL-006',
    name: '山田健太',
    nameKana: 'ヤマダケンタ',
    phone: '090-6666-7777',
    email: 'yamada@asahi.com',
    address: '下関市○○町6-2-4',
    status: 'inactive',
    joinDate: '2019-10-15',
    assignedRoutes: [],
    assignedAreas: [],
    shift: 'morning',
    workDays: [],
    totalDeliveries: 12850,
    completionRate: 94.2,
    avgDeliveryTime: 3.6,
    rating: 4.2,
    reviews: 124,
    lastDelivery: '2ヶ月前',
    vehicle: 'バイク',
    hasLicense: true,
    hasContract: false,
    isVerified: false,
    notes: '退職済み（2024/02/29）',
    salary: '',
    paymentMethod: '',
  },
];

const statusConfig = {
  active: { label: '稼働中', color: '#22C55E', bg: '#DCFCE7', icon: UserCheck },
  'on-leave': { label: '休暇中', color: '#F59E0B', bg: '#FEF3C7', icon: Pause },
  inactive: { label: '退職', color: '#94A3B8', bg: '#F1F5F9', icon: UserX },
};

const shiftConfig = {
  morning: { label: '朝刊のみ', color: '#3B82F6', bg: '#DBEAFE' },
  evening: { label: '夕刊のみ', color: '#8B5CF6', bg: '#EDE9FE' },
  both: { label: '朝刊+夕刊', color: '#22C55E', bg: '#DCFCE7' },
};

export function UserManagement() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'card' | 'calendar'>('table');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDeliverer, setSelectedDeliverer] = useState<number | null>(null);

  // Real API
  const { data: apiUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getList(),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => userService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('ユーザーを無効化しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  // Map API users to UI shape
  const deliverers = useMemo(() => (apiUsers as any[]).map((u: any) => ({
    id: u.id,
    employeeId: `DEL-${String(u.id).padStart(3, '0')}`,
    name: u.name,
    nameKana: u.name_kana ?? u.name,
    phone: u.phone ?? '--',
    email: u.email,
    address: u.address ?? '--',
    status: u.is_active === false ? 'inactive' : 'active' as 'active' | 'on-leave' | 'inactive',
    joinDate: u.created_at?.split('T')[0] ?? '--',
    assignedRoutes: (u.routes ?? []).map((r: any) => r.name),
    assignedAreas: (u.routes ?? []).map((r: any) => r.area?.name).filter(Boolean),
    shift: 'both' as 'morning' | 'evening' | 'both',
    workDays: ['月', '火', '水', '木', '金', '土'],
    totalDeliveries: u.total_deliveries ?? 0,
    completionRate: u.completion_rate ?? 0,
    avgDeliveryTime: u.avg_delivery_time ?? 0,
    rating: u.rating ?? 0,
    reviews: u.reviews ?? 0,
    lastDelivery: u.last_delivery_at ?? '--',
    vehicle: u.vehicle ?? '--',
    vehicleNumber: u.vehicle_number ?? '--',
    hasLicense: u.has_license ?? false,
    hasContract: u.has_contract ?? false,
    isVerified: u.is_verified ?? false,
    notes: u.notes ?? '',
    salary: '--',
    paymentMethod: '--',
  })), [apiUsers]);

  // Calculate statistics
  const stats = {
    total: deliverers.length,
    active: deliverers.filter(d => d.status === 'active').length,
    onLeave: deliverers.filter(d => d.status === 'on-leave').length,
    inactive: deliverers.filter(d => d.status === 'inactive').length,
    avgRating: deliverers.length
      ? (deliverers.reduce((sum, d) => sum + d.rating, 0) / deliverers.length).toFixed(1)
      : '0.0',
    avgCompletion: deliverers.filter(d => d.status === 'active').length
      ? (deliverers.filter(d => d.status === 'active').reduce((sum, d) => sum + d.completionRate, 0) / deliverers.filter(d => d.status === 'active').length).toFixed(1)
      : '0.0',
    topPerformers: deliverers.filter(d => d.rating >= 4.7 && d.status === 'active').length,
  };

  // Filter deliverers
  let filteredDeliverers = deliverers.filter(del => {
    const matchesStatus = statusFilter === 'all' || del.status === statusFilter;
    const matchesArea = areaFilter === 'all' || del.assignedAreas.includes(areaFilter);
    const matchesShift = shiftFilter === 'all' || del.shift === shiftFilter;
    const matchesSearch = !searchQuery ||
      del.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.nameKana.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.phone.includes(searchQuery);

    return matchesStatus && matchesArea && matchesShift && matchesSearch;
  });

  const toggleRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredDeliverers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredDeliverers.map(d => d.id));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const calculateYearsOfService = (joinDate: string) => {
    const join = new Date(joinDate);
    const today = new Date();
    const years = (today.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return years.toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">配達員管理</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {filteredDeliverers.length}名の配達員
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
            <BarChart3 size={16} />
            パフォーマンス
          </button>
          <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Download size={16} />
            エクスポート
          </button>
          <button className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors flex items-center gap-2">
            <Upload size={16} />
            インポート
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md">
            <Plus size={20} />
            新規登録
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-7 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">総配達員数</div>
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
                <div className="text-xs text-[var(--text-secondary)]">稼働中</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.active}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Pause size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">休暇中</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.onLeave}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserX size={20} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">退職</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.inactive}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">平均評価</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.avgRating}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">平均完了率</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.avgCompletion}%</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">優秀者</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.topPerformers}</div>
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
                  <option value="all">全て ({deliverers.length})</option>
                  <option value="active">稼働中 ({stats.active})</option>
                  <option value="on-leave">休暇中 ({stats.onLeave})</option>
                  <option value="inactive">退職 ({stats.inactive})</option>
                </select>
              </div>

              {/* Area Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">担当区域</label>
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

              {/* Shift Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">勤務シフト</label>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="morning">朝刊のみ</option>
                  <option value="evening">夕刊のみ</option>
                  <option value="both">朝刊+夕刊</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">クイックフィルター</label>
                <select
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="all">全て</option>
                  <option value="high-rating">高評価（4.5+）</option>
                  <option value="new">新規（3ヶ月以内）</option>
                  <option value="veteran">ベテラン（3年以上）</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">検索</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="氏名、ID、電話番号..."
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center justify-between border border-blue-200">
          <span className="text-sm font-medium text-blue-700">
            {selectedRows.length}名選択中
          </span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Bell size={16} className="inline mr-2" />
              一括通知
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <MapPin size={16} className="inline mr-2" />
              区域変更
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Download size={16} className="inline mr-2" />
              エクスポート
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
                      checked={selectedRows.length === filteredDeliverers.length && filteredDeliverers.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[var(--border-default)]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    社員ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    氏名
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    連絡先
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    担当ルート
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    シフト
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    勤務日
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    パフォーマンス
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    評価
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    状態
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliverers.map((deliverer) => {
                  const StatusIcon = statusConfig[deliverer.status].icon;
                  const yearsOfService = calculateYearsOfService(deliverer.joinDate);
                  return (
                    <tr
                      key={deliverer.id}
                      className={`border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors ${
                        selectedDeliverer === deliverer.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedDeliverer(deliverer.id)}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(deliverer.id)}
                          onChange={() => toggleRow(deliverer.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-[var(--border-default)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{deliverer.employeeId}</div>
                          <div className="text-xs text-[var(--text-secondary)]">入社: {formatDate(deliverer.joinDate)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{deliverer.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{deliverer.nameKana}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Phone size={12} />
                            {deliverer.phone}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Mail size={12} />
                            {deliverer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {deliverer.assignedRoutes.slice(0, 2).map((route, idx) => (
                            <div key={idx} className="text-xs text-[var(--text-secondary)]">
                              {route}
                            </div>
                          ))}
                          {deliverer.assignedRoutes.length > 2 && (
                            <div className="text-xs text-[var(--text-tertiary)]">
                              +{deliverer.assignedRoutes.length - 2}件
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-1 text-xs font-medium rounded"
                          style={{
                            color: shiftConfig[deliverer.shift].color,
                            backgroundColor: shiftConfig[deliverer.shift].bg,
                          }}
                        >
                          {shiftConfig[deliverer.shift].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {deliverer.workDays.slice(0, 4).map((day, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center justify-center w-5 h-5 text-xs bg-[var(--color-gray-100)] text-[var(--text-secondary)] rounded"
                            >
                              {day}
                            </span>
                          ))}
                          {deliverer.workDays.length > 4 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-[var(--color-gray-100)] text-[var(--text-secondary)] rounded">
                              +{deliverer.workDays.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Package size={12} className="text-blue-600" />
                            <span className="text-[var(--text-primary)]">{deliverer.totalDeliveries.toLocaleString()}件</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <CheckCircle size={12} className="text-green-600" />
                            <span className="text-[var(--text-primary)]">{deliverer.completionRate}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500" fill="#EAB308" />
                          <span className="text-sm font-bold text-[var(--text-primary)]">{deliverer.rating}</span>
                          <span className="text-xs text-[var(--text-secondary)]">({deliverer.reviews})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                          style={{
                            color: statusConfig[deliverer.status].color,
                            backgroundColor: statusConfig[deliverer.status].bg,
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig[deliverer.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
                            title="詳細"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View:', deliverer.id);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
                            title="編集"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit:', deliverer.id);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1 text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)] rounded transition-colors"
                            title="設定"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Settings:', deliverer.id);
                            }}
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="無効化"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`${deliverer.name}を無効化しますか?`)) {
                                deactivateMutation.mutate(deliverer.id);
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
              1-{filteredDeliverers.length} / 12名
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
          {filteredDeliverers.map((deliverer) => {
            const StatusIcon = statusConfig[deliverer.status].icon;
            const yearsOfService = calculateYearsOfService(deliverer.joinDate);
            return (
              <div
                key={deliverer.id}
                className="bg-white rounded-xl p-5 border border-[var(--border-default)] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedDeliverer(deliverer.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(deliverer.id)}
                      onChange={() => toggleRow(deliverer.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {deliverer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{deliverer.name}</h3>
                      <div className="text-xs text-[var(--text-secondary)]">{deliverer.employeeId}</div>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                    style={{
                      color: statusConfig[deliverer.status].color,
                      backgroundColor: statusConfig[deliverer.status].bg,
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusConfig[deliverer.status].label}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Phone size={14} />
                    <span>{deliverer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Mail size={14} />
                    <span className="truncate">{deliverer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded"
                      style={{
                        color: shiftConfig[deliverer.shift].color,
                        backgroundColor: shiftConfig[deliverer.shift].bg,
                      }}
                    >
                      {shiftConfig[deliverer.shift].label}
                    </span>
                    <div className="flex gap-1">
                      {deliverer.workDays.slice(0, 3).map((day, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center justify-center w-5 h-5 text-xs bg-[var(--color-gray-100)] text-[var(--text-secondary)] rounded"
                        >
                          {day}
                        </span>
                      ))}
                      {deliverer.workDays.length > 3 && (
                        <span className="text-xs text-[var(--text-secondary)]">+{deliverer.workDays.length - 3}</span>
                      )}
                    </div>
                  </div>
                  {deliverer.assignedRoutes.length > 0 && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Navigation size={14} />
                      <span className="text-xs">
                        {deliverer.assignedRoutes[0]}
                        {deliverer.assignedRoutes.length > 1 && ` +${deliverer.assignedRoutes.length - 1}`}
                      </span>
                    </div>
                  )}
                  {deliverer.vehicle && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Bike size={14} />
                      <span className="text-xs">{deliverer.vehicle} {deliverer.vehicleNumber}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[var(--color-gray-50)] rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-[var(--text-secondary)]">配達数</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {(deliverer.totalDeliveries / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[var(--text-secondary)]">完了率</div>
                    <div className="text-sm font-bold text-green-600">{deliverer.completionRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[var(--text-secondary)]">評価</div>
                    <div className="flex items-center justify-center gap-1">
                      <Star size={12} className="text-yellow-500" fill="#EAB308" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{deliverer.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {deliverer.isVerified && (
                      <CheckCircle size={16} className="text-green-600" title="確認済み" />
                    )}
                    {deliverer.hasContract && (
                      <FileText size={16} className="text-blue-600" title="契約書あり" />
                    )}
                    {deliverer.hasLicense && (
                      <Shield size={16} className="text-purple-600" title="免許あり" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit:', deliverer.id);
                      }}
                      className="p-2 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Settings:', deliverer.id);
                      }}
                      className="p-2 text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)] rounded"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </div>

                {deliverer.notes && (
                  <div className="mt-3 pt-3 border-t text-xs text-[var(--text-secondary)] italic">
                    📝 {deliverer.notes}
                  </div>
                )}
              </div>
            );
          })}
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
