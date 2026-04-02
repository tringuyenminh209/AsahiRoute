import { useState } from "react";
import { CircleSlash, Star, Route, Info } from "lucide-react";

export function Notifications() {
  const [selectedTab, setSelectedTab] = useState("all");

  const tabs = [
    { id: "all", label: "全て", count: 12 },
    { id: "suspended", label: "留守止め", count: 5 },
    { id: "new", label: "新規", count: 3 },
    { id: "route", label: "ルート変更", count: 2 },
    { id: "system", label: "システム", count: 2 },
  ];

  const notifications = [
    {
      id: 1,
      type: "suspended",
      icon: CircleSlash,
      iconBg: "var(--color-gray-100)",
      iconColor: "var(--color-gray-500)",
      title: "鈴木一郎様が留守止めになりました",
      detail: "期間: 4/1〜4/10（旅行）・A区域",
      time: "10分前",
      unread: true,
    },
    {
      id: 2,
      type: "new",
      icon: Star,
      iconBg: "#FEF3C7",
      iconColor: "var(--color-warning-500)",
      title: "新規配達先が追加されました",
      detail: "佐藤様・A区域 #45の後に挿入",
      time: "1時間前",
      unread: true,
    },
    {
      id: 3,
      type: "route",
      icon: Route,
      iconBg: "var(--color-primary-100)",
      iconColor: "var(--color-primary-500)",
      title: "ルートが最適化されました",
      detail: "所要時間が5分短縮される予定です",
      time: "2時間前",
      unread: true,
      action: "確認する →",
    },
    {
      id: 4,
      type: "suspended",
      icon: CircleSlash,
      iconBg: "var(--color-gray-100)",
      iconColor: "var(--color-gray-500)",
      title: "高橋様が留守止めになりました",
      detail: "期間: 4/2〜4/5（出張）・A区域",
      time: "昨日",
      unread: false,
    },
    {
      id: 5,
      type: "system",
      icon: Info,
      iconBg: "#DBEAFE",
      iconColor: "var(--color-info-500)",
      title: "アプリが更新されました",
      detail: "バージョン 1.0.1 の新機能を確認してください",
      time: "2日前",
      unread: false,
      action: "詳細を見る →",
    },
  ];

  return (
    <div 
      className="min-h-screen pb-20"
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
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-lg)' }}>🔔</span>
          <span 
            className="font-semibold"
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
            }}
          >
            通知
          </span>
        </div>
        <button
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-primary-500)',
          }}
        >
          すべて既読にする
        </button>
      </header>

      {/* Filter Tabs */}
      <div 
        className="overflow-x-auto bg-white border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className="px-4 py-3 whitespace-nowrap relative"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: selectedTab === tab.id 
                  ? 'var(--font-weight-semibold)' 
                  : 'var(--font-weight-normal)',
                color: selectedTab === tab.id 
                  ? 'var(--color-primary-500)' 
                  : 'var(--text-secondary)',
              }}
            >
              {tab.label}({tab.count})
              {selectedTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '2px',
                    backgroundColor: 'var(--color-primary-500)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div>
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className="flex gap-3 p-4 border-b"
              style={{
                borderColor: 'var(--color-gray-100)',
                backgroundColor: notification.unread ? 'var(--color-primary-50)' : 'white',
              }}
            >
              {/* Icon */}
              <div 
                className="flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: notification.iconBg,
                }}
              >
                <Icon size={16} style={{ color: notification.iconColor }} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p 
                  className="font-semibold mb-1"
                  style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {notification.title}
                </p>
                <p 
                  className="mb-1"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {notification.detail}
                </p>
                <div className="flex items-center justify-between">
                  <span 
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {notification.time}
                  </span>
                  {notification.action && (
                    <button
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-primary-500)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      {notification.action}
                    </button>
                  )}
                </div>
              </div>

              {/* Unread Indicator */}
              {notification.unread && (
                <div 
                  className="flex-shrink-0 rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--color-primary-500)',
                    marginTop: '8px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State (hidden when there are notifications) */}
      {/* <div className="flex flex-col items-center justify-center py-16">
        <div 
          className="rounded-full mb-4"
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--color-gray-200)',
          }}
        />
        <p 
          className="mb-2"
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
          }}
        >
          通知はありません
        </p>
        <p 
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          変更があるとここに表示されます
        </p>
      </div> */}
    </div>
  );
}
