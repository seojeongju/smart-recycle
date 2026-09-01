export function kstDate(now = new Date()): string {
  const shifted = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function kstYesterday(now = new Date()): string {
  return kstDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

export function levelFromXp(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpToNext: number;
} {
  const capped = Math.max(0, totalXp);
  const level = Math.min(10, Math.floor(capped / 50) + 1);
  const xpInLevel = level >= 10 ? 50 : capped % 50;
  const xpToNext = level >= 10 ? 0 : 50 - xpInLevel;
  return { level, xpInLevel, xpToNext };
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function jsonError(code: string, message: string) {
  return { error: { code, message } } as const;
}

export const CATEGORY_DEFAULT_ITEM: Record<string, string> = {
  pet: "pet-clear",
  plastic: "plastic-container",
  can: "alu-can",
  glass: "glass-bottle",
  paper: "paper-box",
  vinyl: "vinyl-bag",
  food: "food-waste",
  general: "general-waste",
  battery: "battery",
  medicine: "medicine",
  small_electronics: "small-electronics",
  clothing: "clothing",
};

export const COCO_TO_CATEGORY: Record<string, string> = {
  bottle: "pet",
  cup: "plastic",
  "wine glass": "glass",
  vase: "glass",
  book: "paper",
  carton: "paper",
  "cell phone": "small_electronics",
  laptop: "small_electronics",
  remote: "small_electronics",
  keyboard: "small_electronics",
  mouse: "small_electronics",
  banana: "food",
  apple: "food",
  orange: "food",
  broccoli: "food",
  carrot: "food",
  sandwich: "food",
  pizza: "food",
  donut: "food",
  cake: "food",
  backpack: "clothing",
  handbag: "clothing",
  tie: "clothing",
  umbrella: "general",
};
