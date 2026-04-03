import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { X, Phone, MapPin, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { deliveryService } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

export function SOS() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLabel, setGpsLabel] = useState('GPS取得中...');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const HOLD_MS = 3000;

  useEffect(() => {
    if (!navigator.geolocation) { setGpsLabel('GPS非対応'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLabel(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setGpsLabel('GPS取得失敗'),
      { timeout: 10000 }
    );
  }, []);

  const sosMutation = useMutation({
    mutationFn: () =>
      deliveryService.triggerSOS(
        coords?.lat ?? 0,
        coords?.lng ?? 0,
        'SOS送信（アプリより）'
      ),
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(extractApiError(err)),
  });

  const startPress = () => {
    if (sent || sosMutation.isPending) return;
    setPressing(true);
    setProgress(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / HOLD_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= HOLD_MS) {
        clearInterval(intervalRef.current!);
        setPressing(false);
        sosMutation.mutate();
      }
    }, 30);
  };

  const cancelPress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPressing(false);
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FEF2F2' }}>
      {/* Close */}
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full flex items-center justify-center"
          style={{ width: '40px', height: '40px', backgroundColor: 'white' }}
        >
          <X size={24} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {sent ? (
          <>
            <div
              className="rounded-full flex items-center justify-center mb-4"
              style={{ width: '120px', height: '120px', backgroundColor: 'var(--color-success-500)' }}
            >
              <span className="text-6xl text-white">✓</span>
            </div>
            <p className="font-bold mb-2" style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
              送信済み
            </p>
            <p className="text-center" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
              店舗に通知を送りました。<br />折り返し連絡があります。
            </p>
          </>
        ) : (
          <>
            {/* SOS button with progress ring */}
            <div className="relative">
              <svg width="200" height="200" className="absolute inset-0 -rotate-90">
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r="88" fill="none"
                  stroke="rgba(239,68,68,0.8)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  className="transition-all"
                  style={{ transitionDuration: pressing ? '30ms' : '200ms' }}
                />
              </svg>
              <button
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                disabled={sosMutation.isPending}
                className="relative rounded-full flex items-center justify-center font-bold select-none"
                style={{
                  width: '160px',
                  height: '160px',
                  margin: '20px',
                  backgroundColor: pressing ? '#B91C1C' : 'var(--color-danger-500)',
                  color: 'white',
                  fontSize: 'var(--text-3xl)',
                  transform: pressing ? 'scale(0.95)' : 'scale(1)',
                  transition: 'transform 0.1s, background-color 0.1s',
                }}
              >
                {sosMutation.isPending ? <Loader2 size={48} className="animate-spin" /> : 'SOS'}
              </button>
            </div>
            <p className="mt-6 text-center font-medium" style={{ fontSize: 'var(--text-base)', color: 'var(--color-danger-600)' }}>
              {pressing ? `送信中... ${Math.round(progress)}%` : '3秒長押しで緊急通報'}
            </p>
          </>
        )}

        {/* GPS Info */}
        <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
          <div className="flex items-center gap-2 mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <MapPin size={16} />
            <span>現在地: {gpsLabel}</span>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: 'var(--text-xs)', color: coords ? 'var(--color-success-500)' : 'var(--color-warning-500)' }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coords ? 'var(--color-success-500)' : 'var(--color-warning-500)' }} />
            <span>{coords ? 'GPS精度: 良好' : 'GPS取得中...'}</span>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="rounded-t-3xl p-6" style={{ backgroundColor: 'white' }}>
        <h3 className="font-semibold mb-4" style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
          緊急連絡先
        </h3>
        <div className="space-y-3">
          <a
            href="tel:110"
            className="w-full flex items-center justify-center gap-3 rounded-lg font-medium"
            style={{ height: '52px', backgroundColor: 'var(--color-primary-500)', color: 'white', fontSize: 'var(--text-base)', display: 'flex' }}
          >
            <Phone size={20} />
            110番通報
          </a>
          <a
            href="tel:119"
            className="w-full flex items-center justify-center gap-3 rounded-lg font-medium"
            style={{ height: '52px', backgroundColor: 'var(--color-danger-500)', color: 'white', fontSize: 'var(--text-base)', display: 'flex' }}
          >
            <Phone size={20} />
            119番通報
          </a>
        </div>
      </div>
    </div>
  );
}
