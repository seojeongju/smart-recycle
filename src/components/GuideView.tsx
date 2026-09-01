import { Link } from "react-router";
import type { GuidePayload } from "../types";

type Props = {
  guide: GuidePayload;
  onCheckin?: () => void;
  checkinBusy?: boolean;
  checkinMessage?: string | null;
};

export function GuideView({
  guide,
  onCheckin,
  checkinBusy,
  checkinMessage,
}: Props) {
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

      <ol className="space-y-2">
        {guide.steps.map((step) => (
          <li key={step.order} className="flex gap-3 rounded-[18px] bg-surface px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold">
              {step.order}
            </span>
            <div>
              <p className="font-extrabold">{step.title}</p>
              <p className="mt-0.5 text-sm leading-6 text-mute">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

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
          <button
            type="button"
            onClick={onCheckin}
            disabled={checkinBusy}
            className="btn-dark disabled:opacity-60"
          >
            {checkinBusy ? "인증하는 중..." : "오늘 인증하기"}
          </button>
          {checkinMessage ? (
            <p className="mt-2 text-center text-sm font-semibold">{checkinMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
