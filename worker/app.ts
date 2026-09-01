import { Hono } from "hono";
import { loadGuide, searchItems, suggestItems } from "./catalog";
import type { AppEnv } from "./env";
import {
  haversineMeters,
  jsonError,
  kstDate,
  kstYesterday,
  levelFromXp,
} from "./lib";
import { recognizeImage } from "./recognize";
import { syncPublicData } from "./sync";
import { ensureUser } from "./user";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const app = new Hono<AppEnv>();

app.onError((err, c) => {
  console.error(JSON.stringify({ msg: "처리되지 않은 오류", error: err.message }));
  return c.json(jsonError("INTERNAL", "잠시 후 다시 시도해 주세요."), 500);
});

app.get("/api/health", (c) => c.json({ ok: true, name: "smart-recycle" }));

app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/health") return next();
  return ensureUser(c, next);
});

app.get("/api/sync/status", async (c) => {
  const last = await c.env.DB.prepare(
    `SELECT source, status, row_count, error, ran_at
     FROM sync_jobs ORDER BY id DESC LIMIT 1`,
  ).first<{
    source: string;
    status: string;
    row_count: number | null;
    error: string | null;
    ran_at: string;
  }>();
  const pharmacy = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM collection_bins WHERE source = 'public_data_pharmacy'`,
  ).first<{ n: number }>();
  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM collection_bins`,
  ).first<{ n: number }>();
  return c.json({
    last,
    pharmacy_count: pharmacy?.n ?? 0,
    total_bins: total?.n ?? 0,
  });
});

app.post("/api/sync", async (c) => {
  const recent = await c.env.DB.prepare(
    `SELECT id FROM sync_jobs
     WHERE source = 'public_data'
       AND ran_at >= datetime('now', '-10 minutes')
     LIMIT 1`,
  ).first();
  if (recent) {
    return c.json(
      jsonError("RATE_LIMIT", "방금 동기화했어요. 잠시 후 다시 시도해 주세요."),
      429,
    );
  }
  await syncPublicData(c.env);
  const last = await c.env.DB.prepare(
    `SELECT source, status, row_count, error, ran_at
     FROM sync_jobs ORDER BY id DESC LIMIT 1`,
  ).first();
  const pharmacy = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM collection_bins WHERE source = 'public_data_pharmacy'`,
  ).first<{ n: number }>();
  return c.json({ last, pharmacy_count: pharmacy?.n ?? 0 });
});

app.get("/api/categories", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name_ko, bin_type, sort_order
     FROM waste_categories ORDER BY sort_order`,
  ).all();
  return c.json({ categories: results ?? [] });
});

