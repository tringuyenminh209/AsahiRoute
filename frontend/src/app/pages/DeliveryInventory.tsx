import { ArrowLeft, Newspaper, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { deliveryService } from "../../services/delivery.service";

const COLORS = ["#CC0000", "#DC2626", "#991B1B", "#B91C1C", "#7F1D1D"];

export function DeliveryInventory() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["my-routes", today],
    queryFn: () => deliveryService.getMyRoutes(today),
  });

  // Aggregate newspaper counts from all active route points
  const { newspapers, totalPapers } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const route of routes) {
      for (const point of route.points) {
        if (point.is_suspended) continue;
        for (const n of point.subscriber.newspapers) {
          counts[n.name] = (counts[n.name] ?? 0) + n.quantity;
        }
      }
    }
    const newspapers = Object.entries(counts).map(([name, quantity], i) => ({
      id: i + 1,
      name,
      quantity,
      color: COLORS[i % COLORS.length],
    }));
    const totalPapers = newspapers.reduce((s, n) => s + n.quantity, 0);
    return { newspapers, totalPapers };
  }, [routes]);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "var(--surface-page)" }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 bg-white border-b sticky top-0 z-10"
        style={{ height: "56px", borderColor: "var(--border-default)" }}
      >
        <button onClick={() => navigate("/mobile")}>
          <ArrowLeft size={24} style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="font-semibold" style={{ fontSize: "var(--text-xl)", color: "var(--text-primary)" }}>
          配達物一覧
        </h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary-500)" }} />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Summary Card */}
          <div
            className="rounded-xl p-6 border"
            style={{ backgroundColor: "var(--color-primary-500)", borderColor: "var(--color-primary-600)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
                <Newspaper size={24} className="text-white" />
              </div>
              <h2 className="font-semibold text-white" style={{ fontSize: "var(--text-lg)" }}>
                本日の配達物
              </h2>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
              <div className="text-white mb-1" style={{ fontSize: "var(--text-sm)", opacity: 0.9 }}>
                総新聞数
              </div>
              <div className="text-white font-bold" style={{ fontSize: "32px" }}>
                {totalPapers}
              </div>
              <div className="text-white" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
                部 / {routes.length}ルート
              </div>
            </div>
          </div>

          {/* Newspaper breakdown */}
          {newspapers.length > 0 ? (
            <>
              <h3 className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                📰 新聞別内訳
              </h3>
              <div className="space-y-3">
                {newspapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="rounded-xl border overflow-hidden"
                    style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ borderLeft: `4px solid ${paper.color}` }}
                    >
                      <h4 className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
                        {paper.name}
                      </h4>
                      <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-primary-50)" }}>
                        <div className="font-bold" style={{ fontSize: "24px", color: "var(--color-primary-700)" }}>
                          {paper.quantity}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-primary-600)" }}>部</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10" style={{ color: "var(--text-secondary)" }}>
              <Newspaper size={40} className="mx-auto mb-3 opacity-40" />
              <p style={{ fontSize: "var(--text-base)" }}>本日の配達物がありません</p>
            </div>
          )}

          {/* Hint */}
          <div className="rounded-lg p-4 border" style={{ backgroundColor: "var(--color-gray-50)", borderColor: "var(--color-gray-200)" }}>
            <p className="mb-2" style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
              💡 <strong>ヒント</strong>
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              配達前に数量を確認してください。留守止め分は除外済みです。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
