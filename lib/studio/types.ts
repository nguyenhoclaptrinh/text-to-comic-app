/**
 * @file types.ts
 * @description Shared TypeScript models for the comic studio prototype.
 */

export type View = "dashboard" | "import" | "storyboard" | "comic";

export type ProjectStatus =
  | "draft"
  | "storyboard"
  | "generating"
  | "done"
  | "error";

export type PanelStatus = "draft" | "generating" | "success" | "error";

export type Character = {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
};

export type Bubble = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Page = {
  id: string;
  projectId: string;
  orderIndex: number;
  title: string;
  panels: Panel[];
};

export type Panel = {
  id: string;
  orderIndex: number;
  scenePrompt: string;
  dialogue: string;
  characterIds: string[];
  status: PanelStatus;
  imageTone: string;
  imageUrl?: string;
  errorMessage?: string;
  bubbles: Bubble[];
  seed: number;
  style?: "inherit" | "manga" | "webtoon" | "western";
};

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: string;
  panelCount: number;
  style?: string;
};

export type DragState = {
  panelId: string;
  bubbleId: string;
  offsetX: number;
  offsetY: number;
  bubbleWidth: number;
  bubbleHeight: number;
};

export type GenerationSummary = {
  done: number;
  errors: number;
  total: number;
};

export type StudioSnapshot = {
  version: number;
  projects: Project[];
  activeProjectId: string;
  activePageId: string;
  characters: Character[];
  pages: Page[];
  panels?: Panel[]; // Tương thích ngược với định dạng cũ
  storyTitle: string;
  storyText: string;
  selectedPanelId: string;
  selectedBubbleId: string;
};
