import { useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import type { GuidePayload } from "../types";

type Props = {
  guide: GuidePayload;
  onCheckin?: () => void;
  checkinBusy?: boolean;
  checkinMessage?: string | null;
  logId?: string | null;
};

export function GuideView({
  guide,
  onCheckin,
  checkinBusy,
  checkinMessage,
  logId,
}: Props) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  async function sendFeedback(helpful: boolean) {
    setFeedback(helpful ? "yes" : "no");
    try {
      await api("/api/recognize/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_id: logId ?? null,
          item_id: guide.item_id,
          helpful,
        }),
      });
    } catch {
      setFeedback(null);
    }
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

      <section className="rounded-[18px] bg-surface px-4 py-4">
        <p className="text-sm font-extrabold">이 답이 맞나요?</p>
        <p className="mt-1 text-xs text-mute">
          틀린 인식은 검색·카탈로그를 다듬는 데 씁니다.
        </p>
        {feedback === "yes" ? (
          <p className="mt-3 text-sm font-semibold">고마워요. 도움이 됐어요.</p>
        ) : null}
        {feedback === "no" ? (
          <div className="mt-3">
            <p className="text-sm font-semibold">다른 이름으로 찾아 볼게요.</p>
            <Link
              to="/search"
              className="mt-2 flex min-h-11 items-center justify-center rounded-2xl bg-white text-sm font-bold"
            >
              검색으로 찾기
            </Link>
          </div>
        ) : null}
        {feedback === null ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                void sendFeedback(true);
              }}
              className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-bold"
            >
              맞아요
            </button>
            <button
              type="button"
              onClick={() => {
                void sendFeedback(false);
              }}
              className="min-h-11 flex-1 rounded-2xl bg-ink text-sm font-bold text-white"
            >
              아니에요
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
