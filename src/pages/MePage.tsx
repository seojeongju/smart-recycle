import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
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

  const percent = user.level >= 10 ? 100 : Math.round((user.xpInLevel / 50) * 100);
  const today = lastSevenDates()[6];
  const checkedToday = user.recent_dates.includes(today);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
      <h1 className="text-[26px] font-extrabold tracking-tight">마이</h1>

      <section className="mt-4 rounded-[24px] bg-brand px-5 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-ink/70">포인트 지갑</p>
            <p className="mt-1 text-[34px] font-extrabold tracking-tight">
              {user.total_points.toLocaleString()}
              <span className="ml-1 text-lg font-extrabold">P</span>
            </p>
          </div>
          <Sprout level={user.level} compact />
        </div>
        <div className="mt-4 rounded-[18px] bg-white/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">레벨 {user.level}</p>
            <p className="text-[11px] font-semibold text-ink/70">
              {user.streak_count}일 연속
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-ink/70">{user.xpInLevel}/50 XP</p>
        </div>
        {!checkedToday ? (
          <Link
            to="/"
            className="mt-3 flex min-h-11 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white"
          >
            오늘 인증하면 +10P
          </Link>
        ) : (
          <p className="mt-3 text-center text-xs font-semibold text-ink/70">
            오늘 인증 완료
          </p>
        )}
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
        <h2 className="text-base font-extrabold">거래 내역</h2>
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold">
                    {row.points > 0 ? "+" : "·"}
                  </span>
                  <span>
                    <span className="block font-extrabold">{row.name_ko ?? "품목"}</span>
                    <span className="text-xs text-mute">{row.checkin_date}</span>
                  </span>
                </span>
                <span className="font-extrabold">
                  {row.points > 0 ? `+${row.points}P` : "0P"}
                </span>
              </li>
            ))}
          </ul>
        )}
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

      <p className="mt-8 text-center text-[11px] leading-5 text-mute">
        수거함 위치는 공공데이터포털·시드 자료를 참고합니다.
        <br />
        운영 여부는 현장 안내를 우선하세요.
      </p>
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
