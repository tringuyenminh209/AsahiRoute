import { useNavigate } from "react-router";
import { Bell, Settings, Sun, MapPin, Clock, Ruler, Edit3, Globe, Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLanguage, languages } from "../contexts/LanguageContext";
import { useAuthStore } from "../../stores/auth.store";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService, DeliveryRoute } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

function formatDuration(minutes: number | null): string {
  if (!minutes) return '--';
  return `約${minutes}分`;
}

function formatDistance(meters: number | null): string {
  if (!meters) return '--';
  return `${(meters / 1000).toFixed(1)}km`;
}

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentLanguage, setLanguage } = useLanguage();
  const { activeDelivery, setActiveDelivery } = useDeliveryStore();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [startingRouteId, setStartingRouteId] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['my-routes', today],
    queryFn: () => deliveryService.getMyRoutes(today),
  });

  const morningRoute = routes.find((r: DeliveryRoute) => r.delivery_time === 'morning');
  const eveningRoute = routes.find((r: DeliveryRoute) => r.delivery_time === 'evening');

  const todayDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  const startMutation = useMutation({
    mutationFn: (route: DeliveryRoute) =>
      deliveryService.startDelivery({
        route_id: route.id,
        delivery_date: today,
        delivery_time: route.delivery_time,
      }),
    onSuccess: (session, route) => {
      setActiveDelivery({ id: session.id, routeId: route.id, startedAt: session.started_at });
      navigate(`/mobile/route/${route.id}/map`);
    },
    onError: (err) => toast.error(extractApiError(err)),
    onSettled: () => setStartingRouteId(null),
  });

  const handleStart = (route: DeliveryRoute) => {
    // Resume existing session for this route
    if (activeDelivery?.routeId === route.id) {
      navigate(`/mobile/route/${route.id}/map`);
      return;
    }
    setStartingRouteId(route.id);
    startMutation.mutate(route);
  };

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ backgroundColor: 'var(--surface-page)' }}
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between px-4"
        style={{
          height: '56px',
          backgroundColor: 'var(--color-primary-800)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
          <span 
            className="font-bold text-white"
            style={{ fontSize: 'var(--text-lg)' }}
          >
            AsahiRoute
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="relative"
            onClick={() => navigate('/mobile/notifications')}
          >
            <Bell size={24} className="text-white" />
            <span 
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
              style={{
                backgroundColor: 'var(--color-danger-500)',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              3
            </span>
          </button>
          <button onClick={() => navigate('/mobile/settings')}>
            <Settings size={24} className="text-white" />
          </button>
          <button
            className="relative"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Globe size={24} className="text-white" />
            <span 
              className="absolute -bottom-1 -right-1 text-xs font-bold px-1 rounded"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--color-primary-800)',
                fontSize: '9px',
                lineHeight: '14px',
              }}
            >
              {currentLanguage.toUpperCase()}
            </span>
          </button>
        </div>
      </header>

      {/* Language Selector Modal */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowLanguageDropdown(false)}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                言語選択 / Select Language
              </h2>
              <button onClick={() => setShowLanguageDropdown(false)}>
                <X size={24} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="space-y-2">
              {languages.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between"
                    style={{
                      borderColor: isSelected ? 'var(--color-primary-500)' : 'var(--border-default)',
                      backgroundColor: isSelected ? 'var(--color-primary-50)' : 'white',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{lang.flag}</span>
                      <div>
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {lang.nativeName}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {lang.name}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={24} style={{ color: 'var(--color-primary-500)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weather Banner */}
      <div 
        className="flex items-center gap-2 px-4"
        style={{
          height: '48px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          fontSize: 'var(--text-sm)',
        }}
      >
        <Sun size={20} />
        <span>☀️ 晴れ 12°C｜配達日和です</span>
      </div>

      {/* Greeting */}
      <div className="px-4 pt-6 pb-4">
        <h1
          className="font-bold mb-1"
          style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-primary)',
          }}
        >
          {t('home.greeting')}、{user?.name ?? ''}さん
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}>
          {todayDate}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
        </div>
      )}

      {/* Morning Route Card */}
      {!isLoading && (
        <div className="px-4 mb-4">
          <div
            className="rounded-xl p-4 shadow-md"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 'var(--text-lg)' }}>☀️</span>
                <span
                  className="font-semibold"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
                >
                  {t('home.morning_delivery')}
                </span>
              </div>
              <span
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: morningRoute ? 'var(--color-primary-100)' : 'var(--color-gray-100)',
                  color: morningRoute ? 'var(--color-primary-800)' : 'var(--color-gray-500)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {morningRoute ? t('home.not_started') : t('home.no_route')}
              </span>
            </div>

            <p className="mb-3" style={{ fontSize: 'var(--text-base)', color: 'var(--color-gray-600)' }}>
              {morningRoute ? `${morningRoute.area.name} ${morningRoute.name}` : '--'}
            </p>

            <div
              className="flex gap-4 mb-4 pb-4 border-b"
              style={{ borderColor: 'var(--border-default)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{morningRoute ? `${morningRoute.active_points}件` : '--'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatDuration(morningRoute?.estimated_duration_min ?? null)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Ruler size={16} />
                <span>{formatDistance(morningRoute?.estimated_distance_m ?? null)}</span>
              </div>
            </div>

            {morningRoute && morningRoute.suspended_count > 0 && (
              <div className="flex gap-2 mb-4">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)' }}
                >
                  🚫 留守 {morningRoute.suspended_count}件
                </span>
              </div>
            )}

            <button
              onClick={() => morningRoute && handleStart(morningRoute)}
              disabled={!morningRoute || startingRouteId === morningRoute?.id}
              className="w-full rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                height: '56px',
                backgroundColor: 'var(--color-primary-500)',
                fontSize: 'var(--text-lg)',
              }}
            >
              {startingRouteId === morningRoute?.id
                ? <><Loader2 size={20} className="animate-spin" /> {t('home.starting')}</>
                : activeDelivery?.routeId === morningRoute?.id
                  ? t('home.resume_delivery')
                  : t('home.start_delivery')}
            </button>
          </div>
        </div>
      )}

      {/* Evening Route Card */}
      {!isLoading && (
        <div className="px-4 mb-6">
          <div
            className="rounded-xl p-4 shadow-md"
            style={{ backgroundColor: 'var(--surface-card)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 'var(--text-lg)' }}>🌙</span>
                <span
                  className="font-semibold"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
                >
                  {t('home.evening_delivery')}
                </span>
              </div>
              <span
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-gray-100)',
                  color: 'var(--color-gray-500)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {eveningRoute ? t('home.not_started') : t('home.no_route')}
              </span>
            </div>

            <p className="mb-3" style={{ fontSize: 'var(--text-base)', color: 'var(--color-gray-600)' }}>
              {eveningRoute ? `${eveningRoute.area.name} ${eveningRoute.name}` : '--'}
            </p>

            <div
              className="flex gap-4 mb-4"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{eveningRoute ? `${eveningRoute.active_points}件` : '--'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatDuration(eveningRoute?.estimated_duration_min ?? null)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Ruler size={16} />
                <span>{formatDistance(eveningRoute?.estimated_distance_m ?? null)}</span>
              </div>
            </div>

            <button
              onClick={() => eveningRoute && handleStart(eveningRoute)}
              disabled={!eveningRoute || startingRouteId === eveningRoute?.id}
              className="w-full rounded-lg font-bold flex items-center justify-center gap-2"
              style={{
                height: '56px',
                backgroundColor: eveningRoute ? 'var(--color-primary-500)' : 'var(--color-gray-200)',
                color: eveningRoute ? 'white' : 'var(--color-gray-500)',
                fontSize: 'var(--text-lg)',
                cursor: !eveningRoute ? 'not-allowed' : 'pointer',
              }}
            >
              {startingRouteId === eveningRoute?.id
                ? <><Loader2 size={20} className="animate-spin" /> {t('home.starting')}</>
                : activeDelivery?.routeId === eveningRoute?.id
                  ? t('home.resume_delivery')
                  : eveningRoute ? t('home.start_delivery') : t('home.no_route')}
            </button>
          </div>
        </div>
      )}

      {/* Today's Changes */}
      {!isLoading && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="font-semibold"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
            >
              {t('home.status_management')}
            </h2>
            <button
              onClick={() => navigate('/mobile/delivery-status-management')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium"
              style={{
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-600)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <Edit3 size={14} />
              {t('home.status_management')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}