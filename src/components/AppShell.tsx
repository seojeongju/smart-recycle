import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { BottomNav } from "./BottomNav";
import { InstallBanner } from "./InstallBanner";
import { Onboarding } from "./Onboarding";

const KEY = "smart-recycle_onboarded_v3";

export function AppShell() {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setShowOnboarding(localStorage.getItem(KEY) !== "1");
  }, []);

  return (
    <div className="phone-shell relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-white">
      {showOnboarding ? (
        <Onboarding
          onDone={() => {
            localStorage.setItem(KEY, "1");
            setShowOnboarding(false);
          }}
        />
      ) : null}
      <main className="safe-top flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      {location.pathname === "/" ? <InstallBanner /> : null}
      <BottomNav />
    </div>
  );
}
