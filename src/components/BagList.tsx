import { useState } from "react";
import { Link } from "react-router";
import { readBagDone, toggleBagDone } from "../lib/bagDone";
import { collectionLabel } from "./CollectionHint";
import type { BagItem } from "../types";

type Props = {
  items: BagItem[];
};

export function BagList({ items }: Props) {
  const [done, setDone] = useState<Set<string>>(() => readBagDone());

  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-base font-extrabold">오늘 함께 버리기</h2>
        <p className="mt-3 text-sm text-mute">오늘 인증한 품목이 여기에 모입니다.</p>
      </section>
    );
  }

  const remaining = items.filter((item) => !done.has(item.id)).length;

  return (
    <section>
      <h2 className="text-base font-extrabold">오늘 함께 버리기</h2>
      <p className="mt-1 text-xs leading-5 text-mute">
        특수 수거함부터 챙기고, 가져간 품목은 체크하세요. 남은 {remaining}개
      </p>
      <ol className="stagger mt-3 space-y-2">
        {items.map((item, index) => {
          const checked = done.has(item.id);
          const badge = collectionLabel(item.collection);
          return (
            <li key={item.id}>
              <div
                className={`flex items-start gap-3 rounded-[18px] px-4 py-3 ${
                  checked ? "bg-brand-soft" : "bg-surface"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDone(toggleBagDone(item.id))}
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    checked ? "bg-ink text-white" : "bg-brand"
                  }`}
                  aria-label={checked ? "가져감 해제" : "가져감 표시"}
                >
                  {checked ? "✓" : index + 1}
                </button>
                <Link to={`/items/${item.item_id}`} className="min-w-0 flex-1">
                  <span className={`block text-sm font-extrabold ${checked ? "line-through" : ""}`}>
                    {item.name_ko}
                  </span>
                  <span className="block text-xs text-mute">{item.bin_type}</span>
                  {badge ? (
                    <span className="mt-1 inline-block text-[11px] font-bold">{badge}</span>
                  ) : null}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
