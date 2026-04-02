import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, MapPin, CheckCircle2, Bell } from "lucide-react";

export function Onboarding() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      icon: MapPin,
      iconBg: "var(--color-primary-100)",
      iconColor: "var(--color-primary-500)",
      title: "地図でルートを確認",
      description: "配達先が順番に地図上に表示されます。矢印に沿って進むだけでOK！",
    },
    {
      icon: CheckCircle2,
      iconBg: "var(--color-success-500)",
      iconColor: "white",
      title: "ワンタップで配達完了",
      description: "配達したらボタンをタップ。スワイプ操作もできます。",
    },
    {
      icon: Bell,
      iconBg: "var(--color-warning-400)",
      iconColor: "white",
      title: "留守止め・新規をすぐ確認",
      description: "変更があると通知が届きます。ホーム画面でも確認できます。",
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigate('/mobile');
    }
  };

  const handleSkip = () => {
    navigate('/mobile');
  };

  const page = pages[currentPage];
  const Icon = page.icon;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--surface-page)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Illustration Area */}
        <div 
          className="w-full rounded-3xl flex items-center justify-center mb-8"
          style={{
            height: '240px',
            background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
          }}
        >
          <div 
            className="rounded-full flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              backgroundColor: page.iconBg,
            }}
          >
            <Icon size={60} style={{ color: page.iconColor }} />
          </div>
        </div>

        {/* Title */}
        <h2 
          className="text-center mb-4 font-bold"
          style={{
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-primary)',
          }}
        >
          {page.title}
        </h2>

        {/* Description */}
        <p 
          className="text-center max-w-xs mb-8"
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {page.description}
        </p>

        {/* Page Indicators */}
        <div className="flex gap-2 mb-12">
          {pages.map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all"
              style={{
                width: index === currentPage ? '24px' : '8px',
                height: '8px',
                backgroundColor: index === currentPage 
                  ? 'var(--color-primary-500)' 
                  : 'var(--color-gray-300)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleSkip}
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            スキップ
          </button>
          
          {currentPage < pages.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 rounded-lg font-medium"
              style={{
                height: '48px',
                backgroundColor: 'var(--color-primary-500)',
                color: 'white',
                fontSize: 'var(--text-base)',
              }}
            >
              次へ
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full rounded-lg font-bold"
              style={{
                height: '56px',
                backgroundColor: 'var(--color-success-500)',
                color: 'white',
                fontSize: 'var(--text-lg)',
              }}
            >
              始める！
            </button>
          )}
        </div>
      </div>
    </div>
  );
}