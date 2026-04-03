import { useState } from 'react';
import { ArrowLeft, Edit, UserX, Save, X, Plus, Trash2, Loader2, MapPin, Phone, Mail, Calendar, Newspaper, FileText } from 'lucide-react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subscriberService, suspensionService } from '../../../services/admin.service';
import { extractApiError } from '../../../lib/api';

export function SubscriberDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuspensionForm, setShowSuspensionForm] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [suspensionForm, setSuspensionForm] = useState({ start_date: '', end_date: '', reason: '' });

  const { data: subscriber, isLoading, error } = useQuery({
    queryKey: ['subscriber', id],
    queryFn: () => subscriberService.getById(Number(id)),
    enabled: !!id,
  });

  const { data: suspensionsResult } = useQuery({
    queryKey: ['suspensions', { subscriber_id: id }],
    queryFn: () => suspensionService.getList({ page: 1 }),
    enabled: !!id,
  });
  const suspensions = (suspensionsResult?.data ?? []).filter(
    (s: any) => String(s.subscriber_id) === String(id)
  );

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      subscriberService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriber', id] });
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      setIsEditing(false);
      toast.success('保存しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const addSuspensionMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => suspensionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      setShowSuspensionForm(false);
      setSuspensionForm({ start_date: '', end_date: '', reason: '' });
      toast.success('留守止めを登録しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const cancelSuspensionMutation = useMutation({
    mutationFn: (suspId: number) => suspensionService.cancel(suspId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      toast.success('留守止めを解除しました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleEditStart = () => {
    if (!subscriber) return;
    setEditForm({
      name: subscriber.name ?? '',
      address: subscriber.address ?? '',
      address_detail: subscriber.address_detail ?? '',
      phone: subscriber.phone ?? '',
      delivery_note: subscriber.delivery_note ?? '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  const handleAddSuspension = () => {
    if (!suspensionForm.start_date || !suspensionForm.end_date) {
      toast.error('開始日と終了日を入力してください');
      return;
    }
    addSuspensionMutation.mutate({
      subscriber_id: Number(id),
      start_date: suspensionForm.start_date,
      end_date: suspensionForm.end_date,
      reason: suspensionForm.reason || null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  if (error || !subscriber) {
    return (
      <div className="p-6">
        <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200">
          <p className="text-red-600 font-medium">購読者が見つかりません (ID: {id})</p>
          <Link to="/admin/subscribers" className="mt-4 inline-block text-sm text-[var(--color-primary-600)] hover:underline">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel = subscriber.is_suspended ? '留守止め中' : '有効';
  const statusColor = subscriber.is_suspended ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/subscribers"
            className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{subscriber.name}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              顧客コード: {subscriber.customer_code} / ID: {id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
              >
                <X size={16} />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                保存
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEditStart}
                className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
              >
                <Edit size={16} />
                編集
              </button>
              <button
                onClick={() => setShowSuspensionForm(true)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2"
              >
                <UserX size={16} />
                留守止め登録
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 border border-[var(--border-default)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">基本情報</h2>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">お名前</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">住所</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">住所詳細</label>
                    <input
                      type="text"
                      value={editForm.address_detail}
                      onChange={(e) => setEditForm((f) => ({ ...f, address_detail: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      placeholder="マンション名・部屋番号など"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">電話番号</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">配達メモ</label>
                    <textarea
                      value={editForm.delivery_note}
                      onChange={(e) => setEditForm((f) => ({ ...f, delivery_note: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      placeholder="玄関右側のポストに投函など"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[var(--text-secondary)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{subscriber.address}</p>
                      {subscriber.address_detail && (
                        <p className="text-xs text-[var(--text-secondary)]">{subscriber.address_detail}</p>
                      )}
                    </div>
                  </div>
                  {subscriber.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-[var(--text-secondary)] shrink-0" />
                      <p className="text-sm text-[var(--text-primary)]">{subscriber.phone}</p>
                    </div>
                  )}
                  {subscriber.delivery_note && (
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="text-[var(--text-secondary)] mt-0.5 shrink-0" />
                      <p className="text-sm text-[var(--text-primary)]">{subscriber.delivery_note}</p>
                    </div>
                  )}
                  {subscriber.lat && subscriber.lng && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-green-500 shrink-0" />
                      <p className="text-xs text-[var(--text-secondary)]">GPS: {subscriber.lat}, {subscriber.lng}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Newspapers */}
          <div className="bg-white rounded-xl p-6 border border-[var(--border-default)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Newspaper size={18} />
              購読新聞
            </h2>
            {(subscriber.newspapers ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">新聞情報なし</p>
            ) : (
              <div className="space-y-3">
                {(subscriber.newspapers ?? []).map((np: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-gray-50)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{np.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{np.delivery_time}</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{np.quantity}部</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suspension History */}
          <div className="bg-white rounded-xl p-6 border border-[var(--border-default)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar size={18} />
                留守止め履歴
              </h2>
              <button
                onClick={() => setShowSuspensionForm(!showSuspensionForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-lg"
              >
                <Plus size={14} />
                新規登録
              </button>
            </div>

            {showSuspensionForm && (
              <div className="mb-4 p-4 bg-[var(--color-gray-50)] rounded-lg border border-[var(--border-default)] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">開始日</label>
                    <input
                      type="date"
                      value={suspensionForm.start_date}
                      onChange={(e) => setSuspensionForm((f) => ({ ...f, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">終了日</label>
                    <input
                      type="date"
                      value={suspensionForm.end_date}
                      onChange={(e) => setSuspensionForm((f) => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">理由（任意）</label>
                  <input
                    type="text"
                    value={suspensionForm.reason}
                    onChange={(e) => setSuspensionForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="旅行、入院など"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSuspensionForm(false)}
                    className="px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-100)]"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAddSuspension}
                    disabled={addSuspensionMutation.isPending}
                    className="px-3 py-1.5 text-sm text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-lg disabled:opacity-50 flex items-center gap-1"
                  >
                    {addSuspensionMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    登録
                  </button>
                </div>
              </div>
            )}

            {suspensions.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-2">履歴なし</p>
            ) : (
              <div className="space-y-3">
                {suspensions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-[var(--border-default)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {s.start_date} 〜 {s.end_date}
                      </p>
                      {s.reason && (
                        <p className="text-xs text-[var(--text-secondary)]">{s.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        s.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                        s.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {s.status === 'active' ? '留守中' : s.status === 'upcoming' ? '予定' : '終了'}
                      </span>
                      {(s.status === 'active' || s.status === 'upcoming') && (
                        <button
                          onClick={() => cancelSuspensionMutation.mutate(s.id)}
                          disabled={cancelSuspensionMutation.isPending}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="解除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Area & Route Info */}
          <div className="bg-white rounded-xl p-6 border border-[var(--border-default)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">区域・ルート</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">区域</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {subscriber.area?.name ?? '--'}
                </span>
              </div>
              {subscriber.route_point?.route && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">ルート</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {subscriber.route_point.route.name}
                  </span>
                </div>
              )}
              {subscriber.route_point?.sequence_order && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">配達順</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {subscriber.route_point.sequence_order}番
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl p-6 border border-[var(--border-default)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">アカウント情報</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">登録日</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {subscriber.created_at?.split('T')[0] ?? '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">最終更新</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {subscriber.updated_at?.split('T')[0] ?? '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-[var(--border-default)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">クイック操作</h2>
            <div className="space-y-2">
              {subscriber.phone && (
                <a
                  href={`tel:${subscriber.phone}`}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--color-gray-50)] hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                >
                  <Phone size={16} className="text-[var(--color-primary-500)]" />
                  電話をかける
                </a>
              )}
              <button
                onClick={() => setShowSuspensionForm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--color-gray-50)] hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
              >
                <UserX size={16} className="text-yellow-500" />
                留守止め登録
              </button>
              <Link
                to={`/admin/subscribers/${id}/edit`}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--color-gray-50)] hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
              >
                <Edit size={16} className="text-blue-500" />
                詳細編集
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
