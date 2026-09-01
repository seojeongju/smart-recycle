type Props = {
  onDone: () => void;
};

export function Onboarding({ onDone }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <span className="absolute h-44 w-44 rounded-full bg-brand" />
          <span className="absolute left-3 top-8 h-14 w-14 rounded-full bg-brand-dark/30" />
          <span className="absolute bottom-10 right-2 h-10 w-10 rounded-full bg-white/70" />
          <svg
            className="relative"
            width="88"
            height="88"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 3.5c1.2 4.4 3.2 7.1 8 9.2-5.1 1-8 3.8-9.6 9.8C8.8 16.5 5.9 13.7.8 12.7c4.8-2.1 6.8-4.8 8-9.2 2 3.8 4.2 3.8 7.2 0Z"
              fill="#111"
            />
          </svg>
        </div>
        <p className="mt-2 text-sm font-semibold text-mute">Smart Recycle</p>
        <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-tight">
          Welcome
        </h1>
        <p className="mt-3 max-w-[260px] text-[15px] leading-6 text-mute">
          사진을 찍으면 분리배출 순서를 알려주고, 근처 수거함까지 안내해요.
        </p>
      </div>
      <button type="button" onClick={onDone} className="btn-green">
        시작하기
      </button>
    </div>
  );
}
