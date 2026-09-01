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
      <section className="rounded-2xl bg-brand-soft px-4 py-4">
        <p className="text-xs font-semibold text-brand">{guide.category_name}</p>
        <h2 className="mt-1 text-xl font-bold">{guide.name_ko}</h2>
        <p className="mt-2 text-sm leading-6 text-ink">{guide.summary_ko}</p>
        <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand">
          {guide.bin_type}
        </p>
      </section>

      <ol className="space-y-3">
        {guide.steps.map((step) => (
          <li key={step.order} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {step.order}
            </span>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="mt-0.5 text-sm leading-6 text-mute">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {guide.tips.length > 0 ? (
        <section>
          <h3 className="text-sm font-bold">버리기 전 아이디어</h3>
          <div className="mt-2 space-y-2">
            {guide.tips.map((tip) => (
              <article
                key={tip.title}
                className="rounded-2xl border border-brand-line p-4"
              >
                <p className="font-semibold">{tip.title}</p>
                <p className="mt-1 text-sm leading-6 text-mute">{tip.body}</p>
                {tip.caution ? (
                  <p className="mt-2 text-xs text-brand-dark">{tip.caution}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {guide.special_bin_type ? (
        <Link
          to={`/map?type=${guide.special_bin_type}`}
          className="flex min-h-12 items-center justify-center rounded-2xl border border-brand bg-white text-[15px] font-semibold text-brand"
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
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand text-[16px] font-semibold text-white disabled:opacity-60"
          >
            {checkinBusy ? "인증하는 중..." : "오늘 인증하기"}
          </button>
          {checkinMessage ? (
            <p className="mt-2 text-center text-sm text-brand">{checkinMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
