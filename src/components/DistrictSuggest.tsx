import { useEffect, useState } from "react";
import { api } from "../api";
import { lookupDistrictName, matchDistrict } from "../lib/district";
import type { District } from "../types";

type Props = {
  currentId: string | null;
  onPicked?: () => void;
};

export function DistrictSuggest({ currentId, onPicked }: Props) {
  const [guess, setGuess] = useState<District | null>(null);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (currentId) {
      setGuess(null);
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          const [name, list] = await Promise.all([
            lookupDistrictName(pos.coords.latitude, pos.coords.longitude),
            api<{ districts: District[] }>("/api/districts"),
          ]);
          setGuess(matchDistrict(name, list.districts));
        })();
      },
      () => setGuess(null),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [currentId]);

  if (currentId || !guess || hidden) return null;

  async function accept() {
    if (!guess) return;
    setBusy(true);
    try {
      await api("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district_id: guess.id }),
      });
      onPicked?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-[22px] bg-brand-soft px-4 py-4">
      <p className="text-[11px] font-bold text-mute">동네 추천</p>
      <p className="mt-1 text-sm font-extrabold">
        여기 {guess.city_ko} {guess.name_ko} 같아요. 이 동네로 할까요?
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void accept();
          }}
          className="pressable min-h-10 flex-1 rounded-2xl bg-ink text-sm font-bold text-white"
        >
          {busy ? "저장 중" : "맞아요"}
        </button>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="pressable min-h-10 flex-1 rounded-2xl bg-white text-sm font-bold"
        >
          아니요
        </button>
      </div>
    </section>
  );
}
