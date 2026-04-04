import { useState } from 'react';
import { Save, RotateCcw, Upload, Plus, Edit, Trash2, Check, X, Bell, Mail, Smartphone, Shield, Globe, Clock, Moon, Database, Key, AlertTriangle, Building2, Phone, MapPin, User, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { newspaperTypeService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';

const tabs = [
  { id: 'store', label: '🏪 店舗情報', icon: <Building2 size={18} /> },
  { id: 'newspapers', label: '📰 新聞種類', icon: <Shield size={18} /> },
  { id: 'notifications', label: '🔔 通知設定', icon: <Bell size={18} /> },
  { id: 'roles', label: '👥 ロール権限', icon: <Shield size={18} /> },
  { id: 'system', label: '🔧 システム', icon: <Globe size={18} /> },
];

interface NewspaperType {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  active: boolean;
}

interface NotificationSetting {
  id: string;
  category: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface Role {
  id: string;
  name: string;
  permissions: {
    routes: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    subscribers: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    deliverers: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    reports: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    settings: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  };
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('store');
  const [hasChanges, setHasChanges] = useState(false);

  // Store Info State
  const [storeInfo, setStoreInfo] = useState({
    name: '朝日新聞販売店 東京中央',
    address: '東京都中央区○○町1-2-3',
    phone: '03-1234-5678',
    email: 'info@asahi-tokyo.co.jp',
    contactPerson: '山田太郎',
    businessHoursStart: '03:00',
    businessHoursEnd: '18:00',
  });

  // Newspaper Types — real API
  const queryClient = useQueryClient();
  const { data: newspapers = [], isLoading: newspapersLoading } = useQuery({
    queryKey: ['newspaper-types'],
    queryFn: () => newspaperTypeService.getList(),
  });
  const [editingNewspaper, setEditingNewspaper] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; code: string; delivery_time: 'morning' | 'evening' }>({ name: '', code: '', delivery_time: 'morning' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; code: string; delivery_time: 'morning' | 'evening' }>({ name: '', code: '', delivery_time: 'morning' });

  const createNewspaperMutation = useMutation({
    mutationFn: (data: typeof addForm) => newspaperTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-types'] });
      setShowAddForm(false);
      setAddForm({ name: '', code: '', delivery_time: 'morning' });
      toast.success('新聞種別を追加しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateNewspaperMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editForm }) => newspaperTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-types'] });
      setEditingNewspaper(null);
      toast.success('更新しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteNewspaperMutation = useMutation({
    mutationFn: (id: number) => newspaperTypeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newspaper-types'] });
      toast.success('削除しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'n1', category: '配達完了通知', email: true, push: true, sms: false },
    { id: 'n2', category: '配達遅延アラート', email: true, push: true, sms: true },
    { id: 'n3', category: '問題・トラブル報告', email: true, push: true, sms: true },
    { id: 'n4', category: '新規挿入通知', email: true, push: false, sms: false },
    { id: 'n5', category: '留守止め通知', email: true, push: false, sms: false },
    { id: 'n6', category: 'システムメンテナンス', email: true, push: true, sms: false },
  ]);

  // Role Permissions State
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: '管理者',
      permissions: {
        routes: { view: true, create: true, edit: true, delete: true },
        subscribers: { view: true, create: true, edit: true, delete: true },
        deliverers: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: true, edit: true, delete: true },
        settings: { view: true, create: true, edit: true, delete: true },
      },
    },
    {
      id: 'manager',
      name: 'マネージャー',
      permissions: {
        routes: { view: true, create: true, edit: true, delete: false },
        subscribers: { view: true, create: true, edit: true, delete: false },
        deliverers: { view: true, create: false, edit: true, delete: false },
        reports: { view: true, create: true, edit: false, delete: false },
        settings: { view: true, create: false, edit: false, delete: false },
      },
    },
    {
      id: 'deliverer',
      name: '配達員',
      permissions: {
        routes: { view: true, create: false, edit: false, delete: false },
        subscribers: { view: true, create: false, edit: false, delete: false },
        deliverers: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
      },
    },
  ]);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    language: 'ja',
    timezone: 'Asia/Tokyo',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    darkModeAuto: true,
    darkModeStart: '03:00',
    darkModeEnd: '06:00',
    dataRetentionDays: 365,
    backupEnabled: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
  });

  const handleSave = () => {
    console.log('Saving settings...', { storeInfo, newspapers, notifications, roles, systemSettings });
    alert('設定を保存しました！');
    setHasChanges(false);
  };

  const handleReset = () => {
    if (confirm('変更を破棄してもよろしいですか？')) {
      window.location.reload();
    }
  };

  const toggleNotification = (id: string, type: 'email' | 'push' | 'sms') => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, [type]: !n[type] } : n
    ));
    setHasChanges(true);
  };

  const togglePermission = (roleId: string, resource: string, permission: string) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [resource]: {
              ...role.permissions[resource as keyof typeof role.permissions],
              [permission]: !role.permissions[resource as keyof typeof role.permissions][permission as 'view'],
            },
          },
        };
      }
      return role;
    }));
    setHasChanges(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">⚙️ 設定</h1>
        {hasChanges && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
            >
              <RotateCcw size={16} />
              リセット
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)] flex items-center gap-2"
            >
              <Save size={16} />
              保存
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="border-b border-[var(--border-default)] flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[var(--color-primary-600)] border-b-2 border-[var(--color-primary-600)] bg-[var(--color-primary-50)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Store Info Tab */}
          {activeTab === 'store' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Building2 size={24} className="text-[var(--color-primary-500)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">店舗情報</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    店舗名
                  </label>
                  <input
                    type="text"
                    value={storeInfo.name}
                    onChange={(e) => {
                      setStoreInfo({ ...storeInfo, name: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    <MapPin size={14} className="inline mr-1" />
                    住所
                  </label>
                  <input
                    type="text"
                    value={storeInfo.address}
                    onChange={(e) => {
                      setStoreInfo({ ...storeInfo, address: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      <Phone size={14} className="inline mr-1" />
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={storeInfo.phone}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, phone: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      <Mail size={14} className="inline mr-1" />
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={storeInfo.email}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, email: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    <User size={14} className="inline mr-1" />
                    担当者名
                  </label>
                  <input
                    type="text"
                    value={storeInfo.contactPerson}
                    onChange={(e) => {
                      setStoreInfo({ ...storeInfo, contactPerson: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      <Clock size={14} className="inline mr-1" />
                      営業開始時刻
                    </label>
                    <input
                      type="time"
                      value={storeInfo.businessHoursStart}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, businessHoursStart: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      <Clock size={14} className="inline mr-1" />
                      営業終了時刻
                    </label>
                    <input
                      type="time"
                      value={storeInfo.businessHoursEnd}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, businessHoursEnd: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    店舗ロゴ
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-[var(--border-default)] rounded-lg flex items-center justify-center bg-[var(--color-gray-50)]">
                      <Upload size={32} className="text-[var(--text-muted)]" />
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-[var(--color-primary-500)] bg-white border border-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-50)] flex items-center gap-2">
                      <Upload size={16} />
                      ロゴをアップロード
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">推奨サイズ: 512×512px, PNG または JPG形式</p>
                </div>
              </div>
            </div>
          )}

          {/* Newspaper Types Tab */}
          {activeTab === 'newspapers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">新聞種類管理</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)] flex items-center gap-2"
                >
                  <Plus size={16} />
                  新規追加
                </button>
              </div>

              {/* Add Form */}
              {showAddForm && (
                <div className="bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg p-4 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">新聞名 *</label>
                    <input type="text" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" placeholder="朝日新聞 朝刊" />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">コード *</label>
                    <input type="text" value={addForm.code} onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" placeholder="ASA-M" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">配達区分</label>
                    <select value={addForm.delivery_time} onChange={(e) => setAddForm((f) => ({ ...f, delivery_time: e.target.value as 'morning' | 'evening' }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm">
                      <option value="morning">朝刊</option>
                      <option value="evening">夕刊</option>
                    </select>
                  </div>
                  <button
                    onClick={() => createNewspaperMutation.mutate(addForm)}
                    disabled={createNewspaperMutation.isPending || !addForm.name || !addForm.code}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-lg disabled:opacity-40 flex items-center gap-1"
                  >
                    {createNewspaperMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    追加
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-white">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="bg-white border border-[var(--border-default)] rounded-lg overflow-hidden">
                {newspapersLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-[var(--color-primary-500)]" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">新聞名</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">コード</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">配達区分</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newspapers.map((n) => (
                        <tr key={n.id} className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)]">
                          <td className="px-6 py-4">
                            {editingNewspaper === n.id ? (
                              <input type="text" value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-1 border border-[var(--border-default)] rounded text-sm" />
                            ) : (
                              <span className="font-medium text-[var(--text-primary)]">{n.name}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {editingNewspaper === n.id ? (
                              <input type="text" value={editForm.code}
                                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                                className="w-24 px-3 py-1 border border-[var(--border-default)] rounded text-sm text-center" />
                            ) : (
                              <span className="font-mono text-xs bg-[var(--color-gray-100)] px-2 py-1 rounded">{n.code}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {editingNewspaper === n.id ? (
                              <select value={editForm.delivery_time}
                                onChange={(e) => setEditForm((f) => ({ ...f, delivery_time: e.target.value as 'morning' | 'evening' }))}
                                className="px-3 py-1 border border-[var(--border-default)] rounded text-sm">
                                <option value="morning">朝刊</option>
                                <option value="evening">夕刊</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${n.delivery_time === 'morning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                {n.delivery_time === 'morning' ? '朝刊' : '夕刊'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {editingNewspaper === n.id ? (
                                <>
                                  <button
                                    onClick={() => updateNewspaperMutation.mutate({ id: n.id, data: editForm })}
                                    disabled={updateNewspaperMutation.isPending}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    {updateNewspaperMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                  </button>
                                  <button onClick={() => setEditingNewspaper(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { setEditingNewspaper(n.id); setEditForm({ name: n.name, code: n.code, delivery_time: n.delivery_time }); }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => { if (confirm(`「${n.name}」を削除しますか？`)) deleteNewspaperMutation.mutate(n.id); }}
                                    disabled={deleteNewspaperMutation.isPending}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {newspapers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
                            新聞種別がありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell size={24} className="text-[var(--color-primary-500)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">通知設定</h2>
              </div>

              <div className="bg-white border border-[var(--border-default)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">通知カテゴリ</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">
                        <Mail size={16} className="inline mr-1" />
                        メール
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">
                        <Bell size={16} className="inline mr-1" />
                        プッシュ
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">
                        <Smartphone size={16} className="inline mr-1" />
                        SMS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notification) => (
                      <tr key={notification.id} className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)]">
                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{notification.category}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleNotification(notification.id, 'email')}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notification.email ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              notification.email ? 'translate-x-6' : 'translate-x-0.5'
                            }`}></div>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleNotification(notification.id, 'push')}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notification.push ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              notification.push ? 'translate-x-6' : 'translate-x-0.5'
                            }`}></div>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleNotification(notification.id, 'sms')}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notification.sms ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              notification.sms ? 'translate-x-6' : 'translate-x-0.5'
                            }`}></div>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">通知受信者設定</h3>
                  <p className="text-sm text-blue-800 mb-2">通知は以下のメールアドレスに送信されます：</p>
                  <input
                    type="email"
                    defaultValue={storeInfo.email}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="notification@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Roles & Permissions Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} className="text-[var(--color-primary-500)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">ロール権限管理</h2>
              </div>

              {roles.map((role) => (
                <div key={role.id} className="bg-white border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--color-gray-50)] px-6 py-3 border-b border-[var(--border-default)]">
                    <h3 className="font-bold text-[var(--text-primary)]">{role.name}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border-default)]">
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">リソース</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">閲覧</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">作成</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">編集</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]">削除</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(role.permissions).map(([resource, perms]) => (
                          <tr key={resource} className="border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)]">
                            <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                              {resource === 'routes' && 'ルート管理'}
                              {resource === 'subscribers' && '購読者管理'}
                              {resource === 'deliverers' && '配達員管理'}
                              {resource === 'reports' && 'レポート'}
                              {resource === 'settings' && 'システム設定'}
                            </td>
                            {(['view', 'create', 'edit', 'delete'] as const).map((perm) => (
                              <td key={perm} className="px-6 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms[perm]}
                                  onChange={() => togglePermission(role.id, resource, perm)}
                                  className="w-4 h-4 text-[var(--color-primary-500)] border-gray-300 rounded focus:ring-[var(--color-primary-500)]"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Globe size={24} className="text-[var(--color-primary-500)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">システム設定</h2>
              </div>

              {/* Language & Timezone */}
              <div className="bg-white border border-[var(--border-default)] rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">地域・言語設定</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      <Globe size={14} className="inline mr-1" />
                      言語
                    </label>
                    <select
                      value={systemSettings.language}
                      onChange={(e) => {
                        setSystemSettings({ ...systemSettings, language: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                      <option value="vi">Tiếng Việt</option>
                      <option value="zh">中文</option>
                      <option value="ko">한국어</option>
                      <option value="ne">नेपाली</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      <Clock size={14} className="inline mr-1" />
                      タイムゾーン
                    </label>
                    <select
                      value={systemSettings.timezone}
                      onChange={(e) => {
                        setSystemSettings({ ...systemSettings, timezone: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    >
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dark Mode Settings */}
              <div className="bg-white border border-[var(--border-default)] rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">
                  <Moon size={18} className="inline mr-2" />
                  ダークモード設定
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">早朝配達時の自動ダークモード</p>
                    <p className="text-sm text-[var(--text-muted)]">配達員の視認性向上のため3:00-6:00に自動適用</p>
                  </div>
                  <button
                    onClick={() => {
                      setSystemSettings({ ...systemSettings, darkModeAuto: !systemSettings.darkModeAuto });
                      setHasChanges(true);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      systemSettings.darkModeAuto ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      systemSettings.darkModeAuto ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
                {systemSettings.darkModeAuto && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-default)]">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">開始時刻</label>
                      <input
                        type="time"
                        value={systemSettings.darkModeStart}
                        onChange={(e) => {
                          setSystemSettings({ ...systemSettings, darkModeStart: e.target.value });
                          setHasChanges(true);
                        }}
                        className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">終了時刻</label>
                      <input
                        type="time"
                        value={systemSettings.darkModeEnd}
                        onChange={(e) => {
                          setSystemSettings({ ...systemSettings, darkModeEnd: e.target.value });
                          setHasChanges(true);
                        }}
                        className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Data & Backup */}
              <div className="bg-white border border-[var(--border-default)] rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">
                  <Database size={18} className="inline mr-2" />
                  データ・バックアップ設定
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">データ保持期間（日）</label>
                  <input
                    type="number"
                    value={systemSettings.dataRetentionDays}
                    onChange={(e) => {
                      setSystemSettings({ ...systemSettings, dataRetentionDays: parseInt(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">自動バックアップ</p>
                    <p className="text-sm text-[var(--text-muted)]">毎日深夜2:00に自動バックアップを実行</p>
                  </div>
                  <button
                    onClick={() => {
                      setSystemSettings({ ...systemSettings, backupEnabled: !systemSettings.backupEnabled });
                      setHasChanges(true);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      systemSettings.backupEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      systemSettings.backupEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="bg-white border border-[var(--border-default)] rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">
                  <AlertTriangle size={18} className="inline mr-2" />
                  メンテナンスモード
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">メンテナンスモードを有効化</p>
                    <p className="text-sm text-[var(--text-muted)]">有効化すると配達員アプリの利用が制限されます</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('メンテナンスモードを変更しますか？')) {
                        setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode });
                        setHasChanges(true);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <div className="bg-white border border-[var(--border-default)] rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">
                  <Key size={18} className="inline mr-2" />
                  API設定
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Google Maps API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      defaultValue="AIzaSyD************************"
                      className="flex-1 px-4 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] font-mono text-sm"
                    />
                    <button className="px-4 py-2 text-sm font-medium text-[var(--color-primary-500)] border border-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-50)]">
                      表示
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
