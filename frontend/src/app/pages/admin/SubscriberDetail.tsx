import { ArrowLeft, Edit, UserX, MoreVertical } from 'lucide-react';
import { useParams, Link } from 'react-router';

export function SubscriberDetail() {
  const { id } = useParams();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/subscribers"
            className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">田中 太郎 様</h1>
              <span className="px-3 py-1 text-sm font-medium bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded-full">
                🟢 有効
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              購読者一覧 / 詳細 (ID: {id})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2">
            <Edit size={16} />
            編集
          </button>
          <button className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2">
            <UserX size={16} />
            留守止め登録
          </button>
          <button className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-12 border border-[var(--border-default)] text-center">
        <p className="text-[var(--text-secondary)]">購読者詳細画面（実装予定）</p>
      </div>
    </div>
  );
}
