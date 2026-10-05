import { Link } from "react-router";
import type { BagItem } from "../types";

type Props = {
  items: BagItem[];
};

export function BagList({ items }: Props) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-base font-extrabold">오늘 함께 버리기</h2>
        <p className="mt-3 text-sm text-mute">오늘 인증한 품목이 여기에 모입니다.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-base font-extrabold">오늘 함께 버리기</h2>
      <p className="mt-1 text-xs leading-5 text-mute">
        특수 수거함부터, 일반쓰레기는 마지막에 챙기세요.
      </p>
      <ol className="stagger mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link
              to={`/items/${item.item_id}`}
              className="flex items-center gap-3 rounded-[18px] bg-surface px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">{item.name_ko}</span>
                <span className="block text-xs text-mute">{item.bin_type}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
