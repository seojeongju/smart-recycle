import { CATEGORY_DEFAULT_ITEM } from "./lib";

export type CatalogChoice = {
  id: string;
  category_id: string;
  name_ko: string;
};

export type VisionGuess = {
  itemId: string | null;
  categoryId: string;
  confidence: number;
  rawLabel: string;
  reason: string;
  model: string;
};

const QWEN = "@cf/qwen/qwen3.8-27b";
const MOONDREAM = "@cf/moondream/moondream3.1-9B-A2B";
const LLM_MIN_CONFIDENCE = 0.45;

function toBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function toDataUri(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${toBase64(bytes)}`;
}

function catalogPrompt(items: CatalogChoice[], detrHint: string): string {
  const lines = items.map((item) => `- ${item.id}: ${item.name_ko} (${item.category_id})`);
  return [
    "당신은 한국 분리배출 도우미입니다.",
    "사진에서 가장 크게 보이는 쓰레기 품목 하나만을 고르세요.",
    "반드시 아래 카탈로그의 item_id만 사용하세요. 없으면 unknown.",
    "투명 페트와 유색 페트, 종이컵과 플라스틱컵, 배달용기와 일반 플라스틱을 구분하세요.",
    detrHint ? `객체 검출 힌트: ${detrHint}` : "",
    "카탈로그:",
    ...lines,
    'JSON만 답하세요: {"item_id":"...","category_id":"...","confidence":0.0,"reason":"한 줄"}',
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/\{[\s\S]*\}/);
  if (!fenced) return null;
  try {
    return JSON.parse(fenced[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function parseModelPayload(raw: unknown): Record<string, unknown> | null {
  const obj = asRecord(raw);
  if (!obj) return typeof raw === "string" ? extractJson(raw) : null;

  const firstChoice = Array.isArray(obj.choices) ? asRecord(obj.choices[0]) : null;
  const message = asRecord(firstChoice?.message);
  const content = message?.content;
  if (typeof content === "string") {
    const parsed = extractJson(content);
    if (parsed) return parsed;
  }
  if (typeof obj.response === "string") {
    const parsed = extractJson(obj.response);
    if (parsed) return parsed;
  }
  if (typeof obj.answer === "string") {
    const parsed = extractJson(obj.answer);
    if (parsed) return parsed;
  }

  const calls = Array.isArray(obj.tool_calls)
    ? obj.tool_calls
      : Array.isArray(message?.tool_calls)
        ? (message?.tool_calls as unknown[])
        : [];
  const firstCall = asRecord(calls[0]);
  const fn = asRecord(firstCall?.function) ?? firstCall;
  const args = fn?.arguments ?? firstCall?.arguments;
  if (typeof args === "string") {
    try {
      return extractJson(args) ?? asRecord(JSON.parse(args));
    } catch {
      return extractJson(args);
    }
  }
  if (args && typeof args === "object") return asRecord(args);

  if (typeof obj.item_id === "string") return obj;
  return null;
}

function toGuess(
  payload: Record<string, unknown> | null,
  items: CatalogChoice[],
  model: string,
): VisionGuess | null {
  if (!payload) return null;
  const itemIdRaw = String(payload.item_id ?? "").trim();
  const categoryRaw = String(payload.category_id ?? "").trim();
  const confidence = Number(payload.confidence ?? 0);
  const reason = String(payload.reason ?? "").slice(0, 120);
  if (!itemIdRaw || itemIdRaw === "unknown" || confidence < LLM_MIN_CONFIDENCE) {
    return {
      itemId: null,
      categoryId: categoryRaw || "unknown",
      confidence: Number.isFinite(confidence) ? confidence : 0,
      rawLabel: reason || itemIdRaw,
      reason,
      model,
    };
  }
  const item = items.find((row) => row.id === itemIdRaw);
  if (!item) return null;
  return {
    itemId: item.id,
    categoryId: item.category_id,
    confidence: Math.min(1, Math.max(0, Number.isFinite(confidence) ? confidence : 0.6)),
    rawLabel: `${item.name_ko} (${model})`,
    reason,
    model,
  };
}

async function classifyWithQwen(
  env: Cloudflare.Env,
  bytes: Uint8Array,
  items: CatalogChoice[],
  detrHint: string,
): Promise<VisionGuess | null> {
  const ids = [...items.map((item) => item.id), "unknown"];
  const categories = [
    ...new Set([...items.map((item) => item.category_id), "unknown"]),
  ];
  const prompt = catalogPrompt(items, detrHint);
  const result = await env.AI.run(QWEN, {
    messages: [
      {
        role: "system",
        content: "분리배출 품목 분류기. JSON 또는 도구 호출만 사용한다. 추측 서술은 reason 한 줄만.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: toDataUri(bytes) } },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 180,
    reasoning_effort: "low",
    chat_template_kwargs: { enable_thinking: false },
    tool_choice: { type: "function", function: { name: "classify_waste" } },
    tools: [
      {
        type: "function",
        function: {
          name: "classify_waste",
          description: "사진 속 분리배출 품목을 카탈로그에서 고른다.",
          parameters: {
            type: "object",
            properties: {
              item_id: { type: "string", enum: ids },
              category_id: { type: "string", enum: categories },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
            required: ["item_id", "category_id", "confidence", "reason"],
          },
        },
      },
    ],
  } as never);
  return toGuess(parseModelPayload(result), items, "qwen");
}

async function classifyWithMoondream(
  env: Cloudflare.Env,
  bytes: Uint8Array,
  items: CatalogChoice[],
  detrHint: string,
): Promise<VisionGuess | null> {
  const result = await env.AI.run(MOONDREAM, {
    task: "query",
    image: toDataUri(bytes),
    question: catalogPrompt(items, detrHint),
    reasoning: false,
    max_tokens: 180,
    stream: false,
    temperature: 0,
  } as never);
  return toGuess(parseModelPayload(result), items, "moondream");
}

export async function classifyWithVisionLlm(
  env: Cloudflare.Env,
  bytes: Uint8Array,
  items: CatalogChoice[],
  detrHint: string,
): Promise<VisionGuess | null> {
  try {
    const qwen = await classifyWithQwen(env, bytes, items, detrHint);
    if (qwen?.itemId) return qwen;
    if (qwen && qwen.categoryId !== "unknown") {
      const fallbackId = CATEGORY_DEFAULT_ITEM[qwen.categoryId];
      if (fallbackId) {
        return { ...qwen, itemId: fallbackId };
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "Qwen 2차 분류 실패",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  try {
    const moon = await classifyWithMoondream(env, bytes, items, detrHint);
    if (moon?.itemId) return moon;
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "Moondream 대체 분류 실패",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
  return null;
}
