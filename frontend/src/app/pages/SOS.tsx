import { useState } from "react";
import { useNavigate } from "react-router";
import { X, Phone, MapPin } from "lucide-react";

export function SOS() {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLongPress = () => {
    setTimeout(() => {
      setSent(true);
    }, 3000);
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#FEF2F2' }}
    >
      {/* Close Button */}
      <div className="p-4">
        <button 
          onClick={() => navigate(-1)}
          className="rounded-full flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'white',
          }}
        >
          <X size={24} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      {/* Main SOS Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {!sent ? (
          <>
            <button
              onMouseDown={handleLongPress}
              onMouseUp={() => setPressed(false)}
              onMouseLeave={() => setPressed(false)}
              className="rounded-full flex items-center justify-center font-bold transition-all"
              style={{
                width: '160px',
                height: '160px',
                backgroundColor: 'var(--color-danger-500)',
                color: 'white',
                fontSize: 'var(--text-3xl)',
                boxShadow: '0 0 0 16px rgba(239, 68, 68, 0.2)',
                transform: pressed ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              SOS
            </button>
            <p 
              className="mt-6 text-center font-medium"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-danger-600)',
              }}
            >
              3秒長押しで緊急通報
            </p>
          </>
        ) : (
          <>
            <div 
              className="rounded-full flex items-center justify-center mb-4"
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--color-success-500)',
              }}
            >
              <span className="text-6xl">✓</span>
            </div>
            <p 
              className="font-bold mb-2"
              style={{
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-primary)',
              }}
            >
              送信済み
            </p>
            <p 
              className="text-center"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
              }}
            >
              店舗に通知を送りました。<br />
              折り返し連絡があります。
            </p>
          </>
        )}

        {/* Location Info */}
        <div 
          className="mt-8 p-4 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        >
          <div 
            className="flex items-center gap-2 mb-2"
            style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--text-secondary)' 
            }}
          >
            <MapPin size={16} />
            <span>現在地: 山口県下関市○○町付近</span>
          </div>
          <div 
            className="flex items-center gap-2"
            style={{ 
              fontSize: 'var(--text-xs)', 
              color: 'var(--color-success-500)' 
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-success-500)' }}
            />
            <span>GPS精度: 良好</span>
          </div>
        </div>
      </div>

      {/* Emergency Contact Buttons */}
      <div 
        className="rounded-t-3xl p-6"
        style={{ backgroundColor: 'white' }}
      >
        <h3 
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-primary)',
          }}
        >
          緊急連絡先
        </h3>
        
        <button
          className="w-full flex items-center justify-center gap-3 rounded-lg font-medium mb-3"
          style={{
            height: '56px',
            backgroundColor: 'var(--color-primary-500)',
            color: 'white',
            fontSize: 'var(--text-base)',
          }}
        >
          <Phone size={20} />
          店舗に電話
        </button>

        <button
          className="w-full flex items-center justify-center gap-3 rounded-lg font-medium mb-3"
          style={{
            height: '56px',
            backgroundColor: 'var(--color-danger-500)',
            color: 'white',
            fontSize: 'var(--text-base)',
          }}
        >
          <Phone size={20} />
          110番通報
        </button>

        <button
          className="w-full flex items-center justify-center gap-3 rounded-lg font-medium"
          style={{
            height: '56px',
            backgroundColor: 'var(--color-danger-500)',
            color: 'white',
            fontSize: 'var(--text-base)',
          }}
        >
          <Phone size={20} />
          119番通報
        </button>
      </div>
    </div>
  );
}
