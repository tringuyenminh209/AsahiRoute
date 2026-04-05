import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, Clock, Navigation, GripVertical } from 'lucide-react';

type RoutePoint = {
  id: number;
  lat: number;
  lng: number;
  name: string;
  address: string;
  code: string;
  newspaper: string;
  copies: number;
  isNew: boolean;
  isSuspended: boolean;
  notes: string;
  deliveryTime: string;
  distance: string;
};

interface DraggablePointProps {
  point: RoutePoint;
  index: number;
  selectedPoint: number | null;
  setSelectedPoint: (id: number) => void;
}

export function DraggableRoutePoint({ point, index, selectedPoint, setSelectedPoint }: DraggablePointProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: point.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 mb-2 rounded-lg border hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        selectedPoint === point.id
          ? 'border-[var(--color-primary-500)] bg-blue-50 shadow-md'
          : point.isNew
          ? 'border-l-4 border-l-[var(--color-warning-500)] bg-[var(--color-warning-50)]'
          : point.isSuspended
          ? 'border-l-4 border-l-[var(--text-muted)] bg-[var(--color-gray-50)] opacity-60'
          : 'border-[var(--border-default)] bg-white'
      }`}
      onClick={() => setSelectedPoint(point.id)}
    >
      <div className="flex items-start gap-3">
        <GripVertical
          size={20}
          className="text-[var(--text-secondary)] cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5"
          {...attributes}
          {...listeners}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[var(--text-primary)]">#{index + 1}</span>
            <span className="font-medium text-[var(--text-primary)]">{point.name}</span>
            {point.isNew && (
              <span className="px-2 py-0.5 text-xs font-bold bg-[var(--color-warning-500)] text-white rounded">
                NEW
              </span>
            )}
            {point.isSuspended && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-400 text-white rounded">
                留守
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mb-1">
            {point.code} | {point.address}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            {point.newspaper} × {point.copies}部
          </div>
          {point.notes && (
            <div className="text-xs text-orange-600 mt-1 italic">
              📝 {point.notes}
            </div>
          )}
          <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              {point.deliveryTime}
            </div>
            <div className="flex items-center gap-1">
              <Navigation size={12} />
              {point.distance}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            className="p-1 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded"
            title="編集"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Edit size={14} />
          </button>
          <button
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="削除"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
