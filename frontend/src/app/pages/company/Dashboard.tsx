import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Store,
  Users,
  Truck,
  Newspaper,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { companyService, type CompanyDashboard } from '../../../services/company.service';

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--border-default)] animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-4 bg-gray-200 rounded w-16" />
      <div className="h-4 bg-gray-200 rounded w-12" />
      <div className="h-4 bg-gray-200 rounded w-12" />
      <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bgColor: string;
  iconColor: string;
}

function KpiCard({ icon, label, value, bgColor, iconColor }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[var(--border-default)] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">{value}</div>
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading, error } = useQuery<CompanyDashboard>({
    queryKey: ['company-dashboard'],
    queryFn: () => companyService.getDashboard(),
    refetchInterval: 60_000,
  });

  if (error) {
    toast.error('ダッシュボードの取得に失敗しました');
  }

  const kpiCards: KpiCardProps[] = [
    {
      icon: <Store size={20} />,
      label: '店舗数',
      value: data?.total_shops ?? '--',
      bgColor: '#DBEAFE',
      iconColor: '#2563EB',
    },
    {
      icon: <Users size={20} />,
      label: '管理者数',
      value: data?.total_admins ?? '--',
      bgColor: '#DCFCE7',
      iconColor: '#16A34A',
    },
    {
      icon: <Truck size={20} />,
      label: '配達員数',
      value: data?.total_deliverers ?? '--',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      icon: <Newspaper size={20} />,
      label: '購読者数',
      value: data?.total_subscribers ?? '--',
      bgColor: '#F3E8FF',
      iconColor: '#7C3AED',
    },
    {
      icon: <CheckCircle size={20} />,
      label: '本日の配達',
      value: data?.today_deliveries ?? '--',
      bgColor: '#FEE2E2',
      iconColor: '#CC0000',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">ダッシュボード</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">傘下店舗の運営状況</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 shadow-sm border border-[var(--border-default)] animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))
          : kpiCards.map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
      </div>

      {/* Shop List */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border-default)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">店舗一覧</h2>
          <Link
            to="/company/shops"
            className="text-sm font-medium flex items-center gap-1 hover:underline"
            style={{ color: '#0F4C35' }}
          >
            すべて見る <ChevronRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-[var(--color-gray-50)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              <span>店舗名</span>
              <span className="text-right w-20">コード</span>
              <span className="text-right w-20">管理者数</span>
              <span className="text-right w-20">区域数</span>
              <span className="text-right w-16" />
            </div>

            {data?.shops.length === 0 && (
              <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                店舗データがありません
              </div>
            )}

            {(data?.shops ?? []).map((shop) => (
              <div
                key={shop.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 border-b border-[var(--border-default)] last:border-0 items-center hover:bg-[var(--color-gray-50)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#0F4C35' }}
                  >
                    {shop.name.charAt(0)}
                  </div>
                  <span className="font-medium text-[var(--text-primary)] text-sm">{shop.name}</span>
                </div>
                <span className="text-right w-20 text-sm text-[var(--text-secondary)] font-mono">{shop.code}</span>
                <span className="text-right w-20 text-sm text-[var(--text-primary)] font-semibold">{shop.users_count}</span>
                <span className="text-right w-20 text-sm text-[var(--text-primary)] font-semibold">{shop.areas_count}</span>
                <div className="text-right w-16">
                  <Link
                    to={`/company/shops`}
                    className="text-xs px-3 py-1 rounded-lg font-medium text-white transition-colors hover:opacity-80"
                    style={{ backgroundColor: '#0F4C35' }}
                  >
                    詳細
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
