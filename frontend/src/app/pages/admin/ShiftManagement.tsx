import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2, X, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shiftService, userService, routeService, Shift } from "../../../services/admin.service";

// ── Helpers ──────────────────────────────────────────────────────────────────
const SHIFT_TYPE_LABEL: Record<string, string> = { morning: '🌅 朝刊', evening: '🌙 夕刊', both: '☀️ 両方' };
const STATUS_STYLE: Record<Shift['status'], { bg: string; color: string; label: string }> = {
  scheduled:  { bg: '#DBEAFE', color: '#1D4ED8', label: '予定' },
  confirmed:  { bg: '#DCFCE7', color: '#15803D', label: '確定' },
  completed:  { bg: '#F1F5F9', color: '#475569', label: '完了' },
  cancelled:  { bg: '#FEE2E2', color: '#DC2626', label: '取消' },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}

// ── Shift chip in calendar cell ───────────────────────────────────────────────
function ShiftChip({ shift, onClick }: { shift: Shift; onClick: () => void }) {
  const st = STATUS_STYLE[shift.status];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full text-left rounded px-1 py-0.5 mb-0.5 truncate"
      style={{ background: st.bg, color: st.color, fontSize: '10px', lineHeight: 1.4 }}
      title={`${shift.user?.name} — ${SHIFT_TYPE_LABEL[shift.shift_type]}`}
    >
      {shift.user?.name?.split(' ')[0] ?? '?'}
    </button>
  );
}

// ── Create/Edit Modal ─────────────────────────────────────────────────────────
interface ShiftFormData {
  user_id: number | '';
  route_id: number | '';
  shift_date: string;
  shift_type: string;
  status: Shift['status'];
}

