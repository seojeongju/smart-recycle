import { Link } from "react-router";
import type { SchedulePayload } from "../types";

type Props = {
  schedule: SchedulePayload;
  compact?: boolean;
};

function chips(slot: SchedulePayload["today"]) {
  if (slot.categories.length === 0) return "배출 품목 없음";
  return slot.categories.map((item) => item.name_ko).join(" · ");
}

export function CollectionBanner({ schedule, compact = false }: Props) {
  if (!schedule.district) {
    return (
      <Link
        to="/me#district"
        className="pressable mt-4 block rounded-[22px] bg-surface px-4 py-4"
      >
        <p className="text-[11px] font-bold text-mute">우리 동네 배출일</p>
        <p className="mt-1 text-sm font-extrabold">동네를 고르면 오늘 배출 품목을 알려드려요</p>
      </Link>
    );
  }

  return (
    <section className="mt-4 rounded-[22px] bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-mute">
            {schedule.district.city_ko} {schedule.district.name_ko}
          </p>
          <p className="mt-1 text-sm font-extrabold leading-snug">
            오늘({schedule.today.label}) {chips(schedule.today)}
          </p>
          <p className="mt-1 text-xs leading-5 text-mute">
            내일({schedule.tomorrow.label}) {chips(schedule.tomorrow)}
          </p>
        </div>
        <Link to="/me#district" className="shrink-0 text-xs font-bold text-ink">
          변경
        </Link>
      </div>
      {compact ? null : (
        <p className="mt-2 text-[11px] leading-5 text-mute">{schedule.disclaimer}</p>
      )}
    </section>
  );
}
