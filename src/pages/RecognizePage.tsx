import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, resizeImage } from "../api";
import { CameraOverlay } from "../components/CameraOverlay";
import {
  openBackCamera,
  pickAlbumFile,
  pickNativeCameraFile,
  stopStream,
} from "../lib/camera";
import { readRecentSearches } from "../lib/recent";
import { FALLBACK_CHIPS, type GuidePayload, type SearchItem } from "../types";

type RecognizeResponse = {
  recognition: {
    id: string;
    item_id: string | null;
    category_id: string;
    label_ko: string;
    confidence: number;
  };
  guide: GuidePayload | null;
  fallback: boolean;
  suggestions: SearchItem[];
};

const FEATURES = [
  { q: "페트병", label: "페트", bg: "#E8F9D8", icon: "bottle" },
  { q: "플라스틱", label: "플라스틱", bg: "#DFF3FF", icon: "box" },
  { q: "캔", label: "캔", bg: "#FFF3D6", icon: "can" },
  { q: "유리", label: "유리", bg: "#F3E8FF", icon: "glass" },
  { q: "종이", label: "종이", bg: "#FFE8EE", icon: "paper" },
  { q: "비닐", label: "비닐", bg: "#E8F4FF", icon: "bag" },
  { q: "약", label: "폐의약품", bg: "#E9FBEA", icon: "med" },
  { q: "옷", label: "의류", bg: "#FFF6D8", icon: "shirt" },
] as const;

const TIPS = [
  { title: "페트는 라벨부터", body: "헹구고 라벨을 떼면 재활용률이 올라가요." },
  { title: "약은 약국으로", body: "싱크대에 버리지 말고 폐의약품함에 넣으세요." },
  { title: "기름기는 헹구기", body: "배달 용기는 깨끗해야 플라스틱으로 나가요." },
];