app.get("/api/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (q.length < 1) return c.json({ items: [] });

  const items = await searchItems(c.env.DB, q, 8);
  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `INSERT INTO search_logs (query, result_count) VALUES (?, ?)`,
    )
      .bind(q.slice(0, 80), items.length)
      .run()
      .then(() => undefined)
      .catch((error: unknown) => {
        console.error(
          JSON.stringify({
            msg: "검색 로그 저장 실패",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),
  );
  return c.json({ items });
});

app.get("/api/items/:id", async (c) => {
  const guide = await loadGuide(c.env.DB, c.req.param("id"));
  if (!guide) {
    return c.json(jsonError("NOT_FOUND", "해당 품목 가이드를 찾을 수 없어요."), 404);
  }
  return c.json({ guide });
});

app.post("/api/recognize", async (c) => {
  const userId = c.get("userId");
  const started = Date.now();

  const minuteCount = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM recognition_logs
     WHERE user_id = ? AND created_at >= datetime('now', '-1 minute')`,
  )
    .bind(userId)
    .first<{ n: number }>();
  if ((minuteCount?.n ?? 0) >= 10) {
    return c.json(
      jsonError("RATE_LIMIT", "요청이 많아요. 잠시 후 다시 촬영해 주세요."),
      429,
    );
  }

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return c.json(jsonError("BAD_REQUEST", "이미지 파일이 필요해요."), 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json(
      jsonError("BAD_REQUEST", "JPEG, PNG, WebP만 올릴 수 있어요."),
      400,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json(jsonError("PAYLOAD_TOO_LARGE", "이미지는 5MB 이하여야 해요."), 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const now = new Date();
  const key = `uploads/${userId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.jpg`;

  try {
    await c.env.IMAGES.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "R2 업로드 실패",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  const result = await recognizeImage(c.env, bytes);
  const latency = Date.now() - started;
  const logId = crypto.randomUUID();
  const fallback = result.fallback || !result.itemId;

  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `INSERT INTO recognition_logs
        (id, user_id, image_key, raw_label, item_id, category_id, confidence, latency_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        logId,
        userId,
        key,
        `${result.model}:${result.rawLabel}`.slice(0, 200),
        result.itemId,
        result.categoryId,
        result.confidence,
        latency,
      )
      .run()
      .then(() => undefined)
      .catch((error: unknown) => {
        console.error(
          JSON.stringify({
            msg: "인식 로그 저장 실패",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),
  );

  const guide = result.itemId ? await loadGuide(c.env.DB, result.itemId) : null;
  const suggestions = fallback
    ? await suggestItems(c.env.DB, result.categoryId)
    : [];
  return c.json({
    recognition: {
      id: logId,
      item_id: result.itemId,
      category_id: result.categoryId,
      label_ko: result.labelKo,
      confidence: result.confidence,
      image_key: key,
      model: result.model,
    },
    guide,
    fallback: fallback || !guide,
    suggestions,
  });
});

app.post("/api/recognize/feedback", async (c) => {
  const body = await c.req.json<{
    log_id?: string;
    item_id?: string;
    helpful?: boolean;
  }>();
  const itemId = (body.item_id ?? "").trim();
  if (!itemId || typeof body.helpful !== "boolean") {
    return c.json(jsonError("BAD_REQUEST", "피드백 값이 필요해요."), 400);
  }
  await c.env.DB.prepare(
    `INSERT INTO recognition_feedback (id, user_id, log_id, item_id, helpful)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      c.get("userId"),
      body.log_id ?? null,
      itemId,
      body.helpful ? 1 : 0,
    )
    .run();
  return c.json({ ok: true });
});

app.get("/api/bins", async (c) => {
  const lat = Number(c.req.query("lat") ?? "37.5665");
  const lng = Number(c.req.query("lng") ?? "126.9780");
  const radius = Math.min(Number(c.req.query("radius_m") ?? "3000"), 10000);
  const type = c.req.query("type");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return c.json(jsonError("BAD_REQUEST", "위치 값이 올바르지 않아요."), 400);
  }

  const pad = radius / 111_000;
  const params: unknown[] = [lat - pad, lat + pad, lng - pad, lng + pad];
  let sql = `SELECT id, type, name, address, lat, lng, phone, hours
             FROM collection_bins
             WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`;
  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }

  const { results } = await c.env.DB.prepare(sql)
    .bind(...params)
    .all<{
      id: string;
      type: string;
      name: string;
      address: string | null;
      lat: number;
      lng: number;
      phone: string | null;
      hours: string | null;
    }>();

  const bins = (results ?? [])
    .map((bin) => ({
      ...bin,
      distance_m: Math.round(haversineMeters(lat, lng, bin.lat, bin.lng)),
    }))
    .filter((bin) => bin.distance_m <= radius)
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, 100);

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM collection_bins`,
  ).first<{ n: number }>();
  const lastSync = await c.env.DB.prepare(
    `SELECT status, row_count, ran_at, error FROM sync_jobs
     ORDER BY id DESC LIMIT 1`,
  ).first<{
    status: string;
    row_count: number | null;
    ran_at: string;
    error: string | null;
  }>();

  return c.json({
    bins,
    meta: {
      nearby: bins.length,
      total: total?.n ?? 0,
      last_sync: lastSync,
    },
  });
});

app.get("/api/bins/:id", async (c) => {
  const bin = await c.env.DB.prepare(
    `SELECT id, type, name, address, lat, lng, phone, hours
     FROM collection_bins WHERE id = ?`,
  )
    .bind(c.req.param("id"))
    .first();
  if (!bin) {
    return c.json(jsonError("NOT_FOUND", "수거함을 찾을 수 없어요."), 404);
  }
  return c.json({ bin });
});

app.get("/api/me", async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare(
    `SELECT id, nickname, total_xp, total_points, streak_count, last_checkin_date
     FROM users WHERE id = ?`,
  )
    .bind(userId)
    .first<{
      id: string;
      nickname: string;
      total_xp: number;
      total_points: number;
      streak_count: number;
      last_checkin_date: string | null;
    }>();

  if (!user) {
    return c.json(jsonError("NOT_FOUND", "사용자를 찾을 수 없어요."), 404);
  }

  const count = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM checkins WHERE user_id = ?`,
  )
    .bind(userId)
    .first<{ n: number }>();

  const from = kstDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const { results: days } = await c.env.DB.prepare(
    `SELECT DISTINCT checkin_date FROM checkins
     WHERE user_id = ? AND checkin_date >= ?`,
  )
    .bind(userId, from)
    .all<{ checkin_date: string }>();

  const progress = levelFromXp(user.total_xp);
  return c.json({
    user: {
      ...user,
      ...progress,
      checkin_count: count?.n ?? 0,
      recent_dates: (days ?? []).map((d) => d.checkin_date),
    },
  });
});

app.patch("/api/me", async (c) => {
  const body = await c.req.json<{ nickname?: string }>();
  const nickname = (body.nickname ?? "").trim();
  if (!nickname || nickname.length > 12) {
    return c.json(
      jsonError("BAD_REQUEST", "별명은 1~12자로 입력해 주세요."),
      400,
    );
  }
  await c.env.DB.prepare(
    `UPDATE users SET nickname = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(nickname, c.get("userId"))
    .run();
  return c.json({ ok: true, nickname });
});

app.post("/api/checkins", async (c) => {
  const userId = c.get("userId");
  const contentType = c.req.header("content-type") ?? "";
  let itemId = "";
  let imageKey: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.formData();
    itemId = String(form.get("item_id") ?? "");
    const image = form.get("image");
    if (image instanceof File && image.size > 0) {
      if (!ALLOWED_TYPES.has(image.type) || image.size > MAX_UPLOAD_BYTES) {
        return c.json(
          jsonError("BAD_REQUEST", "인증 사진 형식을 확인해 주세요."),
          400,
        );
      }
      imageKey = `checkins/${userId}/${crypto.randomUUID()}.jpg`;
      await c.env.IMAGES.put(imageKey, await image.arrayBuffer(), {
        httpMetadata: { contentType: image.type },
      });
    }
  } else {
    try {
      const body = await c.req.json<{ item_id?: string }>();
      itemId = body.item_id ?? "";
    } catch {
      return c.json(jsonError("BAD_REQUEST", "요청 형식을 확인해 주세요."), 400);
    }
  }

  if (!itemId) {
    return c.json(jsonError("BAD_REQUEST", "품목이 필요해요."), 400);
  }

  const item = await c.env.DB.prepare(
    `SELECT id FROM waste_items WHERE id = ? AND is_active = 1`,
  )
    .bind(itemId)
    .first();
  if (!item) {
    return c.json(jsonError("NOT_FOUND", "품목을 찾을 수 없어요."), 404);
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM checkins WHERE user_id = ? AND item_id = ? AND checkin_date = ?`,
  )
    .bind(userId, itemId, kstDate())
    .first();
  if (existing) {
    return c.json({
      awarded: false,
      points: 0,
      message: "오늘 이 품목은 이미 인증했어요.",
    });
  }

  const user = await c.env.DB.prepare(
    `SELECT total_xp, total_points, streak_count, last_checkin_date
     FROM users WHERE id = ?`,
  )
    .bind(userId)
    .first<{
      total_xp: number;
      total_points: number;
      streak_count: number;
      last_checkin_date: string | null;
    }>();

  if (!user) {
    return c.json(jsonError("NOT_FOUND", "사용자를 찾을 수 없어요."), 404);
  }

  const today = kstDate();
  const alreadyToday = user.last_checkin_date === today;
  const points = alreadyToday ? 0 : 10;
  const xp = alreadyToday ? 0 : 10;
  let streak = user.streak_count;
  if (!alreadyToday) {
    streak = user.last_checkin_date === kstYesterday() ? user.streak_count + 1 : 1;
  }

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO checkins (id, user_id, item_id, checkin_date, points, image_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), userId, itemId, today, points, imageKey),
    c.env.DB.prepare(
      `UPDATE users
       SET total_xp = total_xp + ?,
           total_points = total_points + ?,
           streak_count = ?,
           last_checkin_date = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(xp, points, streak, today, userId),
  ]);

  return c.json({
    awarded: points > 0,
    points,
    streak,
    level: levelFromXp(user.total_xp + xp),
    message: points > 0 ? "인증 완료! 새싹이가 조금 자랐어요." : "오늘은 이미 인증했어요.",
  });
});

app.get("/api/checkins", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? "20"), 50);
  const { results } = await c.env.DB.prepare(
    `SELECT ck.id, ck.checkin_date, ck.points, i.name_ko, i.id AS item_id
     FROM checkins ck
     LEFT JOIN waste_items i ON i.id = ck.item_id
     WHERE ck.user_id = ?
     ORDER BY ck.created_at DESC
     LIMIT ?`,
  )
    .bind(c.get("userId"), limit)
    .all();
  return c.json({ checkins: results ?? [] });
});

app.get("/api/images/*", async (c) => {
  const key = c.req.path.replace("/api/images/", "");
  const userId = c.get("userId");
  if (!key.startsWith(`uploads/${userId}/`) && !key.startsWith(`checkins/${userId}/`)) {
    return c.json(jsonError("FORBIDDEN", "이 이미지에 접근할 수 없어요."), 403);
  }
  const object = await c.env.IMAGES.get(key);
  if (!object) {
    return c.json(jsonError("NOT_FOUND", "이미지를 찾을 수 없어요."), 404);
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
});
