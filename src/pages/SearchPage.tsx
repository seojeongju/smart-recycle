import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../api";
import type { Category, SearchItem } from "../types";

export function SearchPage() {
  const [params] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<{ categories: Category[] }>("/api/categories").then((data) => {
      setCategories(data.categories);
    });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setItems([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setBusy(true);
      void api<{ items: SearchItem[] }>(`/api/search?q=${encodeURIComponent(q)}`)
        .then((data) => setItems(data.items))
        .finally(() => setBusy(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-1 flex-col px-5 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">품목 검색</h1>
      <label className="mt-4 block">
        <span className="sr-only">검색어</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="페트병, 약, 배달용기..."
          className="min-h-12 w-full rounded-2xl border border-brand-line bg-white px-4 text-base outline-none focus:border-brand"
        />
      </label>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setQuery(category.name_ko)}
            className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"
          >
            {category.name_ko}
          </button>
        ))}
      </div>
      <div className="mt-4 flex-1 overflow-y-auto pb-4">
        {busy ? <p className="text-sm text-mute">찾는 중...</p> : null}
        {!busy && query.trim() && items.length === 0 ? (
          <p className="text-sm text-mute">검색 결과가 없어요. 다른 이름으로 시도해 보세요.</p>
        ) : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/items/${item.id}`}
                className="block rounded-2xl border border-brand-line px-4 py-3"
              >
                <p className="text-xs font-semibold text-brand">{item.category_name}</p>
                <p className="mt-0.5 font-semibold">{item.name_ko}</p>
                <p className="mt-1 text-sm text-mute">{item.summary_ko}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
