import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, resizeImage } from "../api";
import type { GuidePayload } from "../types";

type RecognizeResponse = {
  recognition: {
    item_id: string | null;
    category_id: string;
    label_ko: string;
    confidence: number;
  };
  guide: GuidePayload | null;
  fallback: boolean;
};

export function RecognizePage() {
  const navigate = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setFallback(false);
    try {
      const blob = await resizeImage(file);
      const form = new FormData();
      form.append("file", blob, "waste.jpg");
      const data = await api<RecognizeResponse>("/api/recognize", {
        method: "POST",
        body: form,
      });
      if (data.fallback || !data.guide || !data.recognition.item_id) {
        setFallback(true);
        return;
      }
      void navigate(`/items/${data.recognition.item_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "인식에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
      <header>
        <p className="text-sm font-semibold text-brand">Smart Recycle</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">이 물건, 어디에 넣을까요?</h1>
        <p className="mt-2 text-sm leading-6 text-mute">
          사진을 찍으면 세척부터 배출함까지 순서대로 알려드려요.
        </p>
      </header>

      <div className="mt-8 flex flex-1 flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-brand text-white shadow-[0_12px_32px_rgb(37_99_235_/_0.28)] disabled:opacity-70"
          aria-label="촬영하기"
        >
          {busy ? (
            <span className="text-sm font-semibold">확인 중...</span>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="12" r="3.2" fill="white" />
              </svg>
              <span className="mt-2 text-[15px] font-semibold">촬영하기</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => albumRef.current?.click()}
          disabled={busy}
          className="mt-5 min-h-11 rounded-full border border-brand px-5 text-sm font-semibold text-brand disabled:opacity-70"
        >
          앨범에서 선택
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <input
          ref={albumRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {error ? (
        <p className="mb-3 rounded-2xl bg-brand-soft px-4 py-3 text-center text-sm text-brand-dark">
          {error}
        </p>
      ) : null}

      {fallback ? (
        <div className="mb-3 rounded-2xl border border-brand-line p-4 text-center">
          <p className="font-semibold">잘 모르겠어요</p>
          <p className="mt-1 text-sm leading-6 text-mute">
            가까이 다시 찍거나, 이름으로 검색해 주세요.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="min-h-11 flex-1 rounded-xl border border-brand text-sm font-semibold text-brand"
            >
              다시 촬영
            </button>
            <Link
              to="/search"
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white"
            >
              검색하기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
