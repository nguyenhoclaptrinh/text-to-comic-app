/**
 * @file cached-images.ts
 * @description Deterministic same-origin image fallbacks for panel generation demos.
 */

import type { Panel } from "@/lib/studio/types";

const SVG_WIDTH = 900;
const SVG_HEIGHT = 520;

export function createCachedPanelImage(panel: Panel) {
  const [start, middle, end] = getPanelColors(panel);
  const title = escapeSvgText(`Khung ${panel.orderIndex}`);
  const dialogue = escapeSvgText(panel.dialogue.slice(0, 96));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${start}"/>
<stop offset="55%" stop-color="${middle}"/>
<stop offset="100%" stop-color="${end}"/>
</linearGradient>
</defs>
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="url(#bg)"/>
<rect y="392" width="${SVG_WIDTH}" height="128" fill="rgba(0,0,0,0.30)"/>
<ellipse cx="230" cy="270" rx="100" ry="178" fill="rgba(255,255,255,0.15)"/>
<ellipse cx="660" cy="268" rx="115" ry="184" fill="rgba(248,113,113,0.20)"/>
<rect x="28" y="28" width="134" height="38" rx="10" fill="rgba(255,255,255,0.14)"/>
<text x="46" y="53" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif" font-size="19" font-weight="700">${title}</text>
<text x="46" y="470" fill="rgba(255,255,255,0.72)" font-family="Arial, sans-serif" font-size="20" font-weight="600">${dialogue}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getPanelColors(panel: Panel) {
  if (panel.imageTone.includes("red")) {
    return ["#450a0a", "#27272a", "#78350f"] as const;
  }

  if (panel.imageTone.includes("stone")) {
    return ["#18181b", "#44403c", "#0f172a"] as const;
  }

  return ["#0f172a", "#27272a", "#312e81"] as const;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
