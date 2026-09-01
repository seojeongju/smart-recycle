import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { pickAlbumFile } from "../lib/camera";
import type { GuidePayload } from "../types";

type Props = {
  guide: GuidePayload;
  onCheckin?: (image?: File) => void;
  checkinBusy?: boolean;
  checkinMessage?: string | null;
  fromRecognize?: boolean;
};

export function GuideView({
  guide,
  onCheckin,
  checkinBusy,
  checkinMessage,
  fromRecognize = false,
}: Props) {
  const storageKey = `smart-recycle_guide_${guide.item_id}`;
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | undefined>();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as number[]) : [];
      setDone(new Set(parsed));
    } catch {
      setDone(new Set());
    }
    setPhoto(undefined);
    setPhotoName(null);
  }, [storageKey]);

  const required = useMemo(
    () =>
      guide.steps.filter((step) => step.required === 1 || step.required === true),
    [guide.steps],
  );
  const target = required.length > 0 ? required : guide.steps;
  const finished = target.every((step) => done.has(step.order));
  const progress =
    target.length === 0
      ? 100
      : Math.round((target.filter((step) => done.has(step.order)).length / target.length) * 100);

  function toggle(order: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      sessionStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-[24px] bg-brand px-5 py-5">
        <p className="text-xs font-bold text-ink/70">{guide.category_name}</p>
        <h2 className="mt-1 text-[26px] font-extrabold">{guide.name_ko}</h2>
        <p className="mt-2 text-sm leading-6">{guide.summary_ko}</p>
        <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold">
          {guide.bin_type}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">이렇게 버리세요</h3>
          <p className="text-xs font-bold text-mute">{progress}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-3 space-y-2">
          {guide.steps.map((step) => {
            const checked = done.has(step.order);
            return (
              <li key={step.order}>
                <button
                  type="button"
                  onClick={() => toggle(step.order)}
                  className={`flex w-full gap-3 rounded-[18px] px-4 py-3 text-left ${
                    checked ? "bg-brand-soft" : "bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                      checked ? "bg-ink text-white" : "bg-brand"
                    }`}
                  >
                    {checked ? "✓" : step.order}
                  </span>
                  <div>
                    <p className="font-extrabold">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-mute">{step.body}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {guide.tips.length > 0 ? (
        <section>
          <h3 className="text-base font-extrabold">버리기 전 아이디어</h3>
          <div className="mt-2 space-y-2">
            {guide.tips.map((tip) => (
              <article key={tip.title} className="rounded-[18px] bg-surface p-4">
                <p className="font-extrabold">{tip.title}</p>
                <p className="mt-1 text-sm leading-6 text-mute">{tip.body}</p>
                {tip.caution ? (
                  <p className="mt-2 text-xs font-semibold text-ink">{tip.caution}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {guide.special_bin_type ? (
        <Link
          to={`/map?type=${guide.special_bin_type}`}
          className="flex min-h-[54px] items-center justify-center rounded-[16px] bg-surface text-[15px] font-extrabold"
        >
          근처 수거함 보기
        </Link>
      ) : null}

      {onCheckin ? (
        <div>
          {!finished ? (
            <p className="mb-2 text-center text-xs font-semibold text-mute">
              필요한 단계를 체크하면 인증할 수 있어요.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void pickAlbumFile().then((file) => {
                setPhoto(file);
                setPhotoName(file?.name ?? null);
              });
            }}
            className="mb-2 flex min-h-11 w-full items-center justify-center rounded-2xl bg-surface text-sm font-bold"
          >
            {photoName ? `사진 선택됨 · ${photoName}` : "인증 사진 추가 (선택)"}
          </button>
          <button
            type="button"
            onClick={() => onCheckin(photo)}
            disabled={checkinBusy || !finished}
            className="btn-dark disabled:opacity-60"
          >
            {checkinBusy ? "인증하는 중..." : "오늘 인증하기"}
          </button>
          {checkinMessage ? (
            <p className="mt-2 text-center text-sm font-semibold">{checkinMessage}</p>
          ) : null}
        </div>
      ) : null}

      {fromRecognize ? null : (
        <p className="text-center text-xs text-mute">
          다른 품목이면{" "}
          <Link to="/search" className="font-extrabold text-ink">
            검색
          </Link>
          해 보세요.
        </p>
      )}
    </div>
  );
}
