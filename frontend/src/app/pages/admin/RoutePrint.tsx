import { Printer } from 'lucide-react';
import { useParams } from 'react-router';

export function RoutePrint() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">🖨️ 印刷順路帳</h1>
        <button className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] flex items-center gap-2">
          <Printer size={16} />
          PDF出力
        </button>
      </div>
      <div className="bg-white rounded-xl p-12 border border-[var(--border-default)] text-center">
        <p className="text-[var(--text-secondary)]">
          印刷順路帳プレビュー（実装予定） - Route ID: {id}
        </p>
      </div>
    </div>
  );
}
