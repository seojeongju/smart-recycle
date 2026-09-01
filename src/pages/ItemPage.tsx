import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { api, resizeImage } from "../api";
import { GuideView } from "../components/GuideView";
import type { GuidePayload } from "../types";

export function ItemPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state as { logId?: string; fromRecognize?: boolean } | null;
  const fromRecognize = Boolean(state?.fromRecognize);
  const [guide, setGuide] = useState<GuidePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setGuide(null);
    setMessage(null);
    void api<{ guide: GuidePayload }>(`/api/items/${id}`)
      .then((data) => setGuide(data.guide))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "가이드를 불러오지 못했어요.");
      });
  }, [id]);

  async function checkin(image?: File) {
    if (!id) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("item_id", id);
      if (image) {
        const blob = await resizeImage(image);
        form.append("image", new File([blob], "checkin.jpg", { type: "image/jpeg" }));
      }
      const data = await api<{ message: string }>("/api/checkins", {
        method: "POST",
        body: form,
      });
      setMessage(data.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "인증에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4">
      <Link to={fromRecognize ? "/" : "/search"} className="text-sm font-extrabold">
        {fromRecognize ? "← 홈" : "← 검색"}
      </Link>
      {error ? <p className="mt-6 text-sm text-mute">{error}</p> : null}
      {!guide && !error ? (
        <p className="mt-6 text-sm text-mute">가이드를 불러오는 중...</p>
      ) : null}
      {guide ? (
        <div className="mt-3">
          <GuideView
            guide={guide}
            fromRecognize={fromRecognize}
            onCheckin={(file) => {
              void checkin(file);
            }}
            checkinBusy={busy}
            checkinMessage={message}
          />
        </div>
      ) : null}
    </div>
  );
}
