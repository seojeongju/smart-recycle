export async function lookupRegion(
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
      principalSubdivision?: string;
      city?: string;
      locality?: string;
    };
    const parts = [data.principalSubdivision, data.city || data.locality].filter(
      (part): part is string => Boolean(part && part.trim()),
    );
    const unique = [...new Set(parts)];
    return unique.length > 0 ? unique.join(" ") : null;
  } catch {
    return null;
  }
}
