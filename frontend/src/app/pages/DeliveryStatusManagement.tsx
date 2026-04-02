import { useState } from "react";
import { ArrowLeft, Search, CheckCircle, XCircle, Home as HomeIcon } from "lucide-react";
import { useNavigate } from "react-router";

type DeliveryStatus = "active" | "stopped" | "absent";

interface DeliveryPoint {
  id: number;
  number: number;
  name: string;
  address: string;
  building: string;
  newspaper: string;
  status: DeliveryStatus;
}

export function DeliveryStatusManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | "all">("all");

  // Mock data - trong thực tế sẽ lấy từ API
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([
    {
      id: 1,
      number: 1,
      name: "田中 太郎",
      address: "下関市○○町1-2-3",
      building: "ライオンズマンション 301",
      newspaper: "朝日新聞朝刊",
      status: "active",
    },
    {
      id: 2,
      number: 2,
      name: "山田 花子",
      address: "下関市△△町2-3-4",
      building: "グランドメゾン 205",
      newspaper: "���日新聞朝刊",
      status: "active",
    },
    {
      id: 3,
      number: 3,
      name: "佐藤 次郎",
      address: "下関市□□町3-4-5",
      building: "パークハイツ 102",
      newspaper: "朝日新聞朝刊",
      status: "stopped",
    },
    {
      id: 4,
      number: 4,
      name: "鈴木 美咲",
      address: "下関市◇◇町4-5-6",
      building: "シティハウス 401",
      newspaper: "朝日新聞朝刊",
      status: "absent",
    },
    {
      id: 5,
      number: 5,
      name: "高橋 健太",
      address: "下関市☆☆町5-6-7",
      building: "レジデンス 303",
      newspaper: "朝日新聞朝刊",
      status: "active",
    },
  ]);

  const statusConfig = {
    active: {
      label: "入れ",
      labelEn: "Active",
      color: "var(--color-success-500)",
      bgColor: "var(--color-success-50)",
      icon: CheckCircle,
    },
    stopped: {
      label: "止め",
      labelEn: "Stopped",
      color: "var(--color-gray-600)",
      bgColor: "var(--color-gray-100)",
      icon: XCircle,
    },
    absent: {
      label: "留守止め",
      labelEn: "Absent",
      color: "var(--color-warning-600)",
      bgColor: "var(--color-warning-50)",
      icon: HomeIcon,
    },
  };

  const updateStatus = (pointId: number, newStatus: DeliveryStatus) => {
    setDeliveryPoints((points) =>
      points.map((point) =>
        point.id === pointId ? { ...point, status: newStatus } : point
      )
    );
  };

  const filteredPoints = deliveryPoints.filter((point) => {
    const matchesSearch =
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.building.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || point.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: deliveryPoints.length,
    active: deliveryPoints.filter((p) => p.status === "active").length,
    stopped: deliveryPoints.filter((p) => p.status === "stopped").length,
    absent: deliveryPoints.filter((p) => p.status === "absent").length,
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      {/* Header */}
      <header
        className="bg-white border-b sticky top-0 z-20"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-3 px-4" style={{ height: "56px" }}>
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
            配達状態管理
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-2 px-3 rounded-lg border"
            style={{
              height: "44px",
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <Search size={20} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="名前、住所で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{
                fontSize: "var(--text-base)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className="px-4 py-2 rounded-full whitespace-nowrap font-medium"
            style={{
              backgroundColor:
                filterStatus === "all"
                  ? "var(--color-primary-500)"
                  : "var(--color-gray-100)",
              color:
                filterStatus === "all"
                  ? "white"
                  : "var(--text-secondary)",
              fontSize: "var(--text-sm)",
            }}
          >
            全て ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className="px-4 py-2 rounded-full whitespace-nowrap font-medium"
            style={{
              backgroundColor:
                filterStatus === "active"
                  ? statusConfig.active.color
                  : "var(--color-gray-100)",
              color:
                filterStatus === "active"
                  ? "white"
                  : "var(--text-secondary)",
              fontSize: "var(--text-sm)",
            }}
          >
            入れ ({statusCounts.active})
          </button>
          <button
            onClick={() => setFilterStatus("stopped")}
            className="px-4 py-2 rounded-full whitespace-nowrap font-medium"
            style={{
              backgroundColor:
                filterStatus === "stopped"
                  ? statusConfig.stopped.color
                  : "var(--color-gray-100)",
              color:
                filterStatus === "stopped"
                  ? "white"
                  : "var(--text-secondary)",
              fontSize: "var(--text-sm)",
            }}
          >
            止め ({statusCounts.stopped})
          </button>
          <button
            onClick={() => setFilterStatus("absent")}
            className="px-4 py-2 rounded-full whitespace-nowrap font-medium"
            style={{
              backgroundColor:
                filterStatus === "absent"
                  ? statusConfig.absent.color
                  : "var(--color-gray-100)",
              color:
                filterStatus === "absent"
                  ? "white"
                  : "var(--text-secondary)",
              fontSize: "var(--text-sm)",
            }}
          >
            留守止め ({statusCounts.absent})
          </button>
        </div>
      </header>

      {/* Delivery Points List */}
      <div className="p-4 space-y-3">
        {filteredPoints.length === 0 ? (
          <div className="text-center py-12">
            <Search
              size={48}
              style={{ color: "var(--text-muted)" }}
              className="mx-auto mb-3"
            />
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--text-secondary)",
              }}
            >
              該当する配達先がありません
            </p>
          </div>
        ) : (
          filteredPoints.map((point) => {
            const config = statusConfig[point.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={point.id}
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 border-b"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: config.bgColor,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-bold"
                        style={{
                          fontSize: "var(--text-lg)",
                          color: "var(--color-primary-500)",
                        }}
                      >
                        #{point.number}
                      </span>
                      <span
                        className="font-bold"
                        style={{
                          fontSize: "var(--text-lg)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {point.name} 様
                      </span>
                    </div>
                    <div
                      className="px-2 py-1 rounded-full flex items-center gap-1"
                      style={{
                        backgroundColor: config.color,
                      }}
                    >
                      <StatusIcon size={14} className="text-white" />
                      <span
                        className="text-white font-semibold"
                        style={{ fontSize: "var(--text-xs)" }}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <p>{point.address}</p>
                    <p className="font-medium">{point.building}</p>
                  </div>

                  <p
                    className="mt-2"
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    📰 {point.newspaper}
                  </p>
                </div>

                {/* Status Change Buttons */}
                <div className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => updateStatus(point.id, "active")}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1"
                    style={{
                      backgroundColor:
                        point.status === "active"
                          ? statusConfig.active.color
                          : statusConfig.active.bgColor,
                      color:
                        point.status === "active"
                          ? "white"
                          : statusConfig.active.color,
                      fontSize: "var(--text-sm)",
                      border:
                        point.status === "active"
                          ? "none"
                          : `1px solid ${statusConfig.active.color}`,
                    }}
                  >
                    <CheckCircle size={16} />
                    入れ
                  </button>

                  <button
                    onClick={() => updateStatus(point.id, "stopped")}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1"
                    style={{
                      backgroundColor:
                        point.status === "stopped"
                          ? statusConfig.stopped.color
                          : statusConfig.stopped.bgColor,
                      color:
                        point.status === "stopped"
                          ? "white"
                          : statusConfig.stopped.color,
                      fontSize: "var(--text-sm)",
                      border:
                        point.status === "stopped"
                          ? "none"
                          : `1px solid ${statusConfig.stopped.color}`,
                    }}
                  >
                    <XCircle size={16} />
                    止め
                  </button>

                  <button
                    onClick={() => updateStatus(point.id, "absent")}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1"
                    style={{
                      backgroundColor:
                        point.status === "absent"
                          ? statusConfig.absent.color
                          : statusConfig.absent.bgColor,
                      color:
                        point.status === "absent"
                          ? "white"
                          : statusConfig.absent.color,
                      fontSize: "var(--text-sm)",
                      border:
                        point.status === "absent"
                          ? "none"
                          : `1px solid ${statusConfig.absent.color}`,
                    }}
                  >
                    <HomeIcon size={16} />
                    留守止め
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info Card */}
      <div className="px-4 pb-4">
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: "var(--color-primary-50)",
            borderColor: "var(--color-primary-200)",
          }}
        >
          <p
            className="font-semibold mb-2"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-primary-700)",
            }}
          >
            ℹ️ 配達状態について
          </p>
          <div
            className="space-y-1"
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-primary-600)",
            }}
          >
            <p>
              <strong>入れ:</strong> 通常通り配達します
            </p>
            <p>
              <strong>止め:</strong> 配達を一時停止します
            </p>
            <p>
              <strong>留守止め:</strong> 不在のため配達を停止します
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
