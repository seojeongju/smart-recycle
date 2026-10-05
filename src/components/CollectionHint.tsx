import { Link } from "react-router";
import type { CollectionHint as Hint } from "../types";

type Props = {
  hint?: Hint | null;
  compact?: boolean;
};

export function collectionLabel(hint?: Hint | null): string | null {
  if (!hint) return null;
  if (hint.anytime) return "전용함 · 아무 때나";
  if (!hint.district_name) return null;
  if (hint.is_today) return `오늘 배출`;
  if (hint.next_label) return `${hint.next_label}요일`;
  return "배출일 없음";
}

export function CollectionHint({ hint, compact = false }: Props) {
  if (!hint) return null;
  if (hint.anytime) {
    return (
      <p className={compact ? "text-xs text-mute" : "rounded-[18px] bg-surface px-4 py-3 text-sm leading-6"}>
        배출일과 상관없이 전용 수거함으로 가져가세요.
      </p>
    );
  }
  if (!hint.district_name) {
    return compact ? null : (
      <Link
        to="/me#district"
        className="block rounded-[18px] bg-surface px-4 py-3 text-sm font-extrabold"
      >
        동네를 고르면 오늘 버려도 되는지 알려드려요
      </Link>
    );
  }
  if (hint.is_today) {
    return (
      <p
        className={
          compact
            ? "text-xs font-bold text-ink"
            : "rounded-[18px] bg-brand-soft px-4 py-3 text-sm font-extrabold leading-6"
        }
      >
        오늘 {hint.district_name} 배출일이에요.
      </p>
    );
  }
  return (
    <p
      className={
        compact
          ? "text-xs font-semibold text-mute"
          : "rounded-[18px] bg-surface px-4 py-3 text-sm leading-6"
      }
    >
      {hint.next_label
        ? `오늘은 배출일이 아니에요. 다음 배출은 ${hint.next_label}요일이에요.`
        : "이 동네 일정에 이 품목 배출일이 없어요. 구청 안내를 확인하세요."}
    </p>
  );
}
