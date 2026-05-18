/**
 * @file export-renderer.ts
 * @description Browser canvas renderer for vertical PNG comic export.
 */

import {
  createComicExportPlan,
  EXPORT_CANVAS_PADDING,
  EXPORT_PANEL_GAP,
  EXPORT_PANEL_HEIGHT,
  EXPORT_PANEL_WIDTH,
} from "@/lib/studio/export-plan";
import type { Bubble, Panel } from "@/lib/studio/types";

const EXPORT_REFERENCE_STAGE_WIDTH = 640;
const EXPORT_REFERENCE_STAGE_HEIGHT = 320;

export async function exportComicPng({
  projectTitle,
  panels,
  includeMissingPanels,
}: {
  projectTitle: string;
  panels: Panel[];
  includeMissingPanels?: boolean;
}) {
  const plan = createComicExportPlan({
    projectTitle,
    panels,
    includeMissingPanels,
  });
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);
  const canvas = document.createElement("canvas");
  canvas.width = plan.width * pixelRatio;
  canvas.height = plan.height * pixelRatio;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas export is not available in this browser.");
  }

  context.scale(pixelRatio, pixelRatio);
  context.fillStyle = "#09090b";
  context.fillRect(0, 0, plan.width, plan.height);

  for (const [index, panel] of plan.panels.entries()) {
    await drawPanel(
      context,
      panel,
      EXPORT_CANVAS_PADDING,
      EXPORT_CANVAS_PADDING + index * (EXPORT_PANEL_HEIGHT + EXPORT_PANEL_GAP),
    );
  }

  downloadCanvas(canvas, plan.filename);

  return {
    filename: plan.filename,
    panelCount: plan.panels.length,
    missingImages: plan.missingImages,
  };
}

async function drawPanel(
  context: CanvasRenderingContext2D,
  panel: Panel,
  x: number,
  y: number,
) {
  const imageDrawn = await drawPanelImage(context, panel, x, y);
  if (!imageDrawn) {
    drawPanelBackground(context, panel, x, y);
    drawPanelFigures(context, x, y);
  }
  drawPanelLabel(context, panel, x, y);
  drawPanelMissingState(context, panel, x, y);
  panel.bubbles.forEach((bubble) => drawBubble(context, panel, bubble, x, y));
}

async function drawPanelImage(
  context: CanvasRenderingContext2D,
  panel: Panel,
  x: number,
  y: number,
) {
  if (!panel.imageUrl) {
    return false;
  }

  try {
    const image = await loadImage(panel.imageUrl);
    context.drawImage(image, x, y, EXPORT_PANEL_WIDTH, EXPORT_PANEL_HEIGHT);
    return true;
  } catch {
    return false;
  }
}

function drawPanelBackground(
  context: CanvasRenderingContext2D,
  panel: Panel,
  x: number,
  y: number,
) {
  const [start, middle, end] = getPanelPalette(panel);
  const gradient = context.createLinearGradient(
    x,
    y,
    x + EXPORT_PANEL_WIDTH,
    y + EXPORT_PANEL_HEIGHT,
  );
  gradient.addColorStop(0, start);
  gradient.addColorStop(0.55, middle);
  gradient.addColorStop(1, end);
  context.fillStyle = gradient;
  context.fillRect(x, y, EXPORT_PANEL_WIDTH, EXPORT_PANEL_HEIGHT);
  context.strokeStyle = "#3f3f46";
  context.lineWidth = 2;
  context.strokeRect(x, y, EXPORT_PANEL_WIDTH, EXPORT_PANEL_HEIGHT);
}

function drawPanelFigures(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  context.fillStyle = "rgba(255,255,255,0.13)";
  context.beginPath();
  context.ellipse(x + 210, y + 250, 95, 170, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(248,113,113,0.20)";
  context.beginPath();
  context.ellipse(x + 660, y + 248, 110, 180, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(0,0,0,0.28)";
  context.fillRect(x, y + EXPORT_PANEL_HEIGHT - 128, EXPORT_PANEL_WIDTH, 128);
}

function drawPanelLabel(
  context: CanvasRenderingContext2D,
  panel: Panel,
  x: number,
  y: number,
) {
  context.fillStyle = "rgba(255,255,255,0.12)";
  context.fillRect(x + 24, y + 24, 120, 34);
  context.fillStyle = "rgba(255,255,255,0.78)";
  context.font = "600 18px Arial";
  context.fillText(`Panel ${panel.orderIndex}`, x + 40, y + 47);
}

function drawPanelMissingState(
  context: CanvasRenderingContext2D,
  panel: Panel,
  x: number,
  y: number,
) {
  if (panel.status === "success") {
    return;
  }

  context.fillStyle = "rgba(0,0,0,0.55)";
  context.fillRect(x, y, EXPORT_PANEL_WIDTH, EXPORT_PANEL_HEIGHT);
  context.fillStyle = "#f4f4f5";
  context.font = "700 28px Arial";
  context.textAlign = "center";
  context.fillText(
    "Panel image missing",
    x + EXPORT_PANEL_WIDTH / 2,
    y + EXPORT_PANEL_HEIGHT / 2,
  );
  context.textAlign = "start";
}

function drawBubble(
  context: CanvasRenderingContext2D,
  panel: Panel,
  bubble: Bubble,
  panelX: number,
  panelY: number,
) {
  const bounds = getBubbleCoordinateBounds(panel);
  const scaleX = EXPORT_PANEL_WIDTH / bounds.width;
  const scaleY = EXPORT_PANEL_HEIGHT / bounds.height;
  const x = panelX + bubble.x * scaleX;
  const y = panelY + bubble.y * scaleY;
  const width = bubble.width * scaleX;
  const height = Math.max(bubble.height * scaleY, 76);

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#09090b";
  context.lineWidth = 4;
  context.beginPath();
  context.roundRect(x, y, width, height, 28);
  context.fill();
  context.stroke();

  context.fillStyle = "#09090b";
  context.font = "700 20px Arial";
  drawWrappedText(context, bubble.text, x + 22, y + 34, width - 44, 24);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineY = y;

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
      return;
    }

    line = nextLine;
  });

  if (line) {
    context.fillText(line, x, lineY);
  }
}

function getBubbleCoordinateBounds(panel: Panel) {
  const width = Math.max(
    EXPORT_REFERENCE_STAGE_WIDTH,
    ...panel.bubbles.map((bubble) => bubble.x + bubble.width + 24),
  );
  const height = Math.max(
    EXPORT_REFERENCE_STAGE_HEIGHT,
    ...panel.bubbles.map((bubble) => bubble.y + bubble.height + 24),
  );

  return { width, height };
}

function getPanelPalette(panel: Panel) {
  if (panel.imageTone.includes("red")) {
    return ["#450a0a", "#27272a", "#78350f"] as const;
  }

  if (panel.imageTone.includes("stone")) {
    return ["#18181b", "#44403c", "#0f172a"] as const;
  }

  return ["#0f172a", "#27272a", "#312e81"] as const;
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
