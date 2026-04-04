import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  ArrowLeft, Volume2, List, CheckCircle2,
  SkipForward, XCircle, Zap, Loader2, MapPin, Clock,
  Building2, Home, Navigation,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService, RoutePoint } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

type PointStatus = "delivered" | "skipped" | "failed" | "absent" | "suspended" | "pending";

function getEffectiveStatus(point: RoutePoint, loggedPoints: Record<number, string>): PointStatus {
  if (point.is_suspended) return "suspended";
  return (loggedPoints[point.id] as PointStatus) ?? "pending";
}

// ── Custom divIcon per status ────────────────────────────────────────────────
function makeMarkerIcon(seq: number, status: PointStatus, isCurrent: boolean): L.DivIcon {
  const bg =
    status === "delivered" ? "#22C55E" :
    status === "suspended" ? "#D1D5DB" :
    status === "skipped" || status === "absent" ? "#9CA3AF" :
    status === "failed" ? "#EF4444" :
    isCurrent ? "#CC0000" : "#3B82F6";

  const label =
    status === "delivered" ? "✓" :
    status === "suspended" ? "—" :
    String(seq);

  const size = isCurrent ? 40 : 28;
  const fs   = isCurrent ? 14 : 11;
  const ring = isCurrent ? `box-shadow:0 0 0 4px rgba(204,0,0,0.25),0 2px 8px rgba(0,0,0,0.3);` : `box-shadow:0 2px 4px rgba(0,0,0,0.25);`;

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border-radius:50%;
      border:2.5px solid white;
      ${ring}
      display:flex;align-items:center;justify-content:center;
      color:${status === "suspended" ? "#6B7280" : "white"};
      font-weight:bold;font-size:${fs}px;font-family:sans-serif;
      user-select:none;
    ">${label}</div>`,
    className: "",
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2 + 6)],
  });
}

// ── Auto-fly when current point changes ─────────────────────────────────────
function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 18, { animate: true, duration: 0.5 });
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ── Parse address_detail → building name + room number ───────────────────────
function parseAddressDetail(detail: string | null): { building: string | null; room: string | null } {
  if (!detail) return { building: null, room: null };
  // Match Japanese room patterns: "101号室", "3F 205号室", "B1-3号室"
  const roomMatch = detail.match(/([A-Zａ-ｚ]?\d{1,4}(?:[-－]\d+)?号室)/);
  if (roomMatch) {
    const room     = roomMatch[1];
    const building = detail.replace(room, "").replace(/\s+/g, " ").trim() || null;
    return { building, room };
  }
  // Floor-only patterns: "2F", "B1"
  const floorMatch = detail.match(/^([Bb]?\d+[Ff]|B\d+)$/);
  if (floorMatch) return { building: null, room: detail };
  // Fallback: whole detail is the "room" (e.g., apartment name without room#)
  return { building: detail, room: null };
}

