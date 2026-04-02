import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Phone, MapPin, Volume2, CheckCircle2 } from "lucide-react";

export function DeliveryPointDetail() {
  const navigate = useNavigate();
  const { id, pointId } = useParams();

  const deliveryPoint = {
    number: 3,
    name: "田中 太郎",
    furigana: "たなか たろう",
    status: "pending",
    zipCode: "750-0000",
    address: "山口県下関市○○町1-2-3",
    building: "ライオンズマンション 301号",
    newspapers: [
      { name: "朝日新聞 朝刊", quantity: 1 },
      { name: "朝日新聞 夕刊", quantity: 1 },
    ],
    memo: "2階ポスト、右から3番目。チャイムを鳴らさないこと。",
    landmarks: [
      { icon: "🏪", name: "セブンイレブン", distance: "50m先" },
      { icon: "🚦", name: "○○交差点", distance: "手前右折" },
      { icon: "🌳", name: "○○公園", distance: "隣" },
    ],
    history: [
      { date: "4/1", status: "✅完了", time: "5:12" },
      { date: "3/31", status: "✅完了", time: "5:18" },
      { date: "3/30", status: "🚫留守", time: "-" },
      { date: "3/29", status: "✅完了", time: "5:15" },
      { date: "3/28", status: "✅完了", time: "5:20" },
    ],
  };

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ backgroundColor: 'var(--surface-page)' }}
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between px-4 bg-white border-b"
        style={{
          height: '48px',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/mobile/route/${id}/map`)}>
            <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <span 
            className="font-semibold"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            #{deliveryPoint.number} {deliveryPoint.name} 様
          </span>
        </div>
        <button>
          <Phone size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </header>

      {/* Photo Carousel */}
      <div 
        className="relative flex items-center justify-center"
        style={{
          height: '200px',
          backgroundColor: 'var(--color-gray-100)',
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">🏢</div>
          <p style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--text-secondary)' 
          }}>
            建物写真
          </p>
        </div>
      </div>

      {/* Basic Info Card */}
      <div className="p-4">
        <div 
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span 
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-800)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              未配達
            </span>
          </div>

          <h2 
            className="font-bold mb-1"
            style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-primary)',
            }}
          >
            {deliveryPoint.name} 様
          </h2>
          
          <p 
            className="mb-4"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            {deliveryPoint.furigana}
          </p>

          <div className="space-y-2">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              〒{deliveryPoint.zipCode}
            </p>
            <div className="flex items-start gap-2">
              <MapPin size={18} style={{ color: 'var(--text-secondary)' }} className="mt-0.5" />
              <p style={{ 
                fontSize: 'var(--text-base)', 
                color: 'var(--text-primary)' 
              }}>
                {deliveryPoint.address}
              </p>
            </div>
            <p 
              className="font-semibold ml-6"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-gray-700)',
              }}
            >
              {deliveryPoint.building}
            </p>
          </div>
        </div>

        {/* Newspapers Card */}
        <div 
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            📰 購読新聞
          </h3>
          <div className="space-y-2">
            {deliveryPoint.newspapers.map((newspaper, index) => (
              <div 
                key={index}
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-primary)',
                }}
              >
                {newspaper.name} ×{newspaper.quantity}
              </div>
            ))}
          </div>
        </div>

        {/* Memo Card */}
        <div 
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 
              className="font-semibold"
              style={{
                fontSize: 'var(--text-sm)',
                color: '#92400E',
              }}
            >
              📝 配達メモ
            </h3>
            <button>
              <Volume2 size={18} style={{ color: '#92400E' }} />
            </button>
          </div>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-gray-600)',
            lineHeight: 1.6,
          }}>
            {deliveryPoint.memo}
          </p>
        </div>

        {/* Landmarks */}
        <div 
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            🏪 近くの目印
          </h3>
          <div className="space-y-2">
            {deliveryPoint.landmarks.map((landmark, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-gray-50)' }}
              >
                <span className="text-2xl">{landmark.icon}</span>
                <div className="flex-1">
                  <p style={{ 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-primary)' 
                  }}>
                    {landmark.name}
                  </p>
                  <p style={{ 
                    fontSize: 'var(--text-xs)', 
                    color: 'var(--text-secondary)' 
                  }}>
                    {landmark.distance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div 
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
            }}
          >
            📋 配達履歴
          </h3>
          <div className="space-y-2">
            {deliveryPoint.history.map((record, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-2 border-b"
                style={{ 
                  borderColor: 'var(--border-default)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  {record.date}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {record.status}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {record.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Action Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4"
        style={{ backgroundColor: 'var(--surface-page)' }}
      >
        <button
          className="w-full rounded-lg font-bold text-white flex items-center justify-center gap-2"
          style={{
            height: '56px',
            backgroundColor: 'var(--color-success-500)',
            fontSize: 'var(--text-lg)',
          }}
          onClick={() => navigate(`/mobile/route/${id}/map`)}
        >
          <CheckCircle2 size={24} />
          配達完了
        </button>
      </div>
    </div>
  );
}