export function RecognizePage() {
  const navigate = useNavigate();
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [nickname, setNickname] = useState("새싹이");

  useEffect(() => {
    void api<{ user: { nickname: string } }>("/api/me")
      .then((data) => setNickname(data.user.nickname))
      .catch(() => undefined);
    setRecent(readRecentSearches());
  }, []);

  useEffect(() => {
    return () => stopStream(streamRef.current);
  }, []);

  function closeCamera() {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      const file = await pickNativeCameraFile();
      await onFile(file);
      return;
    }
    try {
      const next = await openBackCamera();
      stopStream(streamRef.current);
      streamRef.current = next;
      setStream(next);
    } catch {
      setError("카메라 권한이 필요해요. 브라우저 설정에서 카메라를 허용한 뒤 다시 눌러 주세요.");
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setFallback(false);
    setSuggestions([]);
    try {
      const blob = await resizeImage(file);
      const form = new FormData();
      form.append("file", blob, "waste.jpg");
      const data = await api<RecognizeResponse>("/api/recognize", {
        method: "POST",
        body: form,
      });
      closeCamera();
      if (data.fallback || !data.guide || !data.recognition.item_id) {
        setFallback(true);
        setSuggestions(data.suggestions ?? []);
        return;
      }
      void navigate(`/items/${data.recognition.item_id}`, {
        state: { fromRecognize: true, logId: data.recognition.id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "인식에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
      {stream ? (
        <CameraOverlay
          stream={stream}
          busy={busy}
          onClose={closeCamera}
          onCapture={(file) => {
            void onFile(file);
          }}
        />
      ) : null}

      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-mute">Smart Recycle</p>
          <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight">
            안녕하세요, {nickname}
          </h1>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand font-extrabold">
          SR
        </span>
      </header>

      <section className="mt-4 overflow-hidden rounded-[22px] bg-brand px-5 py-5">
        <p className="text-sm font-semibold text-ink/70">한 장이면 끝</p>
        <h2 className="mt-1 text-xl font-extrabold leading-snug">
          사진 찍고
          <br />
          바르게 버리기
        </h2>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              void startCamera();
            }}
            disabled={busy}
            className="min-h-11 flex-1 rounded-2xl bg-ink text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "확인 중..." : "촬영하기"}
          </button>
          <button
            type="button"
            onClick={() => {
              void pickAlbumFile().then((file) => onFile(file));
            }}
            disabled={busy}
            className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-bold disabled:opacity-60"
          >
            앨범
          </button>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold">품목 바로가기</h2>
          <Link to="/search" className="text-xs font-semibold text-mute">
            전체
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-x-3 gap-y-4">
          {FEATURES.map((item) => (
            <Link key={item.label} to={`/search?q=${encodeURIComponent(item.q)}`} className="text-center">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px]"
                style={{ background: item.bg }}
              >
                <FeatureIcon name={item.icon} />
              </span>
              <span className="mt-1.5 block text-[11px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-base font-extrabold">오늘의 팁</h2>
        <div className="hide-scroll mt-3 flex gap-3 overflow-x-auto pb-1">
          {TIPS.map((tip) => (
            <article
              key={tip.title}
              className="min-w-[220px] rounded-[20px] bg-surface px-4 py-4"
            >
              <p className="font-extrabold">{tip.title}</p>
              <p className="mt-1 text-sm leading-5 text-mute">{tip.body}</p>
            </article>
          ))}
        </div>
      </section>

      {error ? (
        <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-center text-sm">{error}</p>
      ) : null}

      {fallback ? (
        <div className="mt-4 rounded-[20px] bg-surface p-4">
          <p className="text-center font-extrabold">잘 모르겠어요</p>
          <p className="mt-1 text-center text-sm leading-6 text-mute">
            가까이 다시 찍거나, 아래 품목·최근 검색으로 바로 찾아 보세요.
          </p>
          {suggestions.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/items/${item.id}`}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                  >
                    <span>
                      <span className="text-[11px] font-bold text-mute">
                        {item.category_name}
                      </span>
                      <span className="mt-0.5 block text-sm font-extrabold">
                        {item.name_ko}
                      </span>
                    </span>
                    <span className="text-mute">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {FALLBACK_CHIPS.map((chip) => (
              <Link
                key={chip.q}
                to={`/search?q=${encodeURIComponent(chip.q)}`}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold"
              >
                {chip.label}
              </Link>
            ))}
          </div>
          {recent.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-mute">최근 검색</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {recent.map((query) => (
                  <Link
                    key={query}
                    to={`/search?q=${encodeURIComponent(query)}`}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold"
                  >
                    {query}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                void startCamera();
              }}
              className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-bold"
            >
              다시 촬영
            </button>
            <Link
              to="/search"
              className="flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white"
            >
              검색하기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {name === "bottle" ? (
        <path d="M9 7V4h6v3l1 2v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l1-2Z" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "box" ? (
        <path d="M4 8l8-4 8 4v10l-8 4-8-4V8Z M4 8l8 4 8-4 M12 12v10" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "can" ? (
        <path d="M8 7c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5v11c0 1.5-1.8 2.5-4 2.5s-4-1-4-2.5V7Z" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "glass" ? (
        <path d="M8 4h8l-1.2 8.5A4.8 4.8 0 0 1 12 17a4.8 4.8 0 0 1-2.8-4.5L8 4Z M12 17v3 M9 20h6" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "paper" ? (
        <path d="M7 4h7l4 4v12H7V4Z M14 4v4h4" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "bag" ? (
        <path d="M7 8h10l-1 12H8L7 8Z M9 8V6.5A3 3 0 0 1 15 6.5V8" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "med" ? (
        <path d="M9 3h6v5h5v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8h5V3Z" stroke="#111" strokeWidth="1.7" />
      ) : null}
      {name === "shirt" ? (
        <path d="M8 5 4 8v3h3v9h10V11h3V8l-4-3-2 2h-2L8 5Z" stroke="#111" strokeWidth="1.7" />
      ) : null}
    </svg>
  );
}