// ── Main component ───────────────────────────────────────────────────────────
export function RouteMap() {
  const navigate     = useNavigate();
  const { t }        = useTranslation();
  const { id }       = useParams<{ id: string }>();
  const queryClient  = useQueryClient();
  const { activeDelivery, loggedPoints, logPoint, clearSession } = useDeliveryStore();

  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["my-routes", today],
    queryFn:  () => deliveryService.getMyRoutes(today),
  });

  const route = useMemo(
    () => routes.find((r: { id: number }) => String(r.id) === id),
    [routes, id]
  );

  const activePoints = useMemo(
    () => (route?.points ?? []).filter((p: RoutePoint) => !p.is_suspended),
    [route]
  );

  const effectiveIndex = useMemo(() => {
    const idx = activePoints.findIndex((p: RoutePoint) => !loggedPoints[p.id]);
    return idx === -1 ? activePoints.length - 1 : idx;
  }, [activePoints, loggedPoints]);

  const displayIndex   = Math.max(0, Math.min(currentPointIndex, effectiveIndex));
  const currentPoint: RoutePoint | undefined = activePoints[displayIndex];

  const deliveredCount = activePoints.filter((p: RoutePoint) => loggedPoints[p.id] === "delivered").length;
  const suspendedCount = (route?.points ?? []).filter((p: RoutePoint) => p.is_suspended).length;
  const totalActive    = activePoints.length;

  // Map bounds — fallback to Nishiyodogawa if no geo data
  const geoPoints = (route?.points ?? []).filter(
    (p: RoutePoint) => p.subscriber.lat !== null && p.subscriber.lng !== null
  ) as RoutePoint[];

  const mapBounds = useMemo((): [[number, number], [number, number]] => {
    if (geoPoints.length === 0) return [[34.688, 135.448], [34.720, 135.465]];
    const lats = geoPoints.map((p) => p.subscriber.lat as number);
    const lngs = geoPoints.map((p) => p.subscriber.lng as number);
    const pad  = 0.001;
    return [
      [Math.min(...lats) - pad, Math.min(...lngs) - pad],
      [Math.max(...lats) + pad, Math.max(...lngs) + pad],
    ];
  }, [geoPoints]);

  // Polyline path (active points only, in sequence)
  const polylinePoints = useMemo(
    () => activePoints
      .filter((p: RoutePoint) => p.subscriber.lat && p.subscriber.lng)
      .map((p: RoutePoint) => [p.subscriber.lat, p.subscriber.lng] as [number, number]),
    [activePoints]
  );

  // Log point mutation
  const logMutation = useMutation({
    mutationFn: (vars: { pointId: number; status: "delivered" | "skipped" | "failed" | "absent" }) =>
      deliveryService.logPoint({
        delivery_id:    activeDelivery!.id,
        route_point_id: vars.pointId,
        status:         vars.status,
        delivered_at:   new Date().toISOString(),
      }),
    onMutate: ({ pointId, status }) => {
      logPoint(pointId, status);
    },
    onError: (err) => toast.error(extractApiError(err)),
    onSuccess: () => {
      const nextIdx = activePoints.findIndex(
        (_: RoutePoint, i: number) => i > displayIndex && !loggedPoints[activePoints[i]?.id]
      );
      if (nextIdx !== -1) setCurrentPointIndex(nextIdx);
    },
  });

  const handleLog = (status: "delivered" | "skipped" | "failed") => {
    if (!currentPoint || !activeDelivery) { toast.error(t("common.error")); return; }
    logMutation.mutate({ pointId: currentPoint.id, status });
  };

  const handleCompleteDelivery = async () => {
    if (!activeDelivery) return;
    setIsCompleting(true);
    try {
      const summary = await deliveryService.completeDelivery(activeDelivery.id);
      clearSession();
      queryClient.invalidateQueries({ queryKey: ["my-routes"] });
      navigate(`/mobile/delivery/${activeDelivery.id}/summary`, { state: { summary } });
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setIsCompleting(false);
    }
  };

  const allDone = activePoints.every((p: RoutePoint) => !!loggedPoints[p.id]);

  // Apartment detail for current point
  const addressDetail = parseAddressDetail(currentPoint?.subscriber.address_detail ?? null);
  const isApartment   = !!addressDetail.room;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary-500)" }} />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {t("route_map.route_not_found")}
        </p>
        <button
          onClick={() => navigate("/mobile")}
          className="px-6 py-3 rounded-lg text-white font-bold"
          style={{ backgroundColor: "var(--color-primary-500)" }}
        >
          {t("route_map.back_home")}
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b flex-shrink-0"
        style={{ height: "56px", borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/mobile")} className="p-1">
            <ArrowLeft size={24} style={{ color: "var(--text-primary)" }} />
          </button>
          <div>
            <span className="font-bold block" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)", lineHeight: 1.2 }}>
              {route.area.name}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              {route.delivery_time === "morning" ? t("route_map.morning") : t("route_map.evening")}｜{route.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg" style={{ color: "var(--color-primary-500)" }}>
            {deliveredCount}/{totalActive}
          </span>
          <button className="p-1">
            <Volume2 size={22} style={{ color: "var(--text-secondary)" }} />
          </button>
          <button onClick={() => navigate(`/mobile/route/${id}/list`)} className="p-1">
            <List size={22} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="flex-shrink-0" style={{ height: "4px", backgroundColor: "var(--color-gray-200)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${totalActive > 0 ? (deliveredCount / totalActive) * 100 : 0}%`,
            backgroundColor: "var(--color-success-500)",
          }}
        />
      </div>

      {/* ── Leaflet Map ──────────────────────────────────────────────────────── */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapContainer
          bounds={mapBounds}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Auto-center on current point */}
          {currentPoint?.subscriber.lat && currentPoint.subscriber.lng && (
            <MapFlyTo lat={currentPoint.subscriber.lat} lng={currentPoint.subscriber.lng} />
          )}

          {/* Route path polyline */}
          {polylinePoints.length > 1 && (
            <Polyline
              positions={polylinePoints}
              pathOptions={{ color: "#3B82F6", weight: 2, opacity: 0.5, dashArray: "6 4" }}
            />
          )}

          {/* Point markers */}
          {(route.points as RoutePoint[]).map((point) => {
            if (!point.subscriber.lat || !point.subscriber.lng) return null;
            const status    = getEffectiveStatus(point, loggedPoints);
            const isCurrent = currentPoint?.id === point.id;
            const icon      = makeMarkerIcon(point.sequence_order, status, isCurrent);
            const detail    = parseAddressDetail(point.subscriber.address_detail);

            return (
              <Marker
                key={point.id}
                position={[point.subscriber.lat, point.subscriber.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    const activeIdx = activePoints.findIndex((p: RoutePoint) => p.id === point.id);
                    if (activeIdx !== -1) setCurrentPointIndex(activeIdx);
                  },
                }}
              >
                <Popup closeButton={false} className="route-popup">
                  <div style={{ minWidth: "130px", fontFamily: "sans-serif" }}>
                    {/* Subscriber name */}
                    <div style={{ fontWeight: "bold", fontSize: "13px", color: "#1A1A1A", marginBottom: "4px" }}>
                      {point.subscriber.name} 様
                    </div>

                    {/* Room number badge — highlighted when apartment */}
                    {detail.room ? (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "#FEF3C7", border: "1px solid #F59E0B",
                        borderRadius: "8px", padding: "4px 8px",
                      }}>
                        <span style={{ fontSize: "16px" }}>🏢</span>
                        <div>
                          {detail.building && (
                            <div style={{ fontSize: "10px", color: "#92400E", lineHeight: 1.2 }}>{detail.building}</div>
                          )}
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#92400E" }}>{detail.room}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "#6B7280", lineHeight: 1.4 }}>
                        {point.subscriber.address.replace(/^大阪府大阪市/, "")}
                      </div>
                    )}

                    {/* Newspapers */}
                    <div style={{ fontSize: "11px", color: "#374151", marginTop: "4px" }}>
                      📰 {point.subscriber.newspapers.map((n) => `${n.name}×${n.quantity}`).join("、")}
                    </div>

                    {/* Note */}
                    {point.subscriber.delivery_note && (
                      <div style={{ fontSize: "11px", color: "#B45309", marginTop: "4px" }}>
                        📝 {point.subscriber.delivery_note}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Stats overlay top-left */}
        <div
          className="absolute top-3 left-3 z-[1000] rounded-xl px-3 py-2 shadow"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", pointerEvents: "none" }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {route.estimated_distance_m ? `${(route.estimated_distance_m / 1000).toFixed(1)}km` : "--"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {route.estimated_duration_min ? `約${route.estimated_duration_min}分` : "--"}
            </span>
            {suspendedCount > 0 && (
              <span style={{ color: "var(--text-muted)" }}>留守 {suspendedCount}件</span>
            )}
          </div>
        </div>

        {/* Legend bottom-left */}
        <div
          className="absolute bottom-3 left-3 z-[1000] rounded-lg p-2 shadow text-xs"
          style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
        >
          {[
            { color: "#22C55E", label: t("route_map.legend_delivered") },
            { color: "#3B82F6", label: t("route_map.legend_pending") },
            { color: "#D1D5DB", label: t("route_map.legend_suspended") },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 mb-1 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: color }} />
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Navigation button */}
        <button
          className="absolute bottom-3 right-3 z-[1000] w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg"
          onClick={() => {
            if (currentPoint?.subscriber.lat && currentPoint.subscriber.lng) {
              window.open(
                `https://maps.google.com/maps?q=${currentPoint.subscriber.lat},${currentPoint.subscriber.lng}`,
                "_blank"
              );
            }
          }}
        >
          <Navigation size={18} style={{ color: "var(--color-primary-500)" }} />
        </button>
      </div>

      {/* ── Bottom Sheet ─────────────────────────────────────────────────────── */}
      <div
        className="bg-white shadow-2xl flex-shrink-0"
        style={{ borderRadius: "20px 20px 0 0", maxHeight: "45vh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-gray-300)" }} />
        </div>

        <div className="px-4 pb-6">
          {allDone ? (
            /* ── All done ── */
            <div className="text-center py-2">
              <p className="font-bold text-lg mb-4" style={{ color: "var(--color-success-600)" }}>
                {t("route_map.all_done", { count: totalActive })}
              </p>
              <button
                onClick={handleCompleteDelivery}
                disabled={isCompleting}
                className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ height: "56px", backgroundColor: "var(--color-success-500)", fontSize: "var(--text-lg)" }}
              >
                {isCompleting
                  ? <><Loader2 size={20} className="animate-spin" /> {t("route_map.collecting")}</>
                  : <><Zap size={20} /> {t("route_map.complete_session")}</>}
              </button>
            </div>
          ) : currentPoint ? (
            <>
              {/* ── Point header ── */}
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="font-bold flex-shrink-0"
                  style={{ fontSize: "var(--text-2xl)", color: "var(--color-primary-500)", lineHeight: 1 }}
                >
                  #{currentPoint.sequence_order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isApartment
                      ? <Building2 size={16} style={{ color: "#D97706", flexShrink: 0 }} />
                      : <Home size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                    }
                    <span className="font-bold truncate" style={{ fontSize: "var(--text-xl)", color: "var(--text-primary)" }}>
                      {currentPoint.subscriber.name} 様
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: "var(--color-gray-500)" }}>
                    {/* Trim prefecture for brevity */}
                    {currentPoint.subscriber.address.replace(/^大阪府大阪市/, "")}
                  </p>
                </div>
              </div>

              {/* ── Apartment / Mansion room highlight ── */}
              {isApartment && (
                <div
                  className="flex items-center gap-3 rounded-xl mb-3"
                  style={{
                    background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                    border: "2px solid #F59E0B",
                    padding: "12px 14px",
                  }}
                >
                  <span style={{ fontSize: "28px", lineHeight: 1 }}>🏢</span>
                  <div className="flex-1 min-w-0">
                    {addressDetail.building && (
                      <p
                        className="truncate font-medium"
                        style={{ fontSize: "var(--text-sm)", color: "#92400E", marginBottom: "2px" }}
                      >
                        {addressDetail.building}
                      </p>
                    )}
                    <p
                      className="font-bold"
                      style={{ fontSize: "30px", color: "#92400E", lineHeight: 1, letterSpacing: "0.04em" }}
                    >
                      {addressDetail.room}
                    </p>
                  </div>
                  {/* Quick-copy hint */}
                  <div
                    className="flex-shrink-0 rounded-lg px-2 py-1 text-center"
                    style={{ backgroundColor: "#F59E0B", color: "white" }}
                  >
                    <p style={{ fontSize: "9px", fontWeight: "bold", lineHeight: 1.2 }}>部屋</p>
                    <p style={{ fontSize: "9px", fontWeight: "bold", lineHeight: 1.2 }}>番号</p>
                  </div>
                </div>
              )}

              {/* ── Newspapers ── */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                style={{ backgroundColor: "var(--color-gray-50)", fontSize: "var(--text-base)" }}
              >
                <span>📰</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {currentPoint.subscriber.newspapers.map((n) => `${n.name} ×${n.quantity}`).join("　")}
                </span>
              </div>

              {/* ── Delivery note ── */}
              {currentPoint.subscriber.delivery_note && (
                <div
                  className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3"
                  style={{ backgroundColor: "#FEF3C7", fontSize: "var(--text-sm)" }}
                >
                  <span style={{ flexShrink: 0 }}>📝</span>
                  <span style={{ color: "#92400E" }}>{currentPoint.subscriber.delivery_note}</span>
                </div>
              )}

              {/* ── Action buttons ── */}
              <button
                onClick={() => handleLog("delivered")}
                disabled={logMutation.isPending}
                className="w-full rounded-xl font-bold text-white mb-2 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ height: "56px", backgroundColor: "var(--color-success-500)", fontSize: "var(--text-lg)" }}
              >
                {logMutation.isPending
                  ? <Loader2 size={20} className="animate-spin" />
                  : <CheckCircle2 size={24} />}
                {t("route_map.complete_delivery")}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleLog("skipped")}
                  disabled={logMutation.isPending}
                  className="flex-1 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ height: "44px", backgroundColor: "var(--color-gray-100)", color: "var(--text-primary)", fontSize: "var(--text-sm)" }}
                >
                  <SkipForward size={18} />
                  {t("route_map.skip")}
                </button>
                <button
                  onClick={() => handleLog("failed")}
                  disabled={logMutation.isPending}
                  className="flex-1 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ height: "44px", backgroundColor: "#FEF2F2", color: "var(--color-danger-600)", fontSize: "var(--text-sm)" }}
                >
                  <XCircle size={18} />
                  {t("route_map.failed")}
                </button>
              </div>

              <p className="text-center mt-2" style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {t("route_map.skip_hint")}
              </p>
            </>
          ) : (
            <p className="text-center py-4" style={{ color: "var(--text-secondary)" }}>
              {t("route_map.no_points")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
