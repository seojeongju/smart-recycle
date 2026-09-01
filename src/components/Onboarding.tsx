type Props = {
  onDone: () => void;
};

export function Onboarding({ onDone }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white px-6 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <p className="text-sm font-semibold text-brand">Smart Recycle</p>
      <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-tight">
        찍고, 확인하고,
        <br />
        바르게 버려요
      </h1>
      <ul className="mt-8 space-y-4 text-[15px] text-ink">
        <li className="flex gap-3 rounded-2xl bg-brand-soft p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            1
          </span>
          <div>
            <p className="font-semibold">사진으로 품목 확인</p>
            <p className="mt-1 text-sm text-mute">
              카메라로 찍거나 앨범에서 올리면 배출 순서를 알려줘요.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-2xl border border-brand-line p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            2
          </span>
          <div>
            <p className="font-semibold">특수 수거함 지도</p>
            <p className="mt-1 text-sm text-mute">
              폐의약품, 소형가전, 의류함 위치를 내 근처에서 찾아요.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-2xl border border-brand-line p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            3
          </span>
          <div>
            <p className="font-semibold">하루 한 번 인증</p>
            <p className="mt-1 text-sm text-mute">
              올바르게 버리면 포인트가 쌓이고 새싹이가 자라요.
            </p>
          </div>
        </li>
      </ul>
      <p className="mt-auto text-center text-xs leading-5 text-mute">
        위치와 카메라는 인식·지도 기능을 쓸 때만 요청해요.
        위치 좌표는 서버에 저장하지 않습니다.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-4 min-h-12 w-full rounded-2xl bg-brand text-[16px] font-semibold text-white"
      >
        시작하기
      </button>
    </div>
  );
}
