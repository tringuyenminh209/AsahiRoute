import { ArrowLeft, Save, Undo, Redo } from 'lucide-react';
import { useParams, Link } from 'react-router';

export function RouteEdit() {
  const { id } = useParams();

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="h-14 px-6 bg-white border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/routes"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={20} />
            ルート管理
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            A区域 朝刊ルート 編集
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] rounded-lg">
            <Undo size={20} />
          </button>
          <button className="p-2 text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] rounded-lg">
            <Redo size={20} />
          </button>
          <button className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] flex items-center gap-2">
            <Save size={16} />
            保存
          </button>
        </div>
      </div>

      <div className="p-12 text-center">
        <p className="text-[var(--text-secondary)]">
          ルート編集画面（実装予定） - Route ID: {id}
        </p>
      </div>
    </div>
  );
}
