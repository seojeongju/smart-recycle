import type { SearchItem } from "../types";

type Props = {
  previewUrl: string;
  mode: "loading" | "confirm";
  stageLabel: string;
  labelKo?: string;
  confidence?: number;
  alternatives?: SearchItem[];
  onYes: () => void;
  onNo: () => void;
  onPickAlt: (id: string) => void;
  onClose: () => void;
};

export function RecognizeFlow({
  previewUrl,
  mode,
  stageLabel,
  labelKo,
  confidence,
  alternatives = [],
  onYes,
  onNo,
  onPickAlt,
  onClose,
}: Props) {
  const percent = Math.round((confidence ?? 0) * 100);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white">
      <div className="safe-top flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onClose} className="text-sm font-extrabold">
          닫기
        </button>
        <p className="text-sm font-extrabold">
          {mode === "loading" ? "살펴보는 중" : "이 물건 맞나요?"}
        </p>
        <span className="w-10" />
      </div>
      <div className="px-5">
        <div className="overflow-hidden rounded-[24px] bg-surface">
          <img src={previewUrl} alt="촬영한 쓰레기" className="h-56 w-full object-cover" />
        </div>
      </div>
      {mode === "loading" ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10">
          <span className="h-2 w-40 overflow-hidden rounded-full bg-surface">
            <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand" />
          </span>
          <p className="mt-5 text-center text-lg font-extrabold">{stageLabel}</p>
          <p className="mt-2 text-center text-sm text-mute">
            조금 걸릴 수 있어요. 화면을 유지해 주세요.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-5">
          <p className="text-xs font-bold text-mute">인식 결과</p>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-tight">
            {labelKo ?? "이 물건"}
          </h2>
          {percent > 0 ? (
            <p className="mt-1 text-sm font-semibold text-mute">확신도 {percent}%</p>
          ) : null}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onYes}
              className="min-h-12 flex-1 rounded-2xl bg-ink text-sm font-bold text-white"
            >
              맞아요
            </button>
            <button
              type="button"
              onClick={onNo}
              className="min-h-12 flex-1 rounded-2xl bg-surface text-sm font-bold"
            >
              아니에요
            </button>
          </div>
          {alternatives.length > 0 ? (
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
              <p className="text-[11px] font-bold text-mute">아니면 이 품목인가요?</p>
              <ul className="mt-2 space-y-2">
                {alternatives.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onPickAlt(item.id)}
                      className="flex w-full items-center justify-between rounded-[18px] bg-surface px-4 py-3.5 text-left"
                    >
                      <span>
                        <span className="text-[11px] font-bold text-mute">
                          {item.category_name}
                        </span>
                        <span className="mt-0.5 block font-extrabold">{item.name_ko}</span>
                      </span>
                      <span className="text-mute">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
