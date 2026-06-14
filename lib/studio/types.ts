/**
 * @file types.ts
 * @description Shared TypeScript models for the comic studio prototype.
 */

export type View = "projects" | "import" | "storyboard" | "comic" | "export";

export type ProjectStatus =
  | "draft"
  | "storyboard"
  | "generating"
  | "done"
  | "error";

export type PanelStatus =
  | "draft"
  | "queued"
  | "generating"
  | "success"
  | "error";

export type AiProvider =
  | "gemini"
  | "imagen"
  | "huggingface"
  | "kaggle"
  | "image-backend"
  | "fallback";

export type Character = {
  id: string;
  projectId?: string;
  name: string;
  role: string;
  /** Giới tính: Nam, Nữ, Khác */
  gender?: "Nam" | "Nữ" | "Khác";
  description: string;
  color: string;
  // optional priority for ordering / importance (lower = higher priority)
  priority?: number;
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
  usedModel?: string;
  usedProvider?: AiProvider;
};

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: string;
  panelCount: number;
  style?: string;
  genre?: string;
  aspectRatio?: string;
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
  savedAt?: string;
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
