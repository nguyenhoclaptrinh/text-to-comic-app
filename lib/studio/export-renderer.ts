/**
 * @file export-renderer.ts
 * @description Browser canvas renderer for vertical PNG comic export.
 */

import { jsPDF } from "jspdf";
import {
  createComicExportPlan,
  EXPORT_CANVAS_PADDING,
  EXPORT_PANEL_GAP,
  EXPORT_PANEL_HEIGHT,
  EXPORT_PANEL_WIDTH,
} from "@/lib/studio/export-plan";
import type { Bubble, Panel } from "@/lib/studio/types";

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

export async function exportComicPdf({
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

  const width = EXPORT_PANEL_WIDTH + EXPORT_CANVAS_PADDING * 2;
  const height = EXPORT_PANEL_HEIGHT + EXPORT_CANVAS_PADDING * 2;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [width, height],
  });

  for (const [index, panel] of plan.panels.entries()) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (context) {
      context.fillStyle = "#09090b";
      context.fillRect(0, 0, width, height);

      await drawPanel(
        context,
        panel,
        EXPORT_CANVAS_PADDING,
        EXPORT_CANVAS_PADDING,
      );

      const dataUrl = canvas.toDataURL("image/png");

      if (index > 0) {
        pdf.addPage([width, height], "portrait");
      }

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
    }
  }

  const slug = projectTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const date = new Date().toISOString().slice(0, 10);
  pdf.save(`${slug || "comic-export"}-${date}.pdf`);

  return {
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
  // drawPanelLabel(context, panel, x, y);
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
  context.fillText(`Khung ${panel.orderIndex}`, x + 40, y + 47);
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
    "Khung này chưa có ảnh",
    x + EXPORT_PANEL_WIDTH / 2,
    y + EXPORT_PANEL_HEIGHT / 2,
  );
  context.textAlign = "start";
}

function calculateWrappedTextHeight(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lineCount++;
      line = word;
      return;
    }
    line = nextLine;
  });

  if (line) {
    lineCount++;
  }

  return lineCount * lineHeight;
}

function drawBubble(
  context: CanvasRenderingContext2D,
  panel: Panel,
  bubble: Bubble,
  panelX: number,
  panelY: number,
) {
  const x = panelX + (bubble.x / 100) * EXPORT_PANEL_WIDTH;
  const y = panelY + (bubble.y / 100) * EXPORT_PANEL_HEIGHT;
  const width = (bubble.width / 100) * EXPORT_PANEL_WIDTH;

  const uiFontSize = bubble.fontSize || 14;
  const canvasFontSize = Math.round(uiFontSize * 1.43);
  context.font = `700 ${canvasFontSize}px Arial`;

  const paddingX = Math.round(uiFontSize * 1.57);
  const paddingY = Math.round(uiFontSize * 1.71);
  const textLineHeight = Math.round(canvasFontSize * 1.2);

  const textHeight = calculateWrappedTextHeight(
    context,
    bubble.text,
    width - paddingX * 2,
    textLineHeight,
  );

  const minBubbleHeight = (bubble.height / 100) * EXPORT_PANEL_HEIGHT;
  const calculatedBubbleHeight = textHeight + paddingY * 2;
  const height = Math.max(minBubbleHeight, calculatedBubbleHeight, 76);

  // Vẽ hình chữ nhật bo góc của bong bóng thoại
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#09090b";
  context.lineWidth = 4;
  context.beginPath();
  context.roundRect(x, y, width, height, 28);
  context.fill();
  context.stroke();

  // Vẽ đuôi bong bóng thoại (tail) ở góc dưới bên trái (giống với style rounded-bl-md trên UI)
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.moveTo(x + 30, y + height);
  context.lineTo(x + 20, y + height + 16);
  context.lineTo(x + 45, y + height);
  context.closePath();
  context.fill();
  context.stroke();

  // Vẽ đè một hình chữ nhật nhỏ không viền để xóa đoạn stroke viền giữa bong bóng và đuôi
  context.fillStyle = "#ffffff";
  context.fillRect(x + 28, y + height - 3, 15, 6);

  // Vẽ text bên trong bong bóng thoại
  context.fillStyle = "#09090b";
  drawWrappedText(
    context,
    bubble.text,
    x + paddingX,
    y + paddingY + Math.round(canvasFontSize * 0.8), // Điều chỉnh baseline dòng đầu
    width - paddingX * 2,
    textLineHeight,
  );
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
