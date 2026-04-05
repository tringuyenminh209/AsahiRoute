import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Navigation, CheckCircle2, RotateCcw, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "../../services/delivery.service";

export function LearnMode() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const [currentPoint, setCurrentPoint] = useState(1);
  const [speed, setSpeed]               = useState(1);
  const [isCompleted, setIsCompleted]   = useState(false);

  // Track elapsed time for the completion screen
  const startTimeRef = useRef(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const { data: routes = [] } = useQuery({
    queryKey: ["my-routes", today],
    queryFn:  () => deliveryService.getMyRoutes(today),
  });

  const route          = routes.find((r: { id: number }) => String(r.id) === id);
  const totalPoints    = route?.total_points ?? 0;
  const activePoints   = route?.points.filter((p: { is_suspended: boolean }) => !p.is_suspended) ?? [];
  const currentPointData = activePoints[currentPoint - 1]?.subscriber ?? null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  };

  const handleRestart = () => {
    setCurrentPoint(1);
    setIsCompleted(false);
    startTimeRef.current = Date.now();
    setElapsedSec(0);
  };

  // ── Completion screen ────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: "var(--surface-page)" }}
      >
        {/* Celebration icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: "#EDE9FE" }}
        >
          <CheckCircle2 size={52} style={{ color: "var(--color-status-in-progress)" }} />
        </div>

        <h1 className="font-bold mb-2 text-center" style={{ fontSize: "28px", color: "var(--text-primary)" }}>
          練習完了！
        </h1>
        <p className="mb-8 text-center" style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
          {route?.area?.name ?? "ルート"}の練習が終わりました
        </p>

        {/* Stats */}
        <div
          className="w-full rounded-2xl p-6 mb-8 flex justify-around"
          style={{ backgroundColor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          <div className="text-center">
            <p className="font-bold" style={{ fontSize: "32px", color: "var(--color-status-in-progress)" }}>
              {totalPoints}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>確認した地点</p>
          </div>
          <div className="w-px" style={{ backgroundColor: "var(--border-default)" }} />
          <div className="text-center">
            <p className="font-bold" style={{ fontSize: "32px", color: "var(--color-status-in-progress)" }}>
              {formatTime(elapsedSec)}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>練習時間</p>
          </div>
        </div>

        {/* Action buttons */}
        <button
          onClick={() => navigate("/mobile")}
          className="w-full rounded-xl font-bold text-white flex items-center justify-center gap-2 mb-3"
          style={{ height: "56px", backgroundColor: "var(--color-status-in-progress)", fontSize: "var(--text-lg)" }}
        >
          <Home size={20} />
          ホームへ戻る
        </button>
        <button
          onClick={handleRestart}
          className="w-full rounded-xl font-medium flex items-center justify-center gap-2 border"
          style={{ height: "48px", color: "var(--color-status-in-progress)", borderColor: "var(--color-status-in-progress)", fontSize: "var(--text-base)", backgroundColor: "white" }}
        >
          <RotateCcw size={18} />
          もう一度練習する
        </button>
      </div>
    );
  }

  // ── Normal practice screen ───────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col">
      {/* Purple Header */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: "48px", backgroundColor: "var(--color-status-in-progress)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/mobile")}>
            <ArrowLeft size={20} className="text-white" />
          </button>
          <span className="font-semibold text-white" style={{ fontSize: "var(--text-base)" }}>
            🎓 学習モード
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-white" style={{ fontSize: "var(--text-base)" }}>
            {currentPoint} / {totalPoints}
          </span>
          <button className="text-white text-sm" onClick={() => navigate("/mobile")}>終了</button>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: "4px", backgroundColor: "#DDD6FE" }}>
        <div
          style={{
            height: "100%",
            width: `${totalPoints > 0 ? (currentPoint / totalPoints) * 100 : 0}%`,
            backgroundColor: "var(--color-status-in-progress)",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Practice Mode Banner */}
      <div
        className="px-4 py-2 text-center flex-shrink-0"
        style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontSize: "var(--text-sm)" }}
      >
        📚 練習モードです。実際の配達記録には反映されません。
      </div>

      {/* Map Area */}
      <div className="flex-1 relative" style={{ backgroundColor: "#E5E3DF" }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Navigation
              size={48}
              style={{ color: "var(--color-status-in-progress)" }}
              className="mx-auto mb-2"
            />
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              学習用地図エリア
            </p>
          </div>
        </div>

        {/* Speed Control */}
        <div
          className="absolute top-4 right-4 rounded-lg p-2"
          style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
        >
          <div className="mb-1" style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>速度</div>
          <div className="flex gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded transition-all"
                style={{
                  fontSize: "var(--text-xs)",
                  backgroundColor: speed === s ? "var(--color-status-in-progress)" : "var(--color-gray-100)",
                  color: speed === s ? "white" : "var(--text-secondary)",
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white rounded-t-3xl shadow-2xl p-4 flex-shrink-0">
        {/* Navigation Hint */}
        <div
          className="rounded-lg p-3 mb-4"
          style={{ backgroundColor: "#EDE9FE", fontSize: "var(--text-sm)", color: "var(--color-status-in-progress)" }}
        >
          ↑ 200m直進 → 次の交差点を右折
        </div>

        {/* Delivery Point Info */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-bold" style={{ fontSize: "var(--text-2xl)", color: "var(--color-status-in-progress)" }}>
              #{currentPoint}
            </span>
            <span className="font-bold" style={{ fontSize: "var(--text-xl)", color: "var(--text-primary)" }}>
              {currentPointData ? `${currentPointData.name} 様` : "---"}
            </span>
          </div>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-gray-600)" }}>
            {currentPointData?.address ?? "---"}
            {currentPointData?.address_detail ? `　${currentPointData.address_detail}` : ""}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => currentPoint > 1 && setCurrentPoint(currentPoint - 1)}
            disabled={currentPoint <= 1}
            className="flex-1 py-3 rounded-lg font-medium border disabled:opacity-40"
            style={{
              backgroundColor: "white",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
              fontSize: "var(--text-sm)",
            }}
          >
            前へ
          </button>
          <button
            onClick={() => {
              if (currentPoint < totalPoints) {
                setCurrentPoint(currentPoint + 1);
              } else {
                setIsCompleted(true);
              }
            }}
            className="flex-1 py-3 rounded-lg font-bold text-white"
            style={{ backgroundColor: "var(--color-status-in-progress)", fontSize: "var(--text-base)" }}
          >
            {currentPoint < totalPoints ? "次へ" : "完了 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}
