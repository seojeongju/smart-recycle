import type { District } from "../types";

export function matchDistrict(
  text: string | null | undefined,
  districts: District[],
): District | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, "");
  return (
    districts.find((row) => normalized.includes(row.name_ko.replace(/\s+/g, ""))) ??
    null
  );
}

export async function lookupDistrictName(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", "ko");
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = (await response.json()) as {
      locality?: string;
      city?: string;
      principalSubdivision?: string;
      local?: { district?: string };
    };
    const blob = [data.locality, data.city, data.principalSubdivision]
      .filter(Boolean)
      .join(" ");
    const match = blob.match(/([가-힣]+구)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
