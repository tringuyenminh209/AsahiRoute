import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { routeService } from '../../../services/admin.service';

interface PrintPoint {
  sequence_order: number;
  customer_code: string;
  name: string;
  address: string;
  delivery_note: string | null;
  is_skipped: boolean;
  newspapers: { name: string; quantity: number }[];
}

interface PrintData {
  route_name: string;
  area_name: string;
  deliverer: string | null;
  delivery_time: 'morning' | 'evening';
  printed_at: string;
  points: PrintPoint[];
}

export function RoutePrint() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<PrintData>({
    queryKey: ['route-print', id],
    queryFn: () => routeService.getPrint(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">ルートデータを取得できませんでした</p>
        <Link to={`/admin/routes/${id}`} className="text-[var(--color-primary-500)] hover:underline text-sm">
          ← ルート編集に戻る
        </Link>
      </div>
    );
  }

  const activePoints = data.points.filter((p) => !p.is_skipped);
  const skippedPoints = data.points.filter((p) => p.is_skipped);
  const deliveryLabel = data.delivery_time === 'morning' ? '朝刊' : '夕刊';
  const printedAt = new Date(data.printed_at).toLocaleString('ja-JP');

  return (
    <div>
      {/* Screen-only toolbar (hidden on print) */}
      <div className="print:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-[var(--border-default)]">
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/routes/${id}`}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={20} />
            ルート編集
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            印刷プレビュー — {data.route_name}
          </h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)]"
        >
          <Printer size={16} />
          PDF出力 / 印刷
        </button>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4">
        {/* Header */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{data.route_name}</h1>
              <p className="text-gray-600 mt-1">
                {data.area_name} / {deliveryLabel} / 担当: {data.deliverer ?? '未割当'}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>印刷日時: {printedAt}</p>
              <p>配達件数: {activePoints.length}件</p>
              {skippedPoints.length > 0 && (
                <p className="text-gray-400">留守止め: {skippedPoints.length}件</p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery points table */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-center w-10">No.</th>
              <th className="border border-gray-300 px-3 py-2 text-center w-24">顧客コード</th>
              <th className="border border-gray-300 px-3 py-2 text-left">氏名</th>
              <th className="border border-gray-300 px-3 py-2 text-left">住所</th>
              <th className="border border-gray-300 px-3 py-2 text-left">新聞</th>
              <th className="border border-gray-300 px-3 py-2 text-left">備考</th>
              <th className="border border-gray-300 px-3 py-2 text-center w-12">確認</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((point) => (
              <tr
                key={point.sequence_order}
                className={point.is_skipped ? 'bg-gray-50 text-gray-400' : 'hover:bg-yellow-50'}
              >
                <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                  {point.is_skipped ? (
                    <span className="text-xs text-gray-400">留</span>
                  ) : (
                    point.sequence_order
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono text-xs">
                  {point.customer_code}
                </td>
                <td className={`border border-gray-300 px-3 py-2 font-medium ${point.is_skipped ? 'line-through' : ''}`}>
                  {point.name}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-xs">{point.address}</td>
                <td className="border border-gray-300 px-3 py-2 text-xs">
                  {point.newspapers.map((n) => (
                    <span key={n.name} className="block">{n.name} ×{n.quantity}</span>
                  ))}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-xs text-orange-600">
                  {point.delivery_note ?? ''}
                </td>
                <td className="border border-gray-300 px-3 py-2" />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
          <span>AsahiRoute — 配達順路帳</span>
          <span>{data.route_name} / 全{data.points.length}件</span>
        </div>
      </div>
    </div>
  );
}
