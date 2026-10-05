import {
  kstDate,
  kstDayIndex,
  kstTomorrow,
  kstWeekStart,
  kstWeekday,
  WEEKDAY_KO,
} from "./lib";

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

export type MissionRow = {
  id: string;
  title_ko: string;
  item_id: string | null;
  category_id: string | null;
  target_count: number;
  bonus_points: number;
  sort_order: number;
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

export type CollectionHint = {
  anytime: boolean;
  is_today: boolean;
  district_name: string | null;
  next_label: string | null;
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

const ANYTIME_CATEGORIES = new Set([
  "medicine",
  "battery",
  "clothing",
  "small_electronics",
  "food",
  "general",
]);

export function hintFromSchedule(
  schedule: SchedulePayload,
  categoryId: string,
): CollectionHint {
  if (ANYTIME_CATEGORIES.has(categoryId)) {
    return {
      anytime: true,
      is_today: true,
      district_name: schedule.district
        ? `${schedule.district.city_ko} ${schedule.district.name_ko}`
        : null,
      next_label: null,
    };
  }
  if (!schedule.district) {
    return { anytime: false, is_today: false, district_name: null, next_label: null };
  }
  const districtName = `${schedule.district.city_ko} ${schedule.district.name_ko}`;
  const isToday = schedule.today.categories.some((row) => row.id === categoryId);
  if (isToday) {
    return {
      anytime: false,
      is_today: true,
      district_name: districtName,
      next_label: schedule.today.label,
    };
  }
  const todayWd = schedule.today.weekday;
  for (let offset = 1; offset <= 7; offset += 1) {
    const slot = schedule.week[(todayWd + offset) % 7];
    if (slot?.categories.some((row) => row.id === categoryId)) {
      return {
        anytime: false,
        is_today: false,
        district_name: districtName,
        next_label: slot.label,
      };
    }
  }
  return {
    anytime: false,
    is_today: false,
    district_name: districtName,
    next_label: null,
  };
}

const DISCLAIMER = "구청 안내를 참고한 일반 일정이에요. 단지 규정과 현장 안내를 우선하세요.";

const BAG_RANK: Record<string, number> = {
  medicine: 0,
  battery: 1,
  clothing: 2,
  small_electronics: 3,
  pet: 4,
  plastic: 5,
  vinyl: 6,
  paper: 7,
  can: 8,
  glass: 9,
  food: 10,
  general: 11,
};

function emptySlot(weekday: number): ScheduleSlot {
  return { weekday, label: WEEKDAY_KO[weekday] ?? "", categories: [] };
}

export async function listDistricts(db: D1Database): Promise<District[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name_ko, city_ko FROM districts ORDER BY sort_order`,
    )
    .all<District>();
  return results ?? [];
}

export async function loadDistrict(
  db: D1Database,
  districtId: string,
): Promise<District | null> {
  return db
    .prepare(`SELECT id, name_ko, city_ko FROM districts WHERE id = ?`)
    .bind(districtId)
    .first<District>();
}

export async function loadSchedule(
  db: D1Database,
  districtId: string | null,
): Promise<SchedulePayload> {
  const district = districtId ? await loadDistrict(db, districtId) : null;
  const todayWd = kstWeekday();
  const tomorrowWd = kstWeekday(kstTomorrow());
  const week = Array.from({ length: 7 }, (_, weekday) => emptySlot(weekday));

  if (!district) {
    return {
      district: null,
      disclaimer: DISCLAIMER,
      today: emptySlot(todayWd),
      tomorrow: emptySlot(tomorrowWd),
      week,
    };
  }

  const { results } = await db
    .prepare(
      `SELECT cd.weekday, cd.category_id, c.name_ko
       FROM collection_days cd
       JOIN waste_categories c ON c.id = cd.category_id
       WHERE cd.district_id = ?
       ORDER BY cd.weekday, c.sort_order`,
    )
    .bind(district.id)
    .all<{ weekday: number; category_id: string; name_ko: string }>();

  for (const row of results ?? []) {
    const slot = week[row.weekday];
    if (!slot) continue;
    slot.categories.push({ id: row.category_id, name_ko: row.name_ko });
  }

  return {
    district,
    disclaimer: DISCLAIMER,
    today: week[todayWd] ?? emptySlot(todayWd),
    tomorrow: week[tomorrowWd] ?? emptySlot(tomorrowWd),
    week,
  };
}

export async function loadMissions(
  db: D1Database,
  userId: string,
): Promise<{ week_start: string; missions: MissionView[] }> {
  const weekStart = kstWeekStart();
  const { results: defs } = await db
    .prepare(
      `SELECT id, title_ko, item_id, category_id, target_count, bonus_points, sort_order
       FROM weekly_missions ORDER BY sort_order`,
    )
    .all<MissionRow>();

  const { results: checkins } = await db
    .prepare(
      `SELECT ck.item_id, i.category_id
       FROM checkins ck
       LEFT JOIN waste_items i ON i.id = ck.item_id
       WHERE ck.user_id = ? AND ck.checkin_date >= ?`,
    )
    .bind(userId, weekStart)
    .all<{ item_id: string | null; category_id: string | null }>();

  const { results: claims } = await db
    .prepare(
      `SELECT mission_id FROM weekly_mission_claims
       WHERE user_id = ? AND week_start = ?`,
    )
    .bind(userId, weekStart)
    .all<{ mission_id: string }>();

  const claimed = new Set((claims ?? []).map((row) => row.mission_id));
  const logs = checkins ?? [];

  const missions = (defs ?? []).map((def) => {
    const done = logs.filter((row) => {
      if (def.item_id) return row.item_id === def.item_id;
      if (def.category_id) return row.category_id === def.category_id;
      return true;
    }).length;
    return {
      id: def.id,
      title_ko: def.title_ko,
      target: def.target_count,
      done: Math.min(done, def.target_count),
      claimed: claimed.has(def.id),
      bonus: def.bonus_points,
    };
  });

  return { week_start: weekStart, missions };
}

export async function claimMission(
  db: D1Database,
  userId: string,
  missionId: string,
): Promise<{ ok: true; points: number } | { error: string; status: 400 | 404 | 409 }> {
  const weekStart = kstWeekStart();
  const def = await db
    .prepare(
      `SELECT id, item_id, category_id, target_count, bonus_points
       FROM weekly_missions WHERE id = ?`,
    )
    .bind(missionId)
    .first<MissionRow>();
  if (!def) return { error: "미션을 찾을 수 없어요.", status: 404 };

  const already = await db
    .prepare(
      `SELECT mission_id FROM weekly_mission_claims
       WHERE user_id = ? AND mission_id = ? AND week_start = ?`,
    )
    .bind(userId, missionId, weekStart)
    .first();
  if (already) return { error: "이번 주에는 이미 받았어요.", status: 409 };

  const { week_start, missions } = await loadMissions(db, userId);
  const view = missions.find((row) => row.id === missionId);
  if (!view || view.done < view.target || week_start !== weekStart) {
    return { error: "아직 목표에 도달하지 않았어요.", status: 400 };
  }

  await db.batch([
    db
      .prepare(
        `INSERT INTO weekly_mission_claims (user_id, mission_id, week_start, points)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(userId, missionId, weekStart, def.bonus_points),
    db
      .prepare(
        `UPDATE users
         SET total_points = total_points + ?,
             total_xp = total_xp + ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(def.bonus_points, def.bonus_points, userId),
  ]);

  return { ok: true, points: def.bonus_points };
}

export async function loadQuiz(db: D1Database): Promise<QuizView | null> {
  const { results } = await db
    .prepare(
      `SELECT id, prompt_ko, item_id, choices_json, sort_order
       FROM quiz_questions ORDER BY sort_order`,
    )
    .all<{
      id: string;
      prompt_ko: string;
      item_id: string;
      choices_json: string;
    }>();
  const list = results ?? [];
  if (list.length === 0) return null;
  const row = list[kstDayIndex() % list.length];
  let choices: QuizChoice[] = [];
  try {
    choices = JSON.parse(row.choices_json) as QuizChoice[];
  } catch {
    choices = [];
  }
  return {
    id: row.id,
    prompt: row.prompt_ko,
    choices,
    item_id: row.item_id,
  };
}

export async function gradeQuiz(
  db: D1Database,
  questionId: string,
  answerId: string,
): Promise<
  | { correct: boolean; item_id: string; answer_id: string }
  | { error: string; status: 404 }
> {
  const row = await db
    .prepare(
      `SELECT id, item_id, answer_id FROM quiz_questions WHERE id = ?`,
    )
    .bind(questionId)
    .first<{ id: string; item_id: string; answer_id: string }>();
  if (!row) return { error: "퀴즈를 찾을 수 없어요.", status: 404 };
  return {
    correct: row.answer_id === answerId,
    item_id: row.item_id,
    answer_id: row.answer_id,
  };
}

export async function loadBag(
  db: D1Database,
  userId: string,
  districtId: string | null = null,
): Promise<BagItem[]> {
  const { results } = await db
    .prepare(
      `SELECT ck.id, ck.item_id, i.name_ko, i.category_id, i.special_bin_type,
              c.name_ko AS category_name, c.bin_type
       FROM checkins ck
       JOIN waste_items i ON i.id = ck.item_id
       JOIN waste_categories c ON c.id = i.category_id
       WHERE ck.user_id = ? AND ck.checkin_date = ?`,
    )
    .bind(userId, kstDate())
    .all<BagItem>();

  const schedule = await loadSchedule(db, districtId);
  return (results ?? [])
    .map((item) => ({
      ...item,
      collection: hintFromSchedule(schedule, item.category_id),
    }))
    .sort((a, b) => {
      const left = BAG_RANK[a.category_id] ?? 50;
      const right = BAG_RANK[b.category_id] ?? 50;
      if (left !== right) return left - right;
      return a.name_ko.localeCompare(b.name_ko, "ko");
    });
}

export const DEMO_ITEMS = [
  "pet-clear",
  "medicine",
  "delivery-container",
] as const;

export type BinReportCounts = {
  missing_24h: number;
  closed_24h: number;
};

export async function loadReportCounts(
  db: D1Database,
  binIds: string[],
): Promise<Map<string, BinReportCounts>> {
  const map = new Map<string, BinReportCounts>();
  if (binIds.length === 0) return map;
  const placeholders = binIds.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT bin_id, kind, COUNT(*) AS n
       FROM bin_reports
       WHERE bin_id IN (${placeholders})
         AND created_at >= datetime('now', '-1 day')
       GROUP BY bin_id, kind`,
    )
    .bind(...binIds)
    .all<{ bin_id: string; kind: string; n: number }>();

  for (const id of binIds) {
    map.set(id, { missing_24h: 0, closed_24h: 0 });
  }
  for (const row of results ?? []) {
    const current = map.get(row.bin_id) ?? { missing_24h: 0, closed_24h: 0 };
    if (row.kind === "missing") current.missing_24h = row.n;
    if (row.kind === "closed") current.closed_24h = row.n;
    map.set(row.bin_id, current);
  }
  return map;
}

export async function loadMyReportsToday(
  db: D1Database,
  userId: string,
  binId: string,
): Promise<{ missing: boolean; closed: boolean }> {
  const today = kstDate();
  const { results } = await db
    .prepare(
      `SELECT kind FROM bin_reports
       WHERE user_id = ? AND bin_id = ?
         AND date(created_at, '+9 hours') = ?`,
    )
    .bind(userId, binId, today)
    .all<{ kind: string }>();
  const kinds = new Set((results ?? []).map((row) => row.kind));
  return { missing: kinds.has("missing"), closed: kinds.has("closed") };
}

export async function createBinReport(
  db: D1Database,
  userId: string,
  binId: string,
  kind: string,
): Promise<{ ok: true } | { error: string; status: 400 | 404 | 409 }> {
  if (kind !== "missing" && kind !== "closed") {
    return { error: "제보 종류를 확인해 주세요.", status: 400 };
  }
  const bin = await db
    .prepare(`SELECT id FROM collection_bins WHERE id = ?`)
    .bind(binId)
    .first();
  if (!bin) return { error: "수거함을 찾을 수 없어요.", status: 404 };

  const mine = await loadMyReportsToday(db, userId, binId);
  if ((kind === "missing" && mine.missing) || (kind === "closed" && mine.closed)) {
    return { error: "오늘은 이미 제보했어요.", status: 409 };
  }

  await db
    .prepare(
      `INSERT INTO bin_reports (id, bin_id, user_id, kind) VALUES (?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), binId, userId, kind)
    .run();
  return { ok: true };
}
