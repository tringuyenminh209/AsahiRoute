import { useState, useMemo } from "react";
import { CircleSlash, Star, Route, Info, Bell, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deliveryService } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  suspension: CircleSlash,
  new_insertion: Star,
  route_update: Route,
  system: Info,
};

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  suspension: { bg: 'var(--color-gray-100)', color: 'var(--color-gray-500)' },
  new_insertion: { bg: '#FEF3C7', color: 'var(--color-warning-500)' },
  route_update: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-500)' },
  system: { bg: '#DBEAFE', color: '#3B82F6' },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  return `${Math.floor(hr / 24)}日前`;
}

export function Notifications() {
  const [selectedTab, setSelectedTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => deliveryService.getNotifications(false, 50),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => deliveryService.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(extractApiError(err)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => deliveryService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('すべて既読にしました');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const counts = useMemo(() => ({
    all: notifications.length,
    suspension: notifications.filter((n) => n.type === 'suspension').length,
    new_insertion: notifications.filter((n) => n.type === 'new_insertion').length,
    route_update: notifications.filter((n) => n.type === 'route_update').length,
    system: notifications.filter((n) => n.type === 'system').length,
  }), [notifications]);

  const tabs = [
    { id: 'all', label: '全て', count: counts.all },
    { id: 'suspension', label: '留守止め', count: counts.suspension },
    { id: 'new_insertion', label: '新規', count: counts.new_insertion },
    { id: 'route_update', label: 'ルート変更', count: counts.route_update },
    { id: 'system', label: 'システム', count: counts.system },
  ];

  const filtered = useMemo(
    () => selectedTab === 'all' ? notifications : notifications.filter((n) => n.type === selectedTab),
    [notifications, selectedTab]
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{ height: '48px', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: 'var(--text-primary)' }} />
          <span className="font-semibold" style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            通知
          </span>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
              style={{ backgroundColor: 'var(--color-danger-500)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending || unreadCount === 0}
          className="disabled:opacity-40"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-500)' }}
        >
          {markAllMutation.isPending ? '処理中...' : 'すべて既読にする'}
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="overflow-x-auto bg-white border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className="px-4 py-3 whitespace-nowrap relative"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: selectedTab === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                color: selectedTab === tab.id ? 'var(--color-primary-500)' : 'var(--text-secondary)',
              }}
            >
              {tab.label}({tab.count})
              {selectedTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0" style={{ height: '2px', backgroundColor: 'var(--color-primary-500)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-gray-100)' }}>
            <Bell size={28} style={{ color: 'var(--color-gray-400)' }} />
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>通知はありません</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>変更があるとここに表示されます</p>
        </div>
      ) : (
        <div>
          {filtered.map((n) => {
            const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.system;
            const Icon = TYPE_ICON[n.type] ?? Info;
            return (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) markReadMutation.mutate(n.id); }}
                className="w-full flex gap-3 p-4 border-b text-left"
                style={{
                  borderColor: 'var(--color-gray-100)',
                  backgroundColor: !n.is_read ? 'var(--color-primary-50)' : 'white',
                }}
              >
                <div
                  className="flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: '36px', height: '36px', backgroundColor: style.bg }}
                >
                  <Icon size={16} style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold mb-1" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                    {n.title}
                  </p>
                  <p className="mb-1 truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {n.body}
                  </p>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                {!n.is_read && (
                  <div
                    className="flex-shrink-0 rounded-full mt-2"
                    style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary-500)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
