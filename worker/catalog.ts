import type { GuidePayload, GuideStep, UpcycleTip } from "./types";

type ItemRow = {
  id: string;
  category_id: string;
  name_ko: string;
  summary_ko: string;
  special_bin_type: string | null;
  bin_type: string;
  category_name: string;
};

export async function loadGuide(
  db: D1Database,
  itemId: string,
): Promise<GuidePayload | null> {
  const item = await db
    .prepare(
      `SELECT i.id, i.category_id, i.name_ko, i.summary_ko, i.special_bin_type,
              c.bin_type, c.name_ko AS category_name
       FROM waste_items i
       JOIN waste_categories c ON c.id = i.category_id
       WHERE i.id = ? AND i.is_active = 1`,
    )
    .bind(itemId)
    .first<ItemRow>();

  if (!item) return null;

  const steps = await db
    .prepare(
      `SELECT step_order AS "order", title, body, required
       FROM guide_steps WHERE item_id = ? ORDER BY step_order`,
    )
    .bind(itemId)
    .all<GuideStep>();

  const tips = await db
    .prepare(
      `SELECT title, body, caution FROM upcycle_tips WHERE item_id = ? LIMIT 2`,
    )
    .bind(itemId)
    .all<UpcycleTip>();

  return {
    item_id: item.id,
    category_id: item.category_id,
    name_ko: item.name_ko,
    category_name: item.category_name,
    summary_ko: item.summary_ko,
    bin_type: item.bin_type,
    special_bin_type: item.special_bin_type,
    steps: steps.results ?? [],
    tips: tips.results ?? [],
  };
}

export async function searchItems(db: D1Database, query: string, limit = 8) {
  const like = `%${query}%`;
  const { results } = await db
    .prepare(
      `SELECT DISTINCT i.id, i.name_ko, i.summary_ko, i.category_id, c.name_ko AS category_name
       FROM waste_items i
       JOIN waste_categories c ON c.id = i.category_id
       LEFT JOIN waste_aliases a ON a.item_id = i.id
       WHERE i.is_active = 1
         AND (i.name_ko LIKE ? OR a.alias LIKE ? OR c.name_ko LIKE ?)
       LIMIT ?`,
    )
    .bind(like, like, like, limit)
    .all<{
      id: string;
      name_ko: string;
      summary_ko: string;
      category_id: string;
      category_name: string;
    }>();
  return results ?? [];
}
