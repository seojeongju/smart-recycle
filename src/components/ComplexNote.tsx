import { useEffect, useState } from "react";
import { COMPLEX_NOTE_KEY } from "../types";

export function ComplexNote() {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setNote(localStorage.getItem(COMPLEX_NOTE_KEY) ?? "");
    } catch {
      setNote("");
    }
  }, []);

  function save() {
    try {
      localStorage.setItem(COMPLEX_NOTE_KEY, note.slice(0, 200));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch {
      setSaved(false);
    }
  }

  return (
    <section id="complex-note">
      <h2 className="text-base font-extrabold">단지 배출함 메모</h2>
      <p className="mt-1 text-xs leading-5 text-mute">
        이 기기에만 저장됩니다. 아파트 배출함 위치·시간을 적어 두세요.
      </p>
      <textarea
        value={note}
        maxLength={200}
        rows={3}
        onChange={(event) => setNote(event.target.value)}
        placeholder="예: 지하 1층 재활용장, 저녁 8시 이후"
        className="field mt-3 min-h-[88px] resize-none bg-white py-3"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-mute">{note.length}/200</p>
        <button
          type="button"
          onClick={save}
          className="pressable rounded-full bg-ink px-4 py-2 text-xs font-bold text-white"
        >
          {saved ? "저장됨" : "저장"}
        </button>
      </div>
    </section>
  );
}
