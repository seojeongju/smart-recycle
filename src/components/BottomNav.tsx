import { NavLink } from "react-router";

const tabs = [
  { to: "/", label: "홈", icon: HomeIcon, end: true },
  { to: "/search", label: "검색", icon: SearchIcon },
  { to: "/map", label: "지도", icon: MapIcon },
  { to: "/me", label: "마이", icon: UserIcon },
] as const;

export function BottomNav() {
  return (
    <nav className="safe-bottom z-20 border-t border-black/5 bg-white">
      <ul className="grid grid-cols-4 px-2">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={"end" in tab ? Boolean(tab.end) : false}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isActive ? "bg-brand" : "bg-transparent"
                    }`}
                  >
                    <tab.icon active={isActive} />
                  </span>
                  <span className={isActive ? "text-ink" : "text-mute"}>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  const stroke = active ? "#111111" : "#8D8D8D";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  const stroke = active ? "#111111" : "#8D8D8D";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.2" stroke={stroke} strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  const stroke = active ? "#111111" : "#8D8D8D";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"
        stroke={stroke}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10.5" r="2.2" stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  const stroke = active ? "#111111" : "#8D8D8D";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke={stroke} strokeWidth="1.8" />
      <path
        d="M5.5 19c1.2-3.2 3.5-4.7 6.5-4.7s5.3 1.5 6.5 4.7"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
