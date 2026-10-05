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

export type ItemTwin = {
  id: string;
  name_ko: string;
  reason_ko: string;
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
  twins?: ItemTwin[];
  collection?: CollectionHint;
};

export type CollectionHint = {
  anytime: boolean;
  is_today: boolean;
  district_name: string | null;
  next_label: string | null;
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
  source?: string | null;
  distance_m?: number;
  missing_24h?: number;
  closed_24h?: number;
};

export type MeUser = {
  id: string;
  nickname: string;
  total_xp: number;
  total_points: number;
  streak_count: number;
  last_checkin_date: string | null;
  district_id?: string | null;
  district_name?: string | null;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  checkin_count: number;
  recent_dates: string[];
};

export type District = {
  id: string;
  name_ko: string;
  city_ko: string;
};

export type ScheduleSlot = {
  weekday: number;
  label: string;
  categories: { id: string; name_ko: string }[];
};

export type SchedulePayload = {
  district: District | null;
  disclaimer: string;
  today: ScheduleSlot;
  tomorrow: ScheduleSlot;
  week: ScheduleSlot[];
};

export type MissionView = {
  id: string;
  title_ko: string;
  target: number;
  done: number;
  claimed: boolean;
  bonus: number;
};

export type QuizChoice = { id: string; label: string };

export type QuizView = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  item_id: string;
};

export type BagItem = {
  id: string;
  item_id: string;
  name_ko: string;
  category_id: string;
  category_name: string;
  bin_type: string;
  special_bin_type: string | null;
  collection?: CollectionHint;
};

export type HomePayload = {
  nickname: string;
  district_id: string | null;
  schedule: SchedulePayload;
  quiz: QuizView | null;
  missions: { week_start: string; missions: MissionView[] };
  bag: BagItem[];
};

export const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const COMPLEX_NOTE_KEY = "smart-recycle_complex_note";

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

export const BIN_SOURCE_LABELS: Record<string, string> = {
  public_data_pharmacy: "약국 수거함 · 공공데이터",
  seed: "참고 위치",
};

export const SEOUL_HALL = { lat: 37.5665, lng: 126.978 };
