export type GuideStep = {
  order: number;
  title: string;
  body: string;
  required: number | boolean;
};

export type UpcycleTip = {
  title: string;
  body: string;
  caution: string | null;
};

export type GuidePayload = {
  item_id: string;
  category_id: string;
  name_ko: string;
  category_name: string;
  summary_ko: string;
  bin_type: string;
  special_bin_type: string | null;
  steps: GuideStep[];
  tips: UpcycleTip[];
};

export type SearchItem = {
  id: string;
  name_ko: string;
  summary_ko: string;
  category_id: string;
  category_name: string;
};

export const FALLBACK_CHIPS = [
  { q: "페트병", label: "페트" },
  { q: "배달용기", label: "배달용기" },
  { q: "비닐", label: "비닐" },
  { q: "약봉지", label: "폐의약품" },
  { q: "건전지", label: "건전지" },
  { q: "이어폰", label: "소형가전" },
  { q: "옷", label: "의류" },
  { q: "종이컵", label: "일회용컵" },
] as const;

export type Bin = {
  id: string;
  type: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
  distance_m?: number;
};

export type MeUser = {
  id: string;
  nickname: string;
  total_xp: number;
  total_points: number;
  streak_count: number;
  last_checkin_date: string | null;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  checkin_count: number;
  recent_dates: string[];
};

export type Category = {
  id: string;
  name_ko: string;
  bin_type: string;
  sort_order: number;
};

export const BIN_LABELS: Record<string, string> = {
  medicine: "폐의약품",
  electronics: "소형가전",
  clothing: "의류",
  recycle_station: "재활용 정거장",
  battery: "폐건전지",
};

export const SEOUL_HALL = { lat: 37.5665, lng: 126.978 };
