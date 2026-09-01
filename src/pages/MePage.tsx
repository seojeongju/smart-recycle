import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Sprout } from "../components/Sprout";
import type { MeUser } from "../types";

type Checkin = {
  id: string;
  checkin_date: string;
  points: number;
  name_ko: string | null;
};

export function MePage() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const me = await api<{ user: MeUser }>("/api/me");
    setUser(me.user);
    setNickname(me.user.nickname);
    const history = await api<{ checkins: Checkin[] }>("/api/checkins?limit=10");
    setCheckins(history.checkins);
  }

  useEffect(() => {
    void load();
  }, []);

  const week = useMemo(() => lastSevenDates(), []);

  async function saveName() {
    setSaving(true);
    try {
      await api("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <p className="px-5 pt-8 text-sm text-mute">불러오는 중...</p>;
  }

  const percent =
    user.level >= 10 ? 100 : Math.round((user.xpInLevel / 50) * 100);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">마이</h1>
      <div className="mt-4 rounded-3xl bg-brand-soft px-4 py-5">
        <Sprout level={user.level} nickname={user.nickname} />
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-brand">
            <span>경험치</span>
            <span>
              {user.xpInLevel} / {user.level >= 10 ? 50 : 50}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white py-3">
            <dt className="text-[11px] text-mute">포인트</dt>
            <dd className="mt-1 text-lg font-bold text-brand">{user.total_points}</dd>
          </div>
          <div className="rounded-2xl bg-white py-3">
            <dt className="text-[11px] text-mute">스트릭</dt>
            <dd className="mt-1 text-lg font-bold text-brand">{user.streak_count}일</dd>
          </div>
          <div className="rounded-2xl bg-white py-3">
            <dt className="text-[11px] text-mute">인증</dt>
            <dd className="mt-1 text-lg font-bold text-brand">{user.checkin_count}</dd>
          </div>
        </dl>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-bold">최근 7일</h2>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {week.map((day) => {
            const on = user.recent_dates.includes(day);
            return (
              <div key={day} className="text-center">
                <div
                  className={`mx-auto h-8 w-8 rounded-full ${on ? "bg-brand" : "bg-brand-line"}`}
                />
                <p className="mt-1 text-[10px] text-mute">{day.slice(5)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold">별명</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={nickname}
            maxLength={12}
            onChange={(event) => setNickname(event.target.value)}
            className="min-h-11 flex-1 rounded-xl border border-brand-line px-3 text-base outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => {
              void saveName();
            }}
            disabled={saving}
            className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white"
          >
            저장
          </button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold">최근 인증</h2>
        {checkins.length === 0 ? (
          <p className="mt-2 text-sm text-mute">아직 인증 기록이 없어요.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {checkins.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-2xl border border-brand-line px-4 py-3 text-sm"
              >
                <span>
                  <span className="block font-semibold">{row.name_ko ?? "품목"}</span>
                  <span className="text-xs text-mute">{row.checkin_date}</span>
                </span>
                <span className="font-semibold text-brand">+{row.points}P</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function lastSevenDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const shifted = new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000);
    dates.push(shifted.toISOString().slice(0, 10));
  }
  return dates;
}
