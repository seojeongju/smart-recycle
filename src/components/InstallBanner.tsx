import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("smart-recycle_install_dismissed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as Navigator & { standalone?: boolean };
    const isStandalone = media.matches || nav.standalone === true;
    setStandalone(isStandalone);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIosHint(ios && !isStandalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || standalone) return null;
  if (!deferred && !iosHint) return null;

  return (
    <div className="mx-5 mb-3 rounded-[18px] bg-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold">홈 화면에 추가</p>
          <p className="mt-0.5 text-xs leading-5 text-mute">
            {deferred
              ? "앱처럼 바로 촬영할 수 있어요."
              : "공유 버튼에서 ‘홈 화면에 추가’를 눌러 주세요."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("smart-recycle_install_dismissed", "1");
            setHidden(true);
          }}
          className="text-xs font-bold text-mute"
        >
          닫기
        </button>
      </div>
      {deferred ? (
        <button
          type="button"
          className="mt-2 min-h-10 w-full rounded-2xl bg-ink text-sm font-bold text-white"
          onClick={() => {
            void deferred.prompt().then(() => setHidden(true));
          }}
        >
          설치하기
        </button>
      ) : null}
    </div>
  );
}
