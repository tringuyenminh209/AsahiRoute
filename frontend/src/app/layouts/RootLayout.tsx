import { Outlet, useLocation } from "react-router";
import { BottomNavigation } from "../components/BottomNavigation";
import { SOSButton } from "../components/SOSButton";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function RootLayout() {
  const location = useLocation();
  
  // Hide bottom navigation on certain pages
  const hideBottomNav = location.pathname.includes("/mobile/route/") || 
                        location.pathname === "/mobile/sos" ||
                        location.pathname.includes("/mobile/delivery/");
  
  // Hide SOS button on SOS page
  const hideSOSButton = location.pathname === "/mobile/sos";

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-page)' }}>
        <Outlet />
        {!hideBottomNav && <BottomNavigation />}
        {!hideSOSButton && <SOSButton />}
      </div>
    </ErrorBoundary>
  );
}