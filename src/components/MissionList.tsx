import { useState } from "react";
import { api } from "../api";
import type { MissionView } from "../types";

type Props = {
  missions: MissionView[];
  onClaimed?: () => void;
};

export function MissionList({ missions, onClaimed }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function claim(id: string) {
    setBusyId(id);
    try {
      const data = await api<{ message: string }>(`/api/missions/${id}/claim`, {
        method: "POST",
      });
      setMessage(data.message);
      onClaimed?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "받지 못했어요.");
    } finally {
      setBusyId(null);
    }
  }

  if (missions.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-extrabold">이번 주 미션</h2>
      <ul className="stagger mt-3 space-y-2">
        {missions.map((mission) => {
          const ready = mission.done >= mission.target && !mission.claimed;
          const percent = Math.round((mission.done / mission.target) * 100);
          return (
            <li key={mission.id} className="rounded-[18px] bg-surface px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-snug">{mission.title_ko}</p>
                  <p className="mt-0.5 text-xs text-mute">
                    {mission.done}/{mission.target} · +{mission.bonus}P
                  </p>
                </div>
                {mission.claimed ? (
                  <span className="shrink-0 text-xs font-bold text-mute">완료</span>
                ) : ready ? (
                  <button
                    type="button"
                    disabled={busyId === mission.id}
                    onClick={() => {
                      void claim(mission.id);
                    }}
                    className="pressable shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {busyId === mission.id ? "받는 중" : "받기"}
                  </button>
                ) : null}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="progress-fill bg-brand" style={{ width: `${percent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-2 text-center text-xs font-semibold">{message}</p> : null}
    </section>
  );
}
