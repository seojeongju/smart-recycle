type SyncEnv = Cloudflare.Env & { PUBLIC_DATA_API_KEY?: string };

type BinRow = {
  id: string;
  type: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
  source: string;
  externalId: string;
};

const PHARMACY_API =
  "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

const REGIONS = [
  "서울특별시",
  "부산광역시",
  "인천광역시",
  "대구광역시",
  "대전광역시",
  "광주광역시",
  "울산광역시",
  "경기도",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
  }
  const rec = asRecord(value);
  return rec ? [rec] : [];
}

function formatHours(row: Record<string, unknown>): string | null {
  const start = String(row.dutyTime1s ?? "").padStart(4, "0");
  const end = String(row.dutyTime1c ?? "").padStart(4, "0");
  if (start.length !== 4 || end.length !== 4 || start === "0000") return null;
  return `평일 ${start.slice(0, 2)}:${start.slice(2)}–${end.slice(0, 2)}:${end.slice(2)}`;
}

async function fetchJsonWithRetry(url: string): Promise<unknown> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    lastStatus = response.status;
    if (response.ok) return response.json();
    if (![429, 502, 503, 522, 524].includes(response.status) || attempt === 3) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
  }
  throw new Error(`약국 API ${lastStatus}`);
}

async function fetchPharmacies(
  key: string,
  sido: string,
  pageNo: number,
): Promise<{ rows: BinRow[]; total: number }> {
  const url = new URL(PHARMACY_API);
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("Q0", sido);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", "200");
  url.searchParams.set("_type", "json");

  const data = asRecord(await fetchJsonWithRetry(url.toString()));
  const body = asRecord(asRecord(data?.response)?.body);
  const total = Number(body?.totalCount ?? 0);
  const items = asList(asRecord(body?.items)?.item);
  const rows: BinRow[] = [];
  for (const item of items) {
    const lat = Number(item.wgs84Lat);
    const lng = Number(item.wgs84Lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const hpid = String(item.hpid ?? `${lat},${lng}`);
    rows.push({
      id: `pub-med-${hpid}`,
      type: "medicine",
      name: String(item.dutyName ?? "약국"),
      address: String(item.dutyAddr ?? "") || null,
      lat,
      lng,
      phone: String(item.dutyTel1 ?? "") || null,
      hours: formatHours(item),
      source: "public_data_pharmacy",
      externalId: hpid,
    });
  }
  return { rows, total };
}

async function upsertBins(db: D1Database, rows: BinRow[]): Promise<number> {
  let count = 0;
  for (let i = 0; i < rows.length; i += 20) {
    const chunk = rows.slice(i, i + 20);
    await db.batch(
      chunk.map((row) =>
        db
          .prepare(
            `INSERT INTO collection_bins
              (id, type, name, address, lat, lng, phone, hours, source, external_id, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               address = excluded.address,
               lat = excluded.lat,
               lng = excluded.lng,
               phone = excluded.phone,
               hours = excluded.hours,
               updated_at = datetime('now')`,
          )
          .bind(
            row.id,
            row.type,
            row.name,
            row.address,
            row.lat,
            row.lng,
            row.phone,
            row.hours,
            row.source,
            row.externalId,
          ),
      ),
    );
    count += chunk.length;
  }
  return count;
}

async function nextRegion(db: D1Database): Promise<string> {
  const last = await db
    .prepare(
      `SELECT error FROM sync_jobs
       WHERE source = 'public_data' AND status = 'success'
       ORDER BY id DESC LIMIT 1`,
    )
    .first<{ error: string | null }>();
  const prev = last?.error ?? "";
  const idx = REGIONS.indexOf(prev);
  return REGIONS[(idx + 1) % REGIONS.length];
}

export async function expireOldImages(env: Cloudflare.Env): Promise<number> {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const listed = await env.IMAGES.list({
      prefix: "uploads/",
      cursor,
      limit: 100,
    });
    for (const object of listed.objects) {
      const uploaded = object.uploaded?.getTime?.() ?? 0;
      if (uploaded && uploaded < cutoff) {
        await env.IMAGES.delete(object.key);
        deleted += 1;
      }
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return deleted;
}

export async function syncPublicData(env: Cloudflare.Env): Promise<void> {
  const typed = env as SyncEnv;
  const deleted = await expireOldImages(env).catch((error: unknown) => {
    console.error(
      JSON.stringify({
        msg: "인식 이미지 정리 실패",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return 0;
  });
  console.log(JSON.stringify({ msg: "만료 이미지 삭제", deleted }));

  const key = typed.PUBLIC_DATA_API_KEY;
  if (!key) {
    await env.DB.prepare(
      `INSERT INTO sync_jobs (source, status, row_count, error)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(
        "public_data",
        "fail",
        0,
        "공공데이터 API 키가 없어 시드를 유지합니다.",
      )
      .run();
    console.log(JSON.stringify({ msg: "공공데이터 동기화 건너뜀", reason: "키 없음" }));
    return;
  }

  const sido = await nextRegion(env.DB);
  let imported = 0;
  try {
    const first = await fetchPharmacies(key, sido, 1);
    imported += await upsertBins(env.DB, first.rows);
    const pages = Math.min(5, Math.ceil(first.total / 200));
    for (let page = 2; page <= pages; page += 1) {
      const next = await fetchPharmacies(key, sido, page);
      imported += await upsertBins(env.DB, next.rows);
    }
    await env.DB.prepare(
      `INSERT INTO sync_jobs (source, status, row_count, error)
       VALUES (?, ?, ?, ?)`,
    )
      .bind("public_data", "success", imported, sido)
      .run();
    console.log(
      JSON.stringify({ msg: "공공데이터 동기화 완료", sido, imported }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const ok = imported > 0;
    await env.DB.prepare(
      `INSERT INTO sync_jobs (source, status, row_count, error)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(
        "public_data",
        ok ? "success" : "fail",
        imported,
        ok ? sido : `${sido}: ${message}`.slice(0, 400),
      )
      .run();
    console.error(
      JSON.stringify({
        msg: ok ? "공공데이터 일부 동기화" : "공공데이터 동기화 실패",
        sido,
        imported,
        error: message,
      }),
    );
  }
}
