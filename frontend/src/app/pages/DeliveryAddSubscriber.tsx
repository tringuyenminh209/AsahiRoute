import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Search, MapPin, Loader2, CheckCircle2, Plus, Minus, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deliveryService } from "../../services/delivery.service";
import { geocodeAddress, GeocodingResult } from "../../services/geocoding.service";
import { extractApiError } from "../../lib/api";

const WEEK_DAYS = [
  { label: "月", value: 1 }, { label: "火", value: 2 }, { label: "水", value: 3 },
  { label: "木", value: 4 }, { label: "金", value: 5 }, { label: "土", value: 6 },
  { label: "日", value: 7 },
];

// Re-center map when pin changes
function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.setView([lat, lng], 18);
  return null;
}

const PIN_ICON = L.divIcon({
  html: `<div style="
    width:32px;height:32px;background:#CC0000;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export function DeliveryAddSubscriber() {
  const navigate   = useNavigate();
  const { id }     = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Form state
  const [addressInput, setAddressInput] = useState("");
  const [geocodeResults, setGeocodeResults] = useState<GeocodingResult[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [name, setName]               = useState("");
  const [address, setAddress]         = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [deliveryNote, setDeliveryNote]   = useState("");
  const [sequenceMode, setSequenceMode]   = useState<"last" | "specify">("last");
  const [sequenceOrder, setSequenceOrder] = useState(1);

  // Newspaper types for this route
  const { data: npTypes = [], isLoading: npLoading } = useQuery({
    queryKey: ["route-newspaper-types", id],
    queryFn: () => deliveryService.getRouteNewspaperTypes(Number(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // np_type_id → quantity
  const [selectedNpTypes, setSelectedNpTypes] = useState<Record<number, number>>({});
  // np_type_id → delivery_days ([] = all days)
  const [npDeliveryDays, setNpDeliveryDays] = useState<Record<number, number[]>>({});
  // which newspaper panels are expanded (for day picker)
  const [expandedNp, setExpandedNp] = useState<Record<number, boolean>>({});

  // Fetch route total_points for sequence order display
  const today = new Date().toISOString().split("T")[0];
  const { data: routes = [] } = useQuery({
    queryKey: ["my-routes", today],
    queryFn: () => deliveryService.getMyRoutes(today),
    staleTime: 0,
  });
  const route = routes.find((r: any) => String(r.id) === id);

  // Geocode handler
  const handleGeocode = async () => {
    if (!addressInput.trim()) return;
    setIsGeocoding(true);
    setGeocodeResults([]);
    try {
      const results = await geocodeAddress(addressInput);
      if (results.length === 0) {
        toast.error("住所が見つかりませんでした。より詳しい住所を入力してください。");
      } else {
        setGeocodeResults(results);
        // Auto-select first result
        const first = results[0];
        setPinLocation({ lat: first.lat, lng: first.lng });
        setAddress(first.title);
        if (!addressInput.includes("〒")) {
          setAddressInput(first.title);
        }
      }
    } catch {
      toast.error("住所検索に失敗しました");
    } finally {
      setIsGeocoding(false);
    }
  };

  const selectResult = (r: GeocodingResult) => {
    setPinLocation({ lat: r.lat, lng: r.lng });
    setAddress(r.title);
    setAddressInput(r.title);
    setGeocodeResults([]);
  };

  // Submit mutation
  const addMutation = useMutation({
    mutationFn: () => {
      const newspapers = Object.entries(selectedNpTypes)
        .filter(([, qty]) => qty > 0)
        .map(([npTypeId, quantity]) => {
          const days = npDeliveryDays[Number(npTypeId)] ?? [];
          return {
            newspaper_type_id: Number(npTypeId),
            quantity,
            delivery_days: days.length === 0 ? null : days,
          };
        });

      if (newspapers.length === 0) throw new Error("新聞を1つ以上選択してください");
      if (!name.trim()) throw new Error("お名前を入力してください");
      if (!address.trim()) throw new Error("住所を入力してください");

      return deliveryService.addSubscriberToRoute(Number(id), {
        name: name.trim(),
        address: address.trim(),
        address_detail: addressDetail.trim() || undefined,
        lat: pinLocation?.lat,
        lng: pinLocation?.lng,
        delivery_note: deliveryNote.trim() || undefined,
        sequence_order: sequenceMode === "specify" ? sequenceOrder : undefined,
        newspapers,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-routes"] });
      toast.success(`${name}様 を #${data.sequence_order} に追加しました`);
      navigate(-1);
    },
    onError: (err: any) => {
      const msg = err.message || extractApiError(err);
      toast.error(msg);
    },
  });

  const totalPoints = route?.total_points ?? 0;

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 bg-white border-b sticky top-0 z-10"
        style={{ height: "48px", borderColor: "var(--border-default)" }}
      >
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} style={{ color: "var(--text-primary)" }} />
        </button>
        <span className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
          配達先を追加
        </span>
        {route && (
          <span className="ml-auto text-xs" style={{ color: "var(--text-secondary)" }}>
            {route.name}
          </span>
        )}
      </header>

      <div className="p-4 space-y-4">

        {/* ── Step 1: Address search ── */}
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center text-xs font-bold">1</span>
            住所を検索
          </h2>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
              placeholder="〒555-0024 大阪府大阪市西淀川区野里２丁目..."
              className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--border-default)",
                fontSize: "var(--text-sm)",
                color: "var(--text-primary)",
                "--tw-ring-color": "var(--color-primary-500)",
              } as any}
            />
            <button
              onClick={handleGeocode}
              disabled={isGeocoding || !addressInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary-500)", fontSize: "var(--text-sm)", flexShrink: 0 }}
            >
              {isGeocoding ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              検索
            </button>
          </div>

          {/* Geocode results dropdown */}
          {geocodeResults.length > 1 && (
            <div className="border rounded-lg overflow-hidden mb-2" style={{ borderColor: "var(--border-default)" }}>
              {geocodeResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(r)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--color-gray-50)] border-b last:border-b-0"
                  style={{ borderColor: "var(--color-gray-100)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}
                >
                  <MapPin size={14} style={{ color: "var(--color-primary-500)", flexShrink: 0 }} />
                  {r.title}
                </button>
              ))}
            </div>
          )}

          {/* Map preview */}
          {pinLocation ? (
            <div className="rounded-xl overflow-hidden" style={{ height: "180px" }}>
              <MapContainer
                center={[pinLocation.lat, pinLocation.lng]}
                zoom={18}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://mt{s}.google.com/vt/lyrs=m&hl=ja&gl=JP&x={x}&y={y}&z={z}"
                  subdomains="0123"
                  maxNativeZoom={20}
                />
                <MapCenter lat={pinLocation.lat} lng={pinLocation.lng} />
                <Marker position={[pinLocation.lat, pinLocation.lng]} icon={PIN_ICON} />
              </MapContainer>
            </div>
          ) : (
            <div
              className="rounded-xl flex items-center justify-center gap-2"
              style={{ height: "100px", backgroundColor: "var(--color-gray-50)", border: "2px dashed var(--color-gray-200)" }}
            >
              <MapPin size={20} style={{ color: "var(--color-gray-300)" }} />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                住所を検索するとここに地図が表示されます
              </span>
            </div>
          )}

          {pinLocation && (
            <p className="mt-2 text-xs flex items-center gap-1" style={{ color: "var(--color-success-600)" }}>
              <CheckCircle2 size={12} />
              位置確認済み ({pinLocation.lat.toFixed(6)}, {pinLocation.lng.toFixed(6)})
            </p>
          )}
        </div>

        {/* ── Step 2: Subscriber info ── */}
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center text-xs font-bold">2</span>
            お客様情報
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                お名前 <span style={{ color: "var(--color-danger-500)" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="田中 太郎"
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--border-default)", fontSize: "var(--text-sm)" } as any}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                住所 <span style={{ color: "var(--color-danger-500)" }}>*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="大阪府大阪市西淀川区野里..."
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--border-default)", fontSize: "var(--text-sm)" } as any}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                建物名・部屋番号
              </label>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="野里マンション 203号室"
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--border-default)", fontSize: "var(--text-sm)" } as any}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                配達メモ
              </label>
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="郵便受けに投函、犬あり注意など"
                rows={2}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: "var(--border-default)", fontSize: "var(--text-sm)" } as any}
              />
            </div>
          </div>
        </div>

        {/* ── Step 3: Newspapers ── */}
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center text-xs font-bold">3</span>
            購読新聞
          </h2>

          {npLoading ? (
            <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-secondary)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: "var(--text-sm)" }}>読み込み中...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Morning section */}
              {["morning", "evening"].map((timeSlot) => {
                const group = npTypes.filter((np) => np.delivery_time === timeSlot);
                if (group.length === 0) return null;
                return (
                  <div key={timeSlot}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      {timeSlot === "morning" ? "▲ 朝刊" : "▽ 夕刊"}
                    </p>
                    {group.map((np) => {
                      const qty = selectedNpTypes[np.id] ?? 0;
                      const isSelected = qty > 0;
                      const days = npDeliveryDays[np.id] ?? [];
                      const isExpanded = expandedNp[np.id] ?? false;

                      return (
                        <div
                          key={np.id}
                          className="rounded-lg border mb-1.5 overflow-hidden transition-colors"
                          style={{
                            borderColor: isSelected ? "var(--color-primary-500)" : "var(--border-default)",
                            backgroundColor: isSelected ? "#FFF5F5" : "white",
                          }}
                        >
                          {/* Row: name + quantity controls */}
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="font-medium" style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                              {np.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {isSelected ? (
                                <>
                                  <button
                                    onClick={() => setSelectedNpTypes(prev => {
                                      const next = { ...prev };
                                      if (next[np.id] <= 1) { delete next[np.id]; }
                                      else next[np.id]--;
                                      return next;
                                    })}
                                    className="w-7 h-7 rounded-full border flex items-center justify-center"
                                    style={{ borderColor: "var(--color-primary-500)", color: "var(--color-primary-500)" }}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="font-bold w-5 text-center" style={{ fontSize: "var(--text-sm)", color: "var(--color-primary-500)" }}>
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => setSelectedNpTypes(prev => ({ ...prev, [np.id]: (prev[np.id] ?? 0) + 1 }))}
                                    className="w-7 h-7 rounded-full border flex items-center justify-center"
                                    style={{ borderColor: "var(--color-primary-500)", color: "var(--color-primary-500)" }}
                                  >
                                    <Plus size={14} />
                                  </button>
                                  {/* Expand/collapse day picker */}
                                  <button
                                    onClick={() => setExpandedNp(prev => ({ ...prev, [np.id]: !prev[np.id] }))}
                                    className="w-7 h-7 rounded-full border flex items-center justify-center ml-1"
                                    style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedNpTypes(prev => ({ ...prev, [np.id]: 1 }));
                                    setExpandedNp(prev => ({ ...prev, [np.id]: true }));
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                                  style={{ backgroundColor: "var(--color-primary-500)" }}
                                >
                                  追加
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Day picker — visible when selected + expanded */}
                          {isSelected && isExpanded && (
                            <div className="px-3 pb-3 border-t" style={{ borderColor: "var(--border-default)", backgroundColor: "#FFF5F5" }}>
                              <p className="text-xs mt-2 mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                                配達曜日
                              </p>
                              <div className="flex gap-1 flex-wrap">
                                {/* 全日 button */}
                                <button
                                  onClick={() => setNpDeliveryDays(prev => ({ ...prev, [np.id]: [] }))}
                                  className="px-2 py-1 rounded-md text-xs font-bold border transition-colors"
                                  style={{
                                    borderColor: days.length === 0 ? "var(--color-primary-500)" : "var(--border-default)",
                                    backgroundColor: days.length === 0 ? "var(--color-primary-500)" : "white",
                                    color: days.length === 0 ? "white" : "var(--text-secondary)",
                                  }}
                                >
                                  全日
                                </button>
                                {WEEK_DAYS.map(({ label, value }) => {
                                  const active = days.includes(value);
                                  const isSat = value === 6;
                                  const isSun = value === 7;
                                  return (
                                    <button
                                      key={value}
                                      onClick={() => setNpDeliveryDays(prev => {
                                        const cur = prev[np.id] ?? [];
                                        const next = active
                                          ? cur.filter(d => d !== value)
                                          : [...cur, value].sort((a, b) => a - b);
                                        return { ...prev, [np.id]: next };
                                      })}
                                      className="w-8 h-8 rounded-md text-xs font-bold border transition-colors"
                                      style={{
                                        borderColor: active ? (isSat ? "#2563EB" : isSun ? "#DC2626" : "var(--color-primary-500)") : "var(--border-default)",
                                        backgroundColor: active ? (isSat ? "#EFF6FF" : isSun ? "#FEF2F2" : "#FFF5F5") : "white",
                                        color: active ? (isSat ? "#2563EB" : isSun ? "#DC2626" : "var(--color-primary-500)") : (isSat ? "#2563EB" : isSun ? "#DC2626" : "var(--text-secondary)"),
                                      }}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                              {days.length > 0 && (
                                <p className="mt-1.5 text-xs" style={{ color: "var(--color-primary-500)" }}>
                                  {days.map(d => WEEK_DAYS.find(w => w.value === d)?.label).join("・")}曜日のみ配達
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Step 4: Sequence order ── */}
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center text-xs font-bold">4</span>
            配達順
          </h2>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{ borderColor: sequenceMode === "last" ? "var(--color-primary-500)" : "var(--border-default)", backgroundColor: sequenceMode === "last" ? "#FFF5F5" : "white" }}>
              <input
                type="radio"
                checked={sequenceMode === "last"}
                onChange={() => setSequenceMode("last")}
                style={{ accentColor: "var(--color-primary-500)" }}
              />
              <div>
                <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>ルートの最後に追加</div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>現在 {totalPoints}件 → {totalPoints + 1}番目</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{ borderColor: sequenceMode === "specify" ? "var(--color-primary-500)" : "var(--border-default)", backgroundColor: sequenceMode === "specify" ? "#FFF5F5" : "white" }}>
              <input
                type="radio"
                checked={sequenceMode === "specify"}
                onChange={() => setSequenceMode("specify")}
                style={{ accentColor: "var(--color-primary-500)" }}
              />
              <div className="flex-1">
                <div className="font-medium text-sm mb-1" style={{ color: "var(--text-primary)" }}>順番を指定</div>
                {sequenceMode === "specify" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={totalPoints + 1}
                      value={sequenceOrder}
                      onChange={(e) => setSequenceOrder(Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-sm text-center focus:outline-none"
                      style={{ borderColor: "var(--color-primary-500)" }}
                    />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                      番目 (1〜{totalPoints + 1})
                    </span>
                  </div>
                )}
              </div>
            </label>
          </div>

          {sequenceMode === "specify" && (
            <div className="mt-2 flex items-start gap-2 px-2 py-2 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
              <AlertCircle size={14} style={{ color: "#D97706", flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "11px", color: "#92400E" }}>
                指定した順番以降の既存の配達先は自動的に1つずつ後ろにずれます。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t" style={{ borderColor: "var(--border-default)" }}>
        {!pinLocation && (
          <p className="text-center text-xs mb-2" style={{ color: "var(--color-warning-600)" }}>
            ⚠ 住所を検索して位置を確認すると地図に正確に表示されます
          </p>
        )}
        <button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !name.trim() || !address.trim() || Object.keys(selectedNpTypes).length === 0}
          className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ height: "56px", backgroundColor: "var(--color-primary-500)", fontSize: "var(--text-lg)" }}
        >
          {addMutation.isPending
            ? <><Loader2 size={20} className="animate-spin" /> 追加中...</>
            : <><CheckCircle2 size={22} /> ルートに追加</>}
        </button>
      </div>
    </div>
  );
}
