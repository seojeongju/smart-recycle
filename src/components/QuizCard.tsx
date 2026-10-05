import { useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import type { QuizView } from "../types";

type Props = {
  quiz: QuizView;
};

export function QuizCard({ quiz }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    item_id: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function answer(answerId: string) {
    if (result || busy) return;
    setPicked(answerId);
    setBusy(true);
    try {
      const data = await api<{ correct: boolean; item_id: string }>("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: quiz.id, answer_id: answerId }),
      });
      setResult({ correct: data.correct, item_id: data.item_id });
    } catch {
      setPicked(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[22px] bg-surface px-4 py-4">
      <p className="text-[11px] font-bold text-mute">오늘의 퀴즈</p>
      <p className="mt-1 text-sm font-extrabold leading-snug">{quiz.prompt}</p>
      <div className="mt-3 grid gap-2">
        {quiz.choices.map((choice) => {
          const selected = picked === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={Boolean(result) || busy}
              onClick={() => {
                void answer(choice.id);
              }}
              className={`pressable min-h-11 rounded-2xl px-3 text-left text-sm font-bold ${
                selected ? "bg-brand" : "bg-white"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {result ? (
        <div className="mt-3">
          <p className="text-sm font-extrabold">
            {result.correct ? "정답이에요!" : "아쉬워요. 가이드에서 다시 확인해 보세요."}
          </p>
          <Link
            to={`/items/${result.item_id}`}
            className="mt-2 inline-flex text-xs font-bold text-ink"
          >
            관련 가이드 보기
          </Link>
        </div>
      ) : null}
    </section>
  );
}
