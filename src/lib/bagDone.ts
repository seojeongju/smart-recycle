import { kstToday } from "./kst";

function key(date = kstToday()): string {
  return `smart-recycle_bag_done_${date}`;
}

export function readBagDone(): Set<string> {
  try {
    const raw = localStorage.getItem(key());
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export function toggleBagDone(id: string): Set<string> {
  const next = readBagDone();
  if (next.has(id)) next.delete(id);
  else next.add(id);
  try {
    localStorage.setItem(key(), JSON.stringify([...next]));
  } catch {
    // 저장 실패는 화면 토글만 유지
  }
  return next;
}
