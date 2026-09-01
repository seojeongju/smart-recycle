import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api, formatDistance } from "../api";
import { BIN_LABELS, SEOUL_HALL, type Bin } from "../types";

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
    const query = new URLSearchParams({
      lat: String(origin.lat),
      lng: String(origin.lng),
      radius_m: "3000",
    });
    if (type) query.set("type", type);
    void api<{ bins: Bin[] }>(`/api/bins?${query}`).then((data) => {
      setBins(data.bins);
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

  const list = useMemo(() => bins.slice(0, 8), [bins]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-4">
        <h1 className="text-[26px] font-extrabold tracking-tight">수거함</h1>
        {denied ? (
          <p className="mt-1 text-xs text-mute">
            위치 권한이 없어 서울시청 기준으로 보여요.
          </p>
        ) : (
          <p className="mt-1 text-xs text-mute">내 위치 기준 3km 안의 수거함</p>
        )}
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
      <div ref={mapEl} className="min-h-[240px] flex-1 bg-surface" />
      <div className="max-h-52 overflow-y-auto bg-white px-4 py-3">
        {selected ? (
          <div>
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
          <p className="text-sm text-mute">이 범위에는 아직 데이터가 적어요.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((bin) => (
              <li key={bin.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(bin);
                    mapRef.current?.setView([bin.lat, bin.lng], 16);
                  }}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <span>
                    <span className="text-[11px] font-bold text-mute">
                      {BIN_LABELS[bin.type] ?? bin.type}
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
      </div>
    </div>
  );
}

function BinDetail({ bin }: { bin: Bin }) {
  const maps = `https://map.kakao.com/link/to/${encodeURIComponent(bin.name)},${bin.lat},${bin.lng}`;
  return (
    <div>
      <p className="text-[11px] font-bold text-mute">
        {BIN_LABELS[bin.type] ?? bin.type}
      </p>
      <h2 className="mt-0.5 font-bold">{bin.name}</h2>
      {bin.address ? <p className="mt-1 text-sm text-mute">{bin.address}</p> : null}
      {bin.hours ? <p className="mt-1 text-sm text-mute">{bin.hours}</p> : null}
      {bin.phone ? <p className="mt-1 text-sm text-mute">{bin.phone}</p> : null}
      {bin.distance_m != null ? (
        <p className="mt-1 text-sm font-extrabold">
          {formatDistance(bin.distance_m)}
        </p>
      ) : null}
      <a
        href={maps}
        target="_blank"
        rel="noreferrer"
        className="btn-dark mt-3"
      >
        길찾기
      </a>
    </div>
  );
}
