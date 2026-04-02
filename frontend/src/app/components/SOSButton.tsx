import { useNavigate } from "react-router";

export function SOSButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/mobile/sos")}
      className="fixed z-40 flex items-center justify-center rounded-full text-white font-bold shadow-lg"
      style={{
        bottom: '96px', // 64px (bottom nav) + 32px spacing
        right: '16px',
        width: '56px',
        height: '56px',
        backgroundColor: 'var(--color-danger-500)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
        transition: 'var(--transition-fast)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      SOS
    </button>
  );
}