import { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, X } from "lucide-react";

export function SOSButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 flex items-center justify-center rounded-full text-white font-bold shadow-lg"
        style={{
          bottom: '96px',
          right: '16px',
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--color-danger-500)',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          transition: 'var(--transition-fast)',
        }}
        onMouseDown={(e)  => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e)    => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        SOS
      </button>

      {/* Confirmation dialog */}
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/50 px-4 pb-8">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ backgroundColor: '#FEF2F2', borderBottom: '1px solid #FECACA' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={22} style={{ color: 'var(--color-danger-500)' }} />
                <span className="font-bold text-base" style={{ color: '#991B1B' }}>SOS送信</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-red-100"
              >
                <X size={18} style={{ color: '#991B1B' }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              <p className="text-center font-medium mb-1" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                SOS緊急通報を送信しますか？
              </p>
              <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                店舗管理者に現在地と状況が通知されます
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl border font-medium text-sm"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              >
                キャンセル
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/mobile/sos'); }}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-danger-500)' }}
              >
                <AlertTriangle size={16} />
                SOS送信
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
