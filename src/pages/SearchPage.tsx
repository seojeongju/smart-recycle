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
    setQuery(initial);
  }, [initial]);

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
      <h1 className="text-[26px] font-extrabold tracking-tight">검색</h1>
      <label className="mt-4 block">
        <span className="sr-only">검색어</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="페트병, 약, 배달용기..."
          className="field"
        />
      </label>
      <div className="hide-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setQuery(category.name_ko)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
              query === category.name_ko ? "bg-brand text-ink" : "bg-surface text-ink"
            }`}
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
        {!query.trim() ? (
          <p className="text-sm text-mute">품목 이름이나 위의 카테고리를 눌러 보세요.</p>
        ) : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/items/${item.id}`}
                className="flex items-center justify-between rounded-[18px] bg-surface px-4 py-3.5"
              >
                <span>
                  <span className="text-[11px] font-bold text-mute">{item.category_name}</span>
                  <span className="mt-0.5 block font-extrabold">{item.name_ko}</span>
                  <span className="mt-1 block text-sm text-mute">{item.summary_ko}</span>
                </span>
                <span className="ml-3 text-mute">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
