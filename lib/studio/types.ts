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

export type Panel = {
  id: string;
  orderIndex: number;
  scenePrompt: string;
  dialogue: string;
  characterIds: string[];
  status: PanelStatus;
  imageTone: string;
  errorMessage?: string;
  bubbles: Bubble[];
};

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: string;
  panelCount: number;
};

export type DragState = {
  panelId: string;
  bubbleId: string;
  offsetX: number;
  offsetY: number;
};

export type GenerationSummary = {
  done: number;
  errors: number;
  total: number;
};
