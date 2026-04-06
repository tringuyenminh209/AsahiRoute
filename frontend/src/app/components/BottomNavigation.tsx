import { Home, Map, Newspaper, User } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useDeliveryStore } from "../../stores/delivery.store";

export function BottomNavigation() {
  const location = useLocation();
  const { activeDelivery } = useDeliveryStore();

  const routePath = activeDelivery?.routeId
    ? `/mobile/route/${activeDelivery.routeId}/map`
    : "/mobile";

  const navItems = [
    { id: "home",    icon: Home,      label: "ホーム",   path: "/mobile" },
    { id: "route",   icon: Map,       label: "ルート",   path: routePath },
    { id: "items",   icon: Newspaper, label: "配達物",   path: "/mobile/delivery-inventory" },
    { id: "profile", icon: User,      label: "プロフィール", path: "/mobile/profile" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t z-30"
      style={{ 
        height: '64px',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex h-full items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
                          (item.path === "/mobile" && location.pathname === "/mobile") ||
                          (item.label === "ルート" && location.pathname.includes("/route/"));
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  style={{ 
                    color: isActive ? 'var(--color-primary-500)' : 'var(--text-secondary)',
                    strokeWidth: isActive ? 2.5 : 2,
                  }} 
                />
              </div>
              <span 
                style={{
                  fontSize: '10px',
                  marginTop: '2px',
                  color: isActive ? 'var(--color-primary-500)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}