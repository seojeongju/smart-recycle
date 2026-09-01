import { useState } from "react";

type Props = {
  onDone: () => void;
};

const SLIDES = [
  {
    title: "찍으면 버리는 순서가 나와요",
    body: "페트병·배달용기·약을 가까이 찍어 보세요. 카카오톡·인스타 안 브라우저에서는 카메라가 막힐 수 있어요.",
  },
  {
    title: "특수 쓰레기는 지도로",
    body: "위치는 근처 약국·의류함·소형가전 수거함을 보여 주려고만 씁니다. 거부하면 서울시청 기준으로 보여요.",
  },
  {
    title: "하루 한 번이면 충분해요",
    body: "가이드 단계를 체크하고 인증하면 새싹이가 자라요. 포인트는 현금이 아닙니다.",
  },
] as const;

export function Onboarding({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <span className="absolute h-36 w-36 rounded-full bg-brand" />
          <span className="relative text-4xl font-extrabold">{index + 1}</span>
        </div>
        <p className="mt-4 text-sm font-semibold text-mute">Smart Recycle</p>
        <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">
          {slide.title}
        </h1>
        <p className="mt-3 max-w-[280px] text-[15px] leading-6 text-mute">{slide.body}</p>
        <div className="mt-6 flex gap-1.5">
          {SLIDES.map((item, i) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-full ${i === index ? "w-6 bg-ink" : "w-1.5 bg-surface"}`}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="btn-green"
        onClick={() => {
          if (last) onDone();
          else setIndex((value) => value + 1);
        }}
      >
        {last ? "시작하기" : "다음"}
      </button>
    </div>
  );
}
