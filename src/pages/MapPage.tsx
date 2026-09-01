import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api, formatDistance } from "../api";
import { lookupRegion } from "../lib/region";
import { BIN_LABELS, BIN_SOURCE_LABELS, SEOUL_HALL, type Bin } from "../types";

const FILTERS = [
  { id: "", label: "전체" },
  { id: "medicine", label: "폐의약품" },
  { id: "electronics", label: "소형가전" },
  { id: "clothing", label: "의류" },
  { id: "recycle_station", label: "정거장" },
  { id: "battery", label: "건전지" },
];

export function MapPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get("type") ?? "";
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [origin, setOrigin] = useState(SEOUL_HALL);
  const [denied, setDenied] = useState(false);
  const [bins, setBins] = useState<Bin[]>([]);
  const [selected, setSelected] = useState<Bin | null>(null);
  const [coverage, setCoverage] = useState<{ nearby: number; total: number } | null>(
    null,
  );
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setDenied(true),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    void lookupRegion(origin.lat, origin.lng).then(setRegion);
  }, [origin]);

  useEffect(() => {
    const query = new URLSearchParams({
      lat: String(origin.lat),
      lng: String(origin.lng),
      radius_m: "3000",
    });
    if (type) query.set("type", type);
    void api<{
      bins: Bin[];
      meta?: { nearby: number; total: number };
    }>(`/api/bins?${query}`).then((data) => {
      setBins(data.bins);
      setCoverage(data.meta ?? null);
      setSelected(null);
    });
  }, [origin, type]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: false }).setView(
      [origin.lat, origin.lng],
      15,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [origin.lat, origin.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    map.setView([origin.lat, origin.lng], map.getZoom() || 15);
    L.circleMarker([origin.lat, origin.lng], {
      radius: 8,
      color: "#111111",
      fillColor: "#7BE04A",
      fillOpacity: 1,
      weight: 3,
    })
      .addTo(layer)
      .bindTooltip("내 위치", { permanent: false });

    for (const bin of bins) {
      const marker = L.circleMarker([bin.lat, bin.lng], {
        radius: 9,
        color: "#111111",
        fillColor: "#7BE04A",
        fillOpacity: 1,
        weight: 2,
      }).addTo(layer);
      marker.on("click", () => setSelected(bin));
    }
  }, [bins, origin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => map.invalidateSize(), 220);
    return () => window.clearTimeout(timer);
  }, [selected, bins, origin]);

  const list = useMemo(() => bins.slice(0, 8), [bins]);
  const place = denied ? "서울시청" : region || "내 위치";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-4">
        <h1 className="text-[26px] font-extrabold tracking-tight">수거함</h1>
        <p className="mt-1 text-xs leading-5 text-mute">
          {place} 기준 · 안내는 일반 기준이에요
          {coverage ? ` · 근처 ${coverage.nearby}곳` : ""}
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((filter) => {
            const active = type === filter.id;
            return (
              <button
                key={filter.id || "all"}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (filter.id) next.set("type", filter.id);
                  else next.delete("type");
                  setParams(next, { replace: true });
                }}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
                  active ? "bg-brand text-ink" : "bg-surface text-ink"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
      <div ref={mapEl} className="min-h-[180px] flex-1 bg-surface" />
      <section className={`sheet ${selected ? "sheet-open" : "sheet-peek"}`}>
        <div className="sheet-handle" />
        {selected ? (
          <div className="overflow-y-auto px-4 pb-4">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-2 text-sm font-extrabold"
            >
              목록으로
            </button>
            <BinDetail bin={selected} />
          </div>
        ) : list.length === 0 ? (
          <div className="px-4 pb-4">
            <p className="text-sm font-extrabold">이 지역 데이터가 아직 적어요</p>
            <p className="mt-1 text-sm leading-6 text-mute">
              반경을 넓히거나, 폐의약품은 가까운 약국 수거함을 이용해 보세요.
            </p>
          </div>
        ) : (
          <ul className="overflow-y-auto px-4 pb-3">
            {list.map((bin) => (
              <li key={bin.id} className="border-b border-black/5 last:border-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(bin);
                    mapRef.current?.setView([bin.lat, bin.lng], 16);
                  }}
                  className="flex w-full items-start justify-between gap-3 py-3 text-left"
                >
                  <span>
                    <span className="text-[11px] font-bold text-mute">
                      {BIN_LABELS[bin.type] ?? bin.type}
                      {bin.source ? ` · ${sourceLabel(bin)}` : ""}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold">{bin.name}</span>
                  </span>
                  {bin.distance_m != null ? (
                    <span className="shrink-0 text-xs text-mute">
                      {formatDistance(bin.distance_m)}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function sourceLabel(bin: Bin): string {
  if (bin.source && BIN_SOURCE_LABELS[bin.source]) {
    return BIN_SOURCE_LABELS[bin.source];
  }
  return "참고 위치";
}

function BinDetail({ bin }: { bin: Bin }) {
  const maps = `https://map.kakao.com/link/to/${encodeURIComponent(bin.name)},${bin.lat},${bin.lng}`;
  return (
    <div>
      <p className="text-[11px] font-bold text-mute">
        {BIN_LABELS[bin.type] ?? bin.type}
      </p>
      <h2 className="mt-0.5 text-lg font-extrabold">{bin.name}</h2>
      <p className="mt-1 text-xs font-semibold text-mute">{sourceLabel(bin)}</p>
      {bin.address ? <p className="mt-2 text-sm text-mute">{bin.address}</p> : null}
      {bin.hours ? <p className="mt-1 text-sm text-mute">{bin.hours}</p> : null}
      {bin.phone ? <p className="mt-1 text-sm text-mute">{bin.phone}</p> : null}
      {bin.distance_m != null ? (
        <p className="mt-2 text-sm font-extrabold">{formatDistance(bin.distance_m)}</p>
      ) : null}
      <a href={maps} target="_blank" rel="noreferrer" className="btn-dark mt-4">
        길찾기
      </a>
    </div>
  );
}
