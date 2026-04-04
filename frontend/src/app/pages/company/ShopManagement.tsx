import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Store,
  Users,
  MapPin,
  Phone,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import {
  companyService,
  type CompanyShop,
  type ShopUser,
} from '../../../services/company.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-[var(--border-default)]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Create/Edit Shop Dialog ───────────────────────────────────────────────────

interface ShopFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  emergency_phone: string;
  lat: string;
  lng: string;
}

const emptyShopForm: ShopFormData = {
  name: '',
  code: '',
  address: '',
  phone: '',
  emergency_phone: '',
  lat: '',
  lng: '',
};

function shopFormToPayload(form: ShopFormData): Omit<CompanyShop, 'id' | 'company_id' | 'users_count' | 'areas_count'> {
  return {
    name: form.name,
    code: form.code,
    address: form.address,
    phone: form.phone,
    emergency_phone: form.emergency_phone || null,
    lat: form.lat !== '' ? parseFloat(form.lat) : null,
    lng: form.lng !== '' ? parseFloat(form.lng) : null,
  };
}

interface ShopDialogProps {
  open: boolean;
  shop: CompanyShop | null;
  onClose: () => void;
}

function ShopDialog({ open, shop, onClose }: ShopDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = shop !== null;

  const [form, setForm] = useState<ShopFormData>(() =>
    shop
      ? {
          name: shop.name,
          code: shop.code,
          address: shop.address,
          phone: shop.phone,
          emergency_phone: shop.emergency_phone ?? '',
          lat: shop.lat != null ? String(shop.lat) : '',
          lng: shop.lng != null ? String(shop.lng) : '',
        }
      : emptyShopForm
  );

  const createMutation = useMutation({
    mutationFn: (data: ReturnType<typeof shopFormToPayload>) =>
      companyService.createShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-shops'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      toast.success('店舗を作成しました');
      onClose();
    },
    onError: () => toast.error('店舗の作成に失敗しました'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ReturnType<typeof shopFormToPayload>) =>
      companyService.updateShop(shop!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-shops'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      toast.success('店舗情報を更新しました');
      onClose();
    },
    onError: () => toast.error('店舗の更新に失敗しました'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = shopFormToPayload(form);
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const setField = (key: keyof ShopFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {isEdit ? '店舗情報を編集' : '新規店舗追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--text-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={setField('name')}
              required
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="下関朝日新聞販売所"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={setField('code')}
              required
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="SHOP-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              住所 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={setField('address')}
              required
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="山口県下関市○○町1-2-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={setField('phone')}
              required
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="083-000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              緊急連絡先
            </label>
            <input
              type="tel"
              value={form.emergency_phone}
              onChange={setField('emergency_phone')}
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="083-000-0001"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                緯度
              </label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={setField('lat')}
                className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                placeholder="34.1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                経度
              </label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={setField('lng')}
                className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                placeholder="130.9876"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0F4C35' }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  shop: CompanyShop | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({ shop, onClose, onConfirm, isPending }: DeleteDialogProps) {
  if (!shop) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">店舗を削除</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          「{shop.name}」を削除します。この操作は元に戻せません。
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Staff Dialog ──────────────────────────────────────────────────────────

interface StaffFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'deliverer';
}

const emptyStaffForm: StaffFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'deliverer',
};

interface AddStaffDialogProps {
  shopId: number | null;
  onClose: () => void;
}

function AddStaffDialog({ shopId, onClose }: AddStaffDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StaffFormData>(emptyStaffForm);

  const mutation = useMutation({
    mutationFn: (data: { name: string; email: string; phone?: string; role: 'admin' | 'deliverer'; password: string }) =>
      companyService.addShopUser(shopId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-shop-users', shopId] });
      toast.success('スタッフを追加しました');
      onClose();
    },
    onError: () => toast.error('スタッフの追加に失敗しました'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      role: form.role,
    });
  };

  const setField =
    <K extends keyof StaffFormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value as StaffFormData[K] }));

  if (!shopId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">スタッフ追加</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--text-secondary)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={setField('name')}
              required
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="山田太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={setField('email')}
              required
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="yamada@shop.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={setField('password')}
              required
              minLength={8}
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="8文字以上"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              電話番号
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={setField('phone')}
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              placeholder="090-0000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              役割
            </label>
            <select
              value={form.role}
              onChange={setField('role')}
              className="w-full h-10 px-3 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] bg-white"
            >
              <option value="deliverer">配達員</option>
              <option value="admin">管理者</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0F4C35' }}
            >
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Shop Detail Drawer ────────────────────────────────────────────────────────

interface ShopDetailDrawerProps {
  shop: CompanyShop | null;
  onClose: () => void;
  onEdit: (shop: CompanyShop) => void;
}

function ShopDetailDrawer({ shop, onClose, onEdit }: ShopDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'staff'>('info');
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useQuery<ShopUser[]>({
    queryKey: ['company-shop-users', shop?.id],
    queryFn: () => companyService.getShopUsers(shop!.id),
    enabled: !!shop && activeTab === 'staff',
  });

  if (!shop) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{shop.name}</h2>
            <span className="text-xs text-[var(--text-secondary)] font-mono">{shop.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(shop)}
              className="p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--text-secondary)] transition-colors"
              title="編集"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-gray-50)] rounded-lg text-[var(--text-secondary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-default)]">
          {(['info', 'staff'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-[#0F4C35] text-[#0F4C35]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'info' ? '基本情報' : 'スタッフ'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[var(--color-gray-50)] rounded-lg">
                <Store size={18} className="text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">店舗名</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{shop.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[var(--color-gray-50)] rounded-lg">
                <MapPin size={18} className="text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">住所</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{shop.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[var(--color-gray-50)] rounded-lg">
                <Phone size={18} className="text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">電話番号</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{shop.phone}</div>
                  {shop.emergency_phone && (
                    <div className="text-xs text-[var(--text-secondary)] mt-1">緊急: {shop.emergency_phone}</div>
                  )}
                </div>
              </div>
              {(shop.lat != null || shop.lng != null) && (
                <div className="flex items-start gap-3 p-4 bg-[var(--color-gray-50)] rounded-lg">
                  <MapPin size={18} className="text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">座標</div>
                    <div className="text-sm font-mono text-[var(--text-primary)]">
                      {shop.lat}, {shop.lng}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[var(--color-gray-50)] rounded-lg text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{shop.users_count ?? '--'}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">スタッフ数</div>
                </div>
                <div className="p-4 bg-[var(--color-gray-50)] rounded-lg text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{shop.areas_count ?? '--'}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">区域数</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">スタッフ一覧</h3>
                <button
                  onClick={() => setAddStaffOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#0F4C35' }}
                >
                  <UserPlus size={14} />
                  スタッフ追加
                </button>
              </div>

              {usersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 bg-[var(--color-gray-50)] rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-40" />
                  </div>
                ))
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                  スタッフがいません
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-4 bg-[var(--color-gray-50)] rounded-lg">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: u.role === 'admin' ? '#0F4C35' : '#CC0000' }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{u.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] truncate">{u.email}</div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                        u.role === 'admin'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {u.role === 'admin' ? '管理者' : '配達員'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {addStaffOpen && (
        <AddStaffDialog shopId={shop.id} onClose={() => setAddStaffOpen(false)} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ShopManagement() {
  const queryClient = useQueryClient();
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<CompanyShop | null>(null);
  const [deletingShop, setDeletingShop] = useState<CompanyShop | null>(null);
  const [detailShop, setDetailShop] = useState<CompanyShop | null>(null);

  const { data: shops = [], isLoading } = useQuery<CompanyShop[]>({
    queryKey: ['company-shops'],
    queryFn: () => companyService.getShops(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => companyService.deleteShop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-shops'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      toast.success('店舗を削除しました');
      setDeletingShop(null);
    },
    onError: () => toast.error('店舗の削除に失敗しました'),
  });

  const openCreate = () => {
    setEditingShop(null);
    setShopDialogOpen(true);
  };

  const openEdit = (shop: CompanyShop) => {
    setEditingShop(shop);
    setDetailShop(null);
    setShopDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">店舗管理</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">傘下の販売店舗を管理します</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#0F4C35' }}
        >
          <Plus size={18} />
          新規店舗追加
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border-default)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--color-gray-50)]">
                {['店舗名', 'コード', '住所', '電話番号', '管理者数', '区域数', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : shops.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      店舗データがありません
                    </td>
                  </tr>
                )
                : shops.map((shop) => (
                  <tr
                    key={shop.id}
                    className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--color-gray-50)] transition-colors cursor-pointer"
                    onClick={() => setDetailShop(shop)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: '#0F4C35' }}
                        >
                          {shop.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{shop.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-[var(--text-secondary)]">{shop.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--text-secondary)] truncate max-w-[180px] block">{shop.address}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--text-secondary)]">{shop.phone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[var(--text-muted)]" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{shop.users_count ?? '--'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{shop.areas_count ?? '--'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEdit(shop)}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded text-[var(--text-secondary)] transition-colors"
                          title="編集"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingShop(shop)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-[var(--text-secondary)] transition-colors"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => setDetailShop(shop)}
                          className="p-1.5 hover:bg-[var(--color-gray-100)] rounded text-[var(--text-secondary)] transition-colors"
                          title="詳細"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <ShopDialog
        open={shopDialogOpen}
        shop={editingShop}
        onClose={() => {
          setShopDialogOpen(false);
          setEditingShop(null);
        }}
      />

      <DeleteDialog
        shop={deletingShop}
        onClose={() => setDeletingShop(null)}
        onConfirm={() => deletingShop && deleteMutation.mutate(deletingShop.id)}
        isPending={deleteMutation.isPending}
      />

      <ShopDetailDrawer
        shop={detailShop}
        onClose={() => setDetailShop(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
