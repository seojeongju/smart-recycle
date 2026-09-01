import { NavLink } from "react-router";

const tabs = [
  { to: "/", label: "인식", icon: CameraIcon, end: true },
  { to: "/search", label: "검색", icon: SearchIcon },
  { to: "/map", label: "지도", icon: MapIcon },
  { to: "/me", label: "마이", icon: UserIcon },
] as const;

export function BottomNav() {
  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-brand-line bg-white">
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={"end" in tab ? Boolean(tab.end) : false}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  isActive ? "text-brand" : "text-mute"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon active={isActive} />
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CameraIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2.1l1.2-1.6A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.2.4L15.4 6h2.1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12.5"
        r="3.2"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="6.2"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
      />
      <path
        d="M16 16.5 20 20.5"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="10.5"
        r="2.2"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
      />
      <path
        d="M5.5 19c1.2-3.2 3.5-4.7 6.5-4.7s5.3 1.5 6.5 4.7"
        stroke={active ? "#2563EB" : "#64748B"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