function ShiftModal({
  initial,
  onClose,
  onSave,
  isPending,
}: {
  initial: Partial<ShiftFormData>;
  onClose: () => void;
  onSave: (data: ShiftFormData) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<ShiftFormData>({
    user_id: initial.user_id ?? '',
    route_id: initial.route_id ?? '',
    shift_date: initial.shift_date ?? '',
    shift_type: initial.shift_type ?? 'morning',
    status: initial.status ?? 'scheduled',
  });

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => userService.getList() });
  const { data: routesData } = useQuery({ queryKey: ['admin-routes'], queryFn: () => routeService.getList() });
  const routes = routesData?.data ?? [];

  const deliverers = users.filter((u: { role: string }) => u.role === 'deliverer' || u.role === 'admin');

  const valid = form.user_id !== '' && form.route_id !== '' && !!form.shift_date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {initial.user_id ? 'シフト編集' : 'シフト追加'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>日付</label>
            <input
              type="date"
              value={form.shift_date}
              onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border-default)' }}
            />
          </div>

          {/* Deliverer */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>担当者</label>
            <select
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) || '' })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">選択してください</option>
              {deliverers.map((u: { id: number; name: string }) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Route */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>ルート</label>
            <select
              value={form.route_id}
              onChange={(e) => setForm({ ...form, route_id: Number(e.target.value) || '' })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <option value="">選択してください</option>
              {routes.map((r: { id: number; name: string }) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>種別</label>
            <div className="flex gap-2">
              {(['morning', 'evening', 'both'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, shift_type: t })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                  style={{
                    backgroundColor: form.shift_type === t ? '#CC0000' : 'white',
                    color: form.shift_type === t ? 'white' : 'var(--text-primary)',
                    borderColor: form.shift_type === t ? '#CC0000' : 'var(--border-default)',
                  }}
                >
                  {SHIFT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Status (edit only) */}
          {initial.user_id && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>ステータス</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Shift['status'] })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {Object.entries(STATUS_STYLE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border font-medium text-sm"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          >
            キャンセル
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid || isPending}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#CC0000' }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Side panel: shifts for a selected day ────────────────────────────────────
function DayPanel({
  dateStr,
  shifts,
  onAdd,
  onEdit,
  onDelete,
  onClose,
}: {
  dateStr: string;
  shifts: Shift[];
  onAdd: (date: string) => void;
  onEdit: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
  onClose: () => void;
}) {
  const d = new Date(dateStr + 'T00:00:00');
  const label = `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;

  return (
    <div className="w-80 border-l bg-white flex flex-col" style={{ borderColor: 'var(--border-default)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onAdd(dateStr)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#CC0000' }}
          >
            <Plus size={14} /> 追加
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {shifts.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            シフトなし
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shifts.map((s) => {
              const st = STATUS_STYLE[s.status];
              return (
                <div
                  key={s.id}
                  className="rounded-xl p-3 border"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.user?.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {s.route?.name} / {s.route?.area?.name}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(s)} className="p-1 rounded hover:bg-gray-100">
                        <Pencil size={14} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button onClick={() => onDelete(s)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 size={14} style={{ color: '#DC2626' }} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F3F4F6', color: 'var(--text-secondary)' }}>
                      {SHIFT_TYPE_LABEL[s.shift_type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ShiftManagement() {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: 'create'; date: string } | { mode: 'edit'; shift: Shift } | null>(null);

  const { data: calData, isLoading } = useQuery({
    queryKey: ['shifts-calendar', year, month],
    queryFn: () => shiftService.getCalendar(year, month),
  });

  const calendar: Record<string, Shift[]> = calData?.calendar ?? {};

  const createMutation = useMutation({
    mutationFn: shiftService.createShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts-calendar'] });
      toast.success('シフトを作成しました');
      setModal(null);
    },
    onError: () => toast.error('作成に失敗しました'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof shiftService.updateShift>[1] }) =>
      shiftService.updateShift(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts-calendar'] });
      toast.success('シフトを更新しました');
      setModal(null);
    },
    onError: () => toast.error('更新に失敗しました'),
  });

  const deleteMutation = useMutation({
    mutationFn: shiftService.deleteShift,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts-calendar'] });
      toast.success('シフトをキャンセルしました');
    },
    onError: () => toast.error('削除に失敗しました'),
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  // Build calendar grid
  const daysInMonth  = getDaysInMonth(year, month);
  const firstDayDow  = getFirstDayOfWeek(year, month); // 0=Sun
  const totalCells   = Math.ceil((firstDayDow + daysInMonth) / 7) * 7;
  const todayStr     = new Date().toISOString().split('T')[0];

  const cells = useMemo(() => {
    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - firstDayDow + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return { dayNum, dateStr, shifts: calendar[dateStr] ?? [] };
    });
  }, [totalCells, firstDayDow, daysInMonth, year, month, calendar]);

  const selectedShifts = selectedDate ? (calendar[selectedDate] ?? []) : [];

  const handleSave = (form: { user_id: number | ''; route_id: number | ''; shift_date: string; shift_type: string; status: Shift['status'] }) => {
    if (form.user_id === '' || form.route_id === '') return;
    if (modal?.mode === 'edit') {
      updateMutation.mutate({ id: modal.shift.id, data: { shift_date: form.shift_date, shift_type: form.shift_type as Shift['shift_type'], status: form.status } });
    } else {
      createMutation.mutate({ user_id: form.user_id as number, route_id: form.route_id as number, shift_date: form.shift_date, shift_type: form.shift_type });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
            <Calendar size={22} style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>シフト管理</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>月別カレンダー</p>
          </div>
        </div>
        <button
          onClick={() => setModal({ mode: 'create', date: todayStr })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
          style={{ backgroundColor: '#CC0000' }}
        >
          <Plus size={16} /> シフト追加
        </button>
      </div>

      {/* Month Picker */}
      <div className="px-6 py-3 bg-white border-b flex items-center gap-4 flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <span className="font-bold text-lg min-w-[8rem] text-center" style={{ color: 'var(--text-primary)' }}>
          {year}年{month}月
        </span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100">
          <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs">
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: v.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{v.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Calendar + Side Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={28} className="animate-spin" style={{ color: '#CC0000' }} />
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-default)' }}>
                {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-bold"
                    style={{ color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'var(--text-secondary)' }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="border-b border-r h-24 bg-gray-50" style={{ borderColor: 'var(--border-default)' }} />;
                  }
                  const { dayNum, dateStr, shifts } = cell;
                  const isToday    = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const dow        = (firstDayDow + dayNum - 1) % 7;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                      className="border-b border-r h-24 p-1 cursor-pointer hover:bg-blue-50 transition-colors overflow-hidden"
                      style={{
                        borderColor: 'var(--border-default)',
                        backgroundColor: isSelected ? '#EFF6FF' : undefined,
                      }}
                    >
                      <div className="flex justify-end mb-0.5">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full`}
                          style={{
                            backgroundColor: isToday ? '#CC0000' : 'transparent',
                            color: isToday ? 'white' : dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : 'var(--text-primary)',
                          }}
                        >
                          {dayNum}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        {shifts.slice(0, 3).map((s) => (
                          <ShiftChip
                            key={s.id}
                            shift={s}
                            onClick={() => { setSelectedDate(dateStr); setModal({ mode: 'edit', shift: s }); }}
                          />
                        ))}
                        {shifts.length > 3 && (
                          <p className="text-center" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            +{shifts.length - 3}件
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        {selectedDate && (
          <DayPanel
            dateStr={selectedDate}
            shifts={selectedShifts}
            onAdd={(date) => setModal({ mode: 'create', date })}
            onEdit={(shift) => setModal({ mode: 'edit', shift })}
            onDelete={(shift) => {
              if (window.confirm(`${shift.user?.name}のシフトをキャンセルしますか？`)) {
                deleteMutation.mutate(shift.id);
              }
            }}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <ShiftModal
          initial={
            modal.mode === 'edit'
              ? { user_id: modal.shift.user_id, route_id: modal.shift.route_id, shift_date: modal.shift.shift_date, shift_type: modal.shift.shift_type, status: modal.shift.status }
              : { shift_date: modal.mode === 'create' ? modal.date : todayStr }
          }
          onClose={() => setModal(null)}
          onSave={handleSave}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
