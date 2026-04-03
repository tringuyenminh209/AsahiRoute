interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border-default)]">
      <td className="p-4"><Skeleton className="w-4 h-4 rounded" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-20" />
      </td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Skeleton className="h-6 w-14 rounded-full" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonDelivererCard() {
  return (
    <div className="p-4 border border-[var(--border-default)] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full mb-2" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
