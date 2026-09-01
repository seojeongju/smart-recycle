import { useEffect, useRef } from "react";
import { snapshotFromVideo } from "../lib/camera";

type Props = {
  stream: MediaStream;
  busy: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function CameraOverlay({ stream, busy, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  async function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    try {
      const file = await snapshotFromVideo(video);
      onCapture(file);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
      />
      <div className="pointer-events-none absolute inset-0 border-[28px] border-black/35">
        <div className="h-full rounded-[28px] border-2 border-white/70" />
      </div>
      <div className="safe-top absolute inset-x-0 top-0 flex justify-between px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full bg-black/50 px-4 text-sm font-bold text-white"
        >
          닫기
        </button>
      </div>
      <div className="safe-bottom absolute inset-x-0 bottom-0 flex flex-col items-center pb-8">
        <button
          type="button"
          onClick={() => {
            void takePhoto();
          }}
          disabled={busy}
          className="h-[72px] w-[72px] rounded-full border-4 border-white bg-brand disabled:opacity-60"
          aria-label="사진 찍기"
        />
        <p className="mt-3 text-sm font-semibold text-white">
          {busy ? "살펴보는 중..." : "버튼을 눌러 촬영"}
        </p>
      </div>
    </div>
  );
}
