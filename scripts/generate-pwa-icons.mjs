import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const sprout =
  "M32 14c.8 6 2.4 10.5 8 14-6.5 1.2-10 4.8-12 12-2-7.2-5.5-10.8-12-12 5.6-3.5 7.2-8 8-14 2.4 5 4.8 5 8 0z";

function anySvg(size) {
  const radius = Math.round(size * 0.25);
  const scale = size / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#7BE04A"/>
  <g transform="scale(${scale})">
    <path d="${sprout}" fill="#111111"/>
  </g>
</svg>`;
}

function maskableSvg(size) {
  const inner = size * 0.7;
  const scale = inner / 64;
  const offset = (size - inner) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#7BE04A"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${sprout}" fill="#111111"/>
  </g>
</svg>`;
}

function render(svg, dest) {
  const png = new Resvg(svg, {
    fitTo: { mode: "original" },
  })
    .render()
    .asPng();
  writeFileSync(dest, png);
  console.log("wrote", dest);
}

render(anySvg(192), join(outDir, "icon-192.png"));
render(anySvg(512), join(outDir, "icon-512.png"));
render(maskableSvg(192), join(outDir, "icon-192-maskable.png"));
render(maskableSvg(512), join(outDir, "icon-512-maskable.png"));
render(anySvg(180), join(root, "public", "apple-touch-icon.png"));
