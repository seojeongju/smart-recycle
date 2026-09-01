import { CATEGORY_DEFAULT_ITEM, COCO_TO_CATEGORY } from "./lib";
import { loadGuide } from "./catalog";
import { classifyWithVisionLlm, type CatalogChoice } from "./vision";

type DetrPrediction = {
  label?: string;
  score?: number;
  confidence?: number;
};

export type RecognizeResult = {
  itemId: string | null;
  categoryId: string;
  labelKo: string;
  confidence: number;
  rawLabel: string;
  fallback: boolean;
  model: string;
};

function asPredictions(raw: unknown): DetrPrediction[] {
  if (Array.isArray(raw)) return raw as DetrPrediction[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.predictions)) return obj.predictions as DetrPrediction[];
    if (Array.isArray(obj.detected_objects)) {
      return obj.detected_objects as DetrPrediction[];
    }
  }
  return [];
}

function mapLabelToCategory(label: string): string | null {
  const key = label.trim().toLowerCase();
  return COCO_TO_CATEGORY[key] ?? null;
}

async function loadChoices(db: D1Database): Promise<CatalogChoice[]> {
  const { results } = await db
    .prepare(
      `SELECT id, category_id, name_ko FROM waste_items WHERE is_active = 1`,
    )
    .all<CatalogChoice>();
  return results ?? [];
}

async function detectObjects(
  env: Cloudflare.Env,
  bytes: Uint8Array,
): Promise<{ label: string; score: number; category: string | null }[]> {
  try {
    const image = Array.from(bytes);
    const result = await env.AI.run("@cf/facebook/detr-resnet-50", { image });
    return asPredictions(result)
      .map((row) => ({
        label: row.label ?? "",
        score: row.score ?? row.confidence ?? 0,
        category: row.label ? mapLabelToCategory(row.label) : null,
      }))
      .filter((row) => row.label)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "DETR 객체 검출 실패",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }
}

function fromDetr(
  detections: { label: string; score: number; category: string | null }[],
): RecognizeResult | null {
  const top = detections.find((row) => row.category && row.score >= 0.55);
  if (!top?.category) return null;
  const itemId = CATEGORY_DEFAULT_ITEM[top.category] ?? null;
  return {
    itemId,
    categoryId: top.category,
    labelKo: top.label,
    confidence: top.score,
    rawLabel: top.label,
    fallback: !itemId,
    model: "detr",
  };
}

export async function recognizeImage(
  env: Cloudflare.Env,
  bytes: Uint8Array,
): Promise<RecognizeResult> {
  const unknown: RecognizeResult = {
    itemId: null,
    categoryId: "unknown",
    labelKo: "잘 모르겠어요",
    confidence: 0,
    rawLabel: "",
    fallback: true,
    model: "none",
  };

  const [detections, items] = await Promise.all([
    detectObjects(env, bytes),
    loadChoices(env.DB),
  ]);
  const detrHint = detections
    .map((row) => `${row.label} ${row.score.toFixed(2)}`)
    .join(", ");

  const llm = await classifyWithVisionLlm(env, bytes, items, detrHint);
  if (llm?.itemId) {
    const guide = await loadGuide(env.DB, llm.itemId);
    return {
      itemId: llm.itemId,
      categoryId: llm.categoryId,
      labelKo: guide?.name_ko ?? llm.rawLabel,
      confidence: llm.confidence,
      rawLabel: llm.rawLabel,
      fallback: !guide,
      model: llm.model,
    };
  }

  const detr = fromDetr(detections);
  if (detr?.itemId) {
    const guide = await loadGuide(env.DB, detr.itemId);
    return {
      ...detr,
      labelKo: guide?.name_ko ?? detr.labelKo,
      fallback: !guide,
    };
  }

  if (llm?.categoryId && llm.categoryId !== "unknown") {
    const itemId = CATEGORY_DEFAULT_ITEM[llm.categoryId] ?? null;
    if (itemId) {
      const guide = await loadGuide(env.DB, itemId);
      return {
        itemId,
        categoryId: llm.categoryId,
        labelKo: guide?.name_ko ?? "추정 품목",
        confidence: llm.confidence,
        rawLabel: llm.rawLabel,
        fallback: !guide,
        model: llm.model,
      };
    }
  }

  return {
    ...unknown,
    rawLabel: detections[0]?.label ?? llm?.rawLabel ?? "",
    confidence: detections[0]?.score ?? llm?.confidence ?? 0,
  };
}
