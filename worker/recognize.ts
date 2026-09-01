import {
  CATEGORY_DEFAULT_ITEM,
  COCO_TO_CATEGORY,
} from "./lib";
import { loadGuide } from "./catalog";

type DetrPrediction = {
  label?: string;
  score?: number;
  confidence?: number;
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

export async function recognizeImage(
  env: Cloudflare.Env,
  bytes: Uint8Array,
): Promise<{
  itemId: string | null;
  categoryId: string;
  labelKo: string;
  confidence: number;
  rawLabel: string;
  fallback: boolean;
}> {
  try {
    const image = Array.from(bytes);
    const result = await env.AI.run("@cf/facebook/detr-resnet-50", {
      image,
    });
    const predictions = asPredictions(result).sort(
      (a, b) => (b.score ?? b.confidence ?? 0) - (a.score ?? a.confidence ?? 0),
    );
    const top = predictions[0];
    const score = top?.score ?? top?.confidence ?? 0;
    const label = top?.label ?? "";
    const category = label ? mapLabelToCategory(label) : null;

    if (!category || score < 0.55) {
      return {
        itemId: null,
        categoryId: "unknown",
        labelKo: "잘 모르겠어요",
        confidence: score,
        rawLabel: label,
        fallback: true,
      };
    }

    const itemId = CATEGORY_DEFAULT_ITEM[category] ?? null;
    const guide = itemId ? await loadGuide(env.DB, itemId) : null;
    return {
      itemId,
      categoryId: category,
      labelKo: guide?.name_ko ?? label,
      confidence: score,
      rawLabel: label,
      fallback: !guide,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "인식 모델 호출 실패",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return {
      itemId: null,
      categoryId: "unknown",
      labelKo: "잘 모르겠어요",
      confidence: 0,
      rawLabel: "",
      fallback: true,
    };
  }
}
