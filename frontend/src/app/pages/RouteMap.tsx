import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  ArrowLeft, Volume2, List, CheckCircle2,
  SkipForward, XCircle, Zap, Loader2, MapPin, Clock,
  Building2, Home, Navigation, Satellite, LocateFixed,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useDeliveryStore } from "../../stores/delivery.store";
import { deliveryService, RoutePoint } from "../../services/delivery.service";
import { extractApiError } from "../../lib/api";

type PointStatus = "delivered" | "skipped" | "failed" | "absent" | "suspended" | "pending";

function getEffectiveStatus(point: RoutePoint, loggedPoints: Record<number, string>): PointStatus {
  if (point.is_suspended || point.is_schedule_skip) return "suspended";
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

// ── User location marker ─────────────────────────────────────────────────────
function UserLocationMarker({ lat, lng }: { lat: number; lng: number }) {
  const icon = L.divIcon({
    html: `<div style="
      width:18px;height:18px;
      background:#3B82F6;border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    className: "",
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
  });
  return <Marker position={[lat, lng]} icon={icon} zIndexOffset={1000} />;
}

// ── Auto-pan when current point changes (preserve user zoom level) ───────────
function MapPanTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true, duration: 0.4 });
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ── Locate me button (fly map to user's GPS position) ───────────────────────
function LocateMe({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();
  const [active, setActive] = useState(false);

  const handleLocate = () => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 18, { animate: true, duration: 0.6 });
      setActive(true);
      setTimeout(() => setActive(false), 2000);
    }
  };

  return (
    <button
      onClick={handleLocate}
      title="現在地を表示"
      className="absolute bottom-16 right-3 z-[1000] w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-colors"
      style={{
        backgroundColor: active ? "#3B82F6" : "white",
        color: active ? "white" : userLocation ? "#3B82F6" : "var(--color-gray-400)",
        pointerEvents: "auto",
      }}
    >
      <LocateFixed size={20} />
    </button>
  );
}

// ── Zoom control buttons ─────────────────────────────────────────────────────
function ZoomControls({
  isSatellite,
  onToggleSatellite,
}: {
  isSatellite: boolean;
  onToggleSatellite: () => void;
}) {
  const map = useMap();
  return (
    <div
      className="absolute top-3 right-3 z-[1000] flex flex-col gap-1"
      style={{ pointerEvents: "auto" }}
    >
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center text-xl font-bold"
        style={{ color: "var(--text-primary)", lineHeight: 1 }}
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center text-xl font-bold"
        style={{ color: "var(--text-primary)", lineHeight: 1 }}
      >
        −
      </button>
      <button
        onClick={onToggleSatellite}
        title={isSatellite ? "地図表示" : "写真表示"}
        className="w-10 h-10 rounded-lg shadow flex items-center justify-center"
        style={{
          backgroundColor: isSatellite ? "#1A1A1A" : "white",
          color: isSatellite ? "white" : "var(--text-secondary)",
        }}
      >
        <Satellite size={18} />
      </button>
    </div>
  );
}

// ── Building helpers ─────────────────────────────────────────────────────────
function parseBuildingName(detail: string | null): string | null {
  if (!detail) return null;
  const m = detail.match(/^(.+?)\s*(?:[A-Zａ-ｚ]?\d{1,4}(?:[-－]\d+)?号室|[Bb]?\d+[Ff])/);
  return m ? m[1].trim() || null : null;
}

function parseRoomFromDetail(detail: string | null): string | null {
  if (!detail) return null;
  const m = detail.match(/([A-Zａ-ｚ]?\d{1,4}(?:[-－]\d+)?号室)/);
  return m ? m[1] : null;
}

function makeBuildingIcon(doneCount: number, totalCount: number, isCurrent: boolean): L.DivIcon {
  const allDone = doneCount >= totalCount;
  const bg      = allDone ? "#22C55E" : isCurrent ? "#D97706" : "#78350F";
  const shadow  = isCurrent
    ? "0 0 0 4px rgba(217,119,6,0.35),0 2px 8px rgba(0,0,0,0.3)"
    : "0 2px 6px rgba(0,0,0,0.25)";
  return L.divIcon({
    html: `<div style="
      width:52px;height:52px;background:${bg};border-radius:12px;
      border:3px solid white;box-shadow:${shadow};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      color:white;font-family:sans-serif;gap:1px;">
      <span style="font-size:20px;line-height:1">🏢</span>
      <span style="font-size:10px;font-weight:bold;line-height:1">${doneCount}/${totalCount}</span>
    </div>`,
    className: "",
    iconSize:   [52, 52],
    iconAnchor: [26, 26],
    popupAnchor:[0, -30],
  });
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
  const { activeDelivery, loggedPoints, logPoint, hydratePoints, pointOrder, useCustomOrder, clearSession } = useDeliveryStore();

  // Restore delivered-point state from server on every mount (handles app exit/re-entry)
  useEffect(() => {
    if (!activeDelivery) return;
    deliveryService.getDeliveryLogs(activeDelivery.id).then((logs) => {
      const points: Record<number, "delivered" | "skipped" | "failed" | "absent"> = {};
      logs.forEach((log) => {
        points[log.route_point_id] = log.status as "delivered" | "skipped" | "failed" | "absent";
      });
      hydratePoints(points);
    }).catch(() => { /* offline — use localStorage cache */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [roadGeometry, setRoadGeometry] = useState<[number, number][] | null>(null);
  const osrmFetchRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied or unavailable — silent fail */ },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["my-routes", today],
    queryFn:  () => deliveryService.getMyRoutes(today),
  });

  const route = useMemo(
    () => routes.find((r: { id: number }) => String(r.id) === id),
    [routes, id]
  );

  // Apply custom delivery order only when user has activated their custom route
  const isCustomMode = id ? !!useCustomOrder[id] : false;
  const activePoints = useMemo(() => {
    const base = (route?.points ?? []).filter((p: RoutePoint) => !p.is_suspended && !p.is_schedule_skip);
    // Default: sort by admin sequence_order
    const defaultSorted = [...base].sort((a, b) => a.sequence_order - b.sequence_order);
    if (!isCustomMode) return defaultSorted;
    const order = id ? pointOrder[id] : undefined;
    if (!order || order.length === 0) return defaultSorted;
    const pointMap = new globalThis.Map(base.map((p) => [p.id, p]));
    const sorted   = order.map((pid) => pointMap.get(pid)).filter(Boolean) as RoutePoint[];
    const inOrder  = new Set(order);
    const extra    = base.filter((p) => !inOrder.has(p.id));
    return [...sorted, ...extra];
  }, [route, pointOrder, id, isCustomMode]);

  // Map point.id → display sequence number (1-based, respects custom order)
  const displaySeqMap = useMemo(() => {
    const m = new globalThis.Map<number, number>();
    activePoints.forEach((p: RoutePoint, i: number) => m.set(p.id, i + 1));
    return m;
  }, [activePoints]);

  const effectiveIndex = useMemo(() => {
    const idx = activePoints.findIndex((p: RoutePoint) => !loggedPoints[p.id]);
    return idx === -1 ? activePoints.length - 1 : idx;
  }, [activePoints, loggedPoints]);

  const displayIndex   = Math.max(0, Math.min(currentPointIndex, effectiveIndex));
  const currentPoint: RoutePoint | undefined = activePoints[displayIndex];

  const deliveredCount = activePoints.filter((p: RoutePoint) => loggedPoints[p.id] === "delivered").length;
  const suspendedCount = (route?.points ?? []).filter((p: RoutePoint) => p.is_suspended || p.is_schedule_skip).length;
  const totalActive    = activePoints.length;

  // Map bounds — fallback to Nishiyodogawa if no geo data
  const geoPoints = (route?.points ?? []).filter(
    (p: RoutePoint) => p.subscriber.lat !== null && p.subscriber.lng !== null
  ) as RoutePoint[];

  // 初期表示: 最初の配達ポイント or ルートの中心を使用
  const initialCenter = useMemo((): [number, number] => {
    if (currentPoint?.subscriber.lat && currentPoint?.subscriber.lng) {
      return [currentPoint.subscriber.lat, currentPoint.subscriber.lng];
    }
    if (geoPoints.length > 0) {
      return [geoPoints[0].subscriber.lat as number, geoPoints[0].subscriber.lng as number];
    }
    return [34.7144, 135.4559]; // 西淀川 fallback
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Building group computation ────────────────────────────────────────────
  // Map<address, RoutePoint[]> — only addresses with ≥2 active points with address_detail
  const buildingGroupMap = useMemo(() => {
    const map = new globalThis.Map<string, RoutePoint[]>();
    activePoints.forEach((p: RoutePoint) => {
      if (!p.subscriber.address_detail) return;
      const key = p.subscriber.address;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    for (const [key, pts] of map) {
      if (pts.length < 2) map.delete(key);
    }
    return map;
  }, [activePoints]);

  const buildingAddresses = useMemo(() => new Set(buildingGroupMap.keys()), [buildingGroupMap]);

  // Which building is currently "selected" in bottom sheet
  const [selectedBuildingAddr, setSelectedBuildingAddr] = useState<string | null>(null);

  // The building group shown in bottom sheet
  const activeBuildingGroup: RoutePoint[] | null = useMemo(() => {
    // Auto-select when current point is part of a building group
    const autoAddr = currentPoint?.subscriber.address_detail
      ? buildingGroupMap.get(currentPoint.subscriber.address) ?? null
      : null;
    if (autoAddr) return autoAddr;
    if (selectedBuildingAddr) return buildingGroupMap.get(selectedBuildingAddr) ?? null;
    return null;
  }, [currentPoint, buildingGroupMap, selectedBuildingAddr]);

  // Remaining undelivered waypoints (building-deduped) — drives OSRM re-fetch
  const remainingWaypoints = useMemo(() => {
    const seenBuilding = new Set<string>();
    return activePoints
      .filter((p: RoutePoint) => {
        if (!p.subscriber.lat || !p.subscriber.lng) return false;
        if (loggedPoints[p.id]) return false; // skip already delivered/skipped
        if (!p.subscriber.address_detail || !buildingAddresses.has(p.subscriber.address)) return true;
        const addr = p.subscriber.address;
        if (seenBuilding.has(addr)) return false;
        seenBuilding.add(addr);
        return true;
      })
      .map((p: RoutePoint) => [p.subscriber.lat, p.subscriber.lng] as [number, number]);
  }, [activePoints, buildingAddresses, loggedPoints]);

  // Keep latest userLocation in a ref so OSRM effect can read it without re-triggering on GPS ticks
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  // Fetch road-following geometry from OSRM: from current position → remaining points
  useEffect(() => {
    const loc = userLocationRef.current;
    const waypoints: [number, number][] = loc
      ? [[loc.lat, loc.lng], ...remainingWaypoints]
      : remainingWaypoints;

    if (waypoints.length < 2) {
      setRoadGeometry(null);
      return;
    }

    if (osrmFetchRef.current) osrmFetchRef.current.abort();
    const controller = new AbortController();
    osrmFetchRef.current = controller;

    // OSRM public API — bike profile suits newspaper delivery (bicycle/motorcycle routes)
    // Max 25 waypoints per request
    const sliced = waypoints.slice(0, 25);
    const coords = sliced.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/bike/${coords}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.routes?.[0]?.geometry?.coordinates) {
          const path: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setRoadGeometry(path);
        }
      })
      .catch(() => setRoadGeometry(null));

    return () => controller.abort();
  }, [JSON.stringify(remainingWaypoints)]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)", lineHeight: 1.2 }}>
                {route.area.name}
              </span>
              {isCustomMode && (
                <span
                  className="px-1.5 py-0.5 rounded text-white font-bold"
                  style={{ fontSize: '9px', backgroundColor: 'var(--color-primary-500)', lineHeight: 1.4 }}
                >
                  ⚡マイルート
                </span>
              )}
            </div>
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
          center={initialCenter}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          maxZoom={20}
          minZoom={13}
        >
          {/* Google Maps tiles — zoom 20、日本語ラベル付き
              後でGoogle Maps Platform APIキーに置き換える予定 */}
          {isSatellite ? (
            <TileLayer
              key="gmap-satellite"
              url="https://mt{s}.google.com/vt/lyrs=y&hl=ja&gl=JP&x={x}&y={y}&z={z}"
              subdomains="0123"
              maxNativeZoom={20}
              attribution="&copy; Google Maps"
            />
          ) : (
            <TileLayer
              key="gmap-roads"
              url="https://mt{s}.google.com/vt/lyrs=m&hl=ja&gl=JP&x={x}&y={y}&z={z}"
              subdomains="0123"
              maxNativeZoom={20}
              attribution="&copy; Google Maps"
            />
          )}

          {/* Auto-pan to current point (zoom preserved) */}
          {currentPoint?.subscriber.lat && currentPoint.subscriber.lng && (
            <MapPanTo lat={currentPoint.subscriber.lat} lng={currentPoint.subscriber.lng} />
          )}

          {/* Zoom +/- buttons + satellite toggle */}
          <ZoomControls isSatellite={isSatellite} onToggleSatellite={() => setIsSatellite(v => !v)} />

          {/* Locate me — fly to user's GPS */}
          <LocateMe userLocation={userLocation} />

          {/* Route path — road-following (OSRM) or straight-line fallback */}
          {roadGeometry ? (
            <Polyline
              positions={roadGeometry}
              pathOptions={{ color: "#3B82F6", weight: 4, opacity: 0.75 }}
            />
          ) : remainingWaypoints.length > 1 && (
            <Polyline
              positions={remainingWaypoints}
              pathOptions={{ color: "#3B82F6", weight: 2, opacity: 0.4, dashArray: "6 4" }}
            />
          )}

          {/* User current location */}
          {userLocation && (
            <UserLocationMarker lat={userLocation.lat} lng={userLocation.lng} />
          )}

          {/* Point markers — building groups show as single marker */}
          {(() => {
            const renderedBuildings = new Set<string>();
            return (route.points as RoutePoint[]).map((point) => {
              if (!point.subscriber.lat || !point.subscriber.lng) return null;

              // Building group: render ONE marker per building
              if (point.subscriber.address_detail && buildingAddresses.has(point.subscriber.address)) {
                const addr = point.subscriber.address;
                if (renderedBuildings.has(addr)) return null; // already rendered
                renderedBuildings.add(addr);

                const group = buildingGroupMap.get(addr)!;
                const doneCount  = group.filter(p => loggedPoints[p.id] === "delivered").length;
                const totalCount = group.filter(p => !p.is_suspended && !p.is_schedule_skip).length;
                const isGroupCurrent = group.some(p => p.id === currentPoint?.id);
                const icon = makeBuildingIcon(doneCount, totalCount, isGroupCurrent);
                const buildingName = parseBuildingName(group[0].subscriber.address_detail);

                return (
                  <Marker
                    key={`building-${addr}`}
                    position={[point.subscriber.lat, point.subscriber.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        // Navigate currentPoint to first undelivered room in this building
                        const firstUndelivered = group.find(p => !loggedPoints[p.id]);
                        const target = firstUndelivered ?? group[0];
                        const activeIdx = activePoints.findIndex((p: RoutePoint) => p.id === target.id);
                        if (activeIdx !== -1) setCurrentPointIndex(activeIdx);
                        setSelectedBuildingAddr(addr);
                      },
                    }}
                  >
                    <Popup closeButton={false} className="route-popup">
                      <div style={{ minWidth: "150px", fontFamily: "sans-serif" }}>
                        <div style={{ fontWeight: "bold", fontSize: "13px", color: "#92400E", marginBottom: "4px" }}>
                          🏢 {buildingName ?? addr.replace(/^大阪府大阪市/, "")}
                        </div>
                        <div style={{ fontSize: "11px", color: "#374151" }}>
                          {totalCount}件配達 · {doneCount}件完了
                        </div>
                        <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>
                          タップして詳細を表示
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              // Normal individual point
              const status    = getEffectiveStatus(point, loggedPoints);
              const isCurrent = currentPoint?.id === point.id;
              const todayNewspapers = point.subscriber.newspapers.filter(n => n.delivers_today);
              const icon      = makeMarkerIcon(displaySeqMap.get(point.id) ?? point.sequence_order, status, isCurrent);
              const detail    = parseAddressDetail(point.subscriber.address_detail);

              return (
                <Marker
                  key={point.id}
                  position={[point.subscriber.lat, point.subscriber.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedBuildingAddr(null);
                      const activeIdx = activePoints.findIndex((p: RoutePoint) => p.id === point.id);
                      if (activeIdx !== -1) setCurrentPointIndex(activeIdx);
                    },
                  }}
                >
                  <Popup closeButton={false} className="route-popup">
                    <div style={{ minWidth: "130px", fontFamily: "sans-serif" }}>
                      <div style={{ fontWeight: "bold", fontSize: "13px", color: "#1A1A1A", marginBottom: "4px" }}>
                        {point.subscriber.name} 様
                      </div>
                      {detail.room ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "8px", padding: "4px 8px" }}>
                          <span style={{ fontSize: "14px" }}>🏢</span>
                          <div>
                            {detail.building && <div style={{ fontSize: "10px", color: "#92400E" }}>{detail.building}</div>}
                            <div style={{ fontWeight: "bold", fontSize: "14px", color: "#92400E" }}>{detail.room}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "#6B7280" }}>
                          {point.subscriber.address.replace(/^大阪府大阪市/, "")}
                        </div>
                      )}
                      {point.is_schedule_skip ? (
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>配達なし（今日）</div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "#374151", marginTop: "4px" }}>
                          📰 {todayNewspapers.map(n => `${n.name}×${n.today_quantity ?? n.quantity}`).join("、")}
                        </div>
                      )}
                      {point.subscriber.delivery_note && (
                        <div style={{ fontSize: "11px", color: "#B45309", marginTop: "4px" }}>📝 {point.subscriber.delivery_note}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            });
          })()}
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

        {/* Google Maps navigation to current delivery point */}
        <button
          title="Googleマップで案内"
          className="absolute bottom-3 right-3 z-[1000] w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: "var(--color-primary-500)" }}
          onClick={() => {
            if (currentPoint?.subscriber.lat && currentPoint.subscriber.lng) {
              window.open(
                `https://maps.google.com/maps?q=${currentPoint.subscriber.lat},${currentPoint.subscriber.lng}`,
                "_blank"
              );
            }
          }}
        >
          <Navigation size={18} fill="white" style={{ color: "white" }} />
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
          {activeBuildingGroup ? (
            /* ── Building group sheet ── */
            (() => {
              const bldName = parseBuildingName(activeBuildingGroup[0].subscriber.address_detail);
              const activeBldPoints = activeBuildingGroup.filter(p => !p.is_suspended && !p.is_schedule_skip);
              const doneBldCount    = activeBldPoints.filter(p => loggedPoints[p.id] === "delivered").length;
              const allBldDone      = doneBldCount >= activeBldPoints.length;
              return (
                <>
                  {/* Building header */}
                  <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: "1px solid var(--color-gray-100)" }}>
                    <Building2 size={22} style={{ color: "#D97706", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate" style={{ fontSize: "var(--text-base)", color: "#92400E" }}>
                        {bldName ?? activeBuildingGroup[0].subscriber.address.replace(/^大阪府大阪市/, "")}
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "#B45309" }}>
                        {doneBldCount}/{activeBldPoints.length}件完了
                      </div>
                    </div>
                    {/* dismiss building view */}
                    <button
                      onClick={() => setSelectedBuildingAddr(null)}
                      className="text-xs px-2 py-1 rounded border"
                      style={{ color: "var(--text-secondary)", borderColor: "var(--border-default)" }}
                    >
                      閉じる
                    </button>
                  </div>

                  {/* Room list */}
                  <div className="space-y-2 mb-3">
                    {activeBuildingGroup.map((p: RoutePoint) => {
                      const room    = parseRoomFromDetail(p.subscriber.address_detail);
                      const status  = loggedPoints[p.id];
                      const isDone  = status === "delivered";
                      const isSkip  = p.is_suspended || p.is_schedule_skip;
                      const isCurr  = p.id === currentPoint?.id;
                      const todayNp = p.subscriber.newspapers.filter(n => n.delivers_today);

                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-xl p-3"
                          style={{
                            border: `2px solid ${isCurr ? "#D97706" : isDone ? "#86EFAC" : "var(--border-default)"}`,
                            backgroundColor: isDone ? "#F0FDF4" : isCurr ? "#FFFBEB" : isSkip ? "var(--color-gray-50)" : "white",
                          }}
                        >
                          {/* Room badge */}
                          <div
                            className="flex-shrink-0 rounded-lg font-bold flex items-center justify-center"
                            style={{
                              minWidth: "52px", height: "34px", padding: "0 8px",
                              backgroundColor: isDone ? "#22C55E" : isSkip ? "#D1D5DB" : isCurr ? "#D97706" : "var(--color-gray-200)",
                              color: isDone || isCurr ? "white" : isSkip ? "#6B7280" : "var(--text-primary)",
                              fontSize: "12px",
                            }}
                          >
                            {room ?? `#${displaySeqMap.get(p.id) ?? p.sequence_order}`}
                          </div>

                          {/* Subscriber info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate" style={{ fontSize: "var(--text-sm)", color: isDone || isSkip ? "var(--text-muted)" : "var(--text-primary)" }}>
                              {p.subscriber.name}様
                            </div>
                            {!isDone && !isSkip && todayNp.length > 0 && (
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                📰 {todayNp.map(n => `${n.name}×${n.today_quantity ?? n.quantity}`).join("　")}
                              </div>
                            )}
                            {!isDone && !isSkip && p.subscriber.delivery_note && (
                              <div style={{ fontSize: "11px", color: "#B45309" }}>📝 {p.subscriber.delivery_note}</div>
                            )}
                          </div>

                          {/* Action */}
                          {isDone && <span style={{ fontSize: "18px", color: "#22C55E", flexShrink: 0 }}>✓</span>}
                          {isSkip && <span style={{ fontSize: "11px", color: "var(--color-gray-400)", flexShrink: 0 }}>{p.is_schedule_skip ? "今日なし" : "留守"}</span>}
                          {!isDone && !isSkip && (
                            <button
                              onClick={() => {
                                if (!activeDelivery) return;
                                logMutation.mutate({ pointId: p.id, status: "delivered" });
                              }}
                              disabled={logMutation.isPending}
                              className="flex-shrink-0 px-3 py-2 rounded-xl font-bold text-white disabled:opacity-50"
                              style={{ backgroundColor: "#22C55E", fontSize: "13px", minWidth: "52px" }}
                            >
                              完了
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* All rooms done */}
                  {allBldDone && !allDone && (
                    <div
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{ backgroundColor: "#F0FDF4", border: "1.5px solid #86EFAC" }}
                    >
                      <span style={{ fontSize: "24px" }}>🎉</span>
                      <div>
                        <div className="font-bold" style={{ color: "#166534" }}>このビルの配達完了！</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "#4B5563" }}>次の配達先へ進んでください</div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : allDone ? (
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
                  #{displaySeqMap.get(currentPoint.id) ?? currentPoint.sequence_order}
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

              {/* ── Newspapers — today only ── */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                style={{ backgroundColor: "var(--color-gray-50)", fontSize: "var(--text-base)" }}
              >
                <span>📰</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {currentPoint.subscriber.newspapers
                    .filter(n => n.delivers_today)
                    .map((n) => `${n.name} ×${n.today_quantity ?? n.quantity}`)
                    .join("　")}
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
