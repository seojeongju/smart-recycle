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
      <h1 className="text-[26px] font-extrabold tracking-tight">마이</h1>

      <section className="mt-4 rounded-[24px] bg-brand px-5 py-5">
        <p className="text-sm font-semibold text-ink/70">내 포인트</p>
        <p className="mt-1 text-[34px] font-extrabold tracking-tight">
          {user.total_points.toLocaleString()}P
        </p>
        <div className="mt-3 flex items-center justify-between">
          <Sprout level={user.level} compact />
          <div className="min-w-[120px] text-right">
            <p className="text-xs font-bold">레벨 {user.level}</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-ink/70">
              {user.xpInLevel}/50 XP · {user.streak_count}일 연속
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-extrabold">최근 7일</h2>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {week.map((day) => {
            const on = user.recent_dates.includes(day);
            return (
              <div key={day} className="text-center">
                <div
                  className={`mx-auto h-9 w-9 rounded-full ${on ? "bg-brand" : "bg-surface"}`}
                />
                <p className="mt-1 text-[10px] text-mute">{day.slice(5)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-extrabold">프로필</h2>
        <div className="mt-3 rounded-[20px] bg-surface p-4">
          <label className="text-xs font-bold text-mute">별명</label>
          <div className="mt-2 flex gap-2">
            <input
              value={nickname}
              maxLength={12}
              onChange={(event) => setNickname(event.target.value)}
              className="field bg-white"
            />
            <button
              type="button"
              onClick={() => {
                void saveName();
              }}
              disabled={saving}
              className="min-h-[52px] rounded-[14px] bg-ink px-4 text-sm font-bold text-white"
            >
              저장
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-extrabold">활동 내역</h2>
        {checkins.length === 0 ? (
          <p className="mt-3 text-sm text-mute">아직 인증 기록이 없어요.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {checkins.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-[18px] bg-surface px-4 py-3.5"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand font-extrabold">
                    +
                  </span>
                  <span>
                    <span className="block font-extrabold">{row.name_ko ?? "품목"}</span>
                    <span className="text-xs text-mute">{row.checkin_date}</span>
                  </span>
                </span>
                <span className="font-extrabold">+{row.points}P</span>
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
