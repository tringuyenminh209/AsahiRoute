import { ArrowLeft, Newspaper, FileText } from "lucide-react";
import { useNavigate } from "react-router";

export function DeliveryInventory() {
  const navigate = useNavigate();

  // Mock data - trong thực tế sẽ lấy từ API
  const deliveryData = {
    totalPapers: 156,
    totalChirashi: 312,
    newspapers: [
      {
        id: 1,
        name: "朝日新聞朝刊",
        nameEn: "Asahi Morning Edition",
        quantity: 89,
        chirashi: 178,
        color: "#CC0000",
      },
      {
        id: 2,
        name: "朝日新聞夕刊",
        nameEn: "Asahi Evening Edition",
        quantity: 45,
        chirashi: 90,
        color: "#DC2626",
      },
      {
        id: 3,
        name: "朝日新聞デジタル版",
        nameEn: "Asahi Digital Edition",
        quantity: 22,
        chirashi: 44,
        color: "#991B1B",
      },
    ],
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 bg-white border-b sticky top-0 z-10"
        style={{
          height: "56px",
          borderColor: "var(--border-default)",
        }}
      >
        <button onClick={() => navigate("/mobile")}>
          <ArrowLeft size={24} style={{ color: "var(--text-primary)" }} />
        </button>
        <h1
          className="font-semibold"
          style={{
            fontSize: "var(--text-xl)",
            color: "var(--text-primary)",
          }}
        >
          配達物一覧
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: "var(--color-primary-500)",
            borderColor: "var(--color-primary-600)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <Newspaper size={24} className="text-white" />
            </div>
            <h2
              className="font-semibold text-white"
              style={{ fontSize: "var(--text-lg)" }}
            >
              本日の配達物
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
            >
              <div
                className="text-white mb-1"
                style={{
                  fontSize: "var(--text-sm)",
                  opacity: 0.9,
                }}
              >
                総新聞数
              </div>
              <div
                className="text-white font-bold"
                style={{ fontSize: "32px" }}
              >
                {deliveryData.totalPapers}
              </div>
              <div
                className="text-white"
                style={{
                  fontSize: "var(--text-xs)",
                  opacity: 0.8,
                }}
              >
                部
              </div>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
            >
              <div
                className="text-white mb-1"
                style={{
                  fontSize: "var(--text-sm)",
                  opacity: 0.9,
                }}
              >
                総チラシ数
              </div>
              <div
                className="text-white font-bold"
                style={{ fontSize: "32px" }}
              >
                {deliveryData.totalChirashi}
              </div>
              <div
                className="text-white"
                style={{
                  fontSize: "var(--text-xs)",
                  opacity: 0.8,
                }}
              >
                枚
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div>
          <h3
            className="font-semibold mb-2"
            style={{
              fontSize: "var(--text-base)",
              color: "var(--text-secondary)",
            }}
          >
            📰 新聞別内訳
          </h3>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
            }}
          >
            あなたの担当エリアの配達物
          </p>
        </div>

        {/* Newspaper List */}
        <div className="space-y-3">
          {deliveryData.newspapers.map((paper) => (
            <div
              key={paper.id}
              className="rounded-xl border overflow-hidden"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              {/* Header with color stripe */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{
                  borderColor: "var(--border-default)",
                  borderLeft: `4px solid ${paper.color}`,
                }}
              >
                <div>
                  <h4
                    className="font-semibold"
                    style={{
                      fontSize: "var(--text-lg)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {paper.name}
                  </h4>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-secondary)",
                      marginTop: "2px",
                    }}
                  >
                    {paper.nameEn}
                  </p>
                </div>
                <div
                  className="text-center px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: "var(--color-primary-50)",
                  }}
                >
                  <div
                    className="font-bold"
                    style={{
                      fontSize: "24px",
                      color: "var(--color-primary-700)",
                    }}
                  >
                    {paper.quantity}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-primary-600)",
                    }}
                  >
                    部
                  </div>
                </div>
              </div>

              {/* Chirashi Info */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-gray-100)" }}
                >
                  <FileText
                    size={20}
                    style={{ color: "var(--color-primary-500)" }}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className="font-medium"
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    チラシ
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Flyers
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-bold"
                    style={{
                      fontSize: "var(--text-xl)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {paper.chirashi}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    枚
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Note */}
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: "var(--color-gray-50)",
            borderColor: "var(--color-gray-200)",
          }}
        >
          <p
            className="mb-2"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
            }}
          >
            💡 <strong>ヒント</strong>
          </p>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            配達前に数量を確認してください。チラシは新聞と一緒に配達します。
          </p>
        </div>
      </div>
    </div>
  );
}
