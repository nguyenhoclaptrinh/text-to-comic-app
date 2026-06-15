/**
 * @file mock-data.ts
 * @description Mock project, character, and panel data for the frontend-only prototype.
 */

import type { Character, Page, Panel, Project } from "@/lib/studio/types";

export const SAMPLE_STORY =
  "Outside the inn, snow covered the mountain road. A young man in a white fur coat sat by the window, counting the empty tables. Suddenly, the wooden door flew open and a red-robed teenager rushed inside with a bright grin.";

export const CHARACTERS_SEED: Character[] = [
  {
    id: "xiao-se",
    name: "Xiao Se",
    role: "Main protagonist",
    description: "Young man in a white fur coat with a calm, tired expression.",
    color: "#8b5cf6",
  },
  {
    id: "lei-wujie",
    name: "Lei Wujie",
    role: "Sidekick",
    description: "Energetic teenager in a bright red robe.",
    color: "#ef4444",
  },
];

export const PANELS_SEED: Panel[] = [
  {
    id: "panel-1",
    orderIndex: 1,
    scenePrompt:
      "A lonely roadside inn during heavy snow. Xiao Se sits near the window in a white fur coat.",
    dialogue: "Xiao Se: Weather like this will not bring many guests.",
    characterIds: ["xiao-se"],
    status: "success",
    imageTone: "from-slate-900 via-zinc-800 to-indigo-950",
    bubbles: [
      {
        id: "bubble-1",
        text: "Xiao Se: Weather like this will not bring many guests.",
        x: 5, // %
        y: 8, // %
        width: 28, // %
        height: 18, // %
      },
    ],
    seed: 42,
    style: "inherit",
  },
  {
    id: "panel-2",
    orderIndex: 2,
    scenePrompt:
      "The wooden door bursts open. Lei Wujie enters in a bright red robe, covered in snow.",
    dialogue: "Lei Wujie: One hot bowl of noodles, please!",
    characterIds: ["lei-wujie"],
    status: "draft",
    imageTone: "from-red-950 via-zinc-800 to-amber-950",
    bubbles: [],
    seed: 43,
    style: "inherit",
  },
  {
    id: "panel-3",
    orderIndex: 3,
    scenePrompt:
      "Xiao Se frowns at the broken door while snow blows into the quiet inn.",
    dialogue: "Xiao Se: You broke the door before ordering.",
    characterIds: ["xiao-se", "lei-wujie"],
    status: "error",
    imageTone: "from-zinc-900 via-stone-800 to-slate-900",
    errorMessage:
      "Dịch vụ vẽ ảnh chưa sẵn sàng. Bạn có thể thử vẽ lại khung này sau.",
    bubbles: [],
    seed: 44,
    style: "inherit",
  },
];

export const PROJECTS_SEED: Project[] = [
  {
    id: "project-1",
    title: "Thieu Nien Ca Hanh - Chapter 1",
    status: "storyboard",
    updatedAt: "Today",
    panelCount: 3,
    style: "webtoon",
  },
  {
    id: "project-2",
    title: "Cyber Alley Short",
    status: "error",
    updatedAt: "Yesterday",
    panelCount: 5,
    style: "webtoon",
  },
];

export const PAGES_SEED: Page[] = [
  {
    id: "page-project-1-default",
    projectId: "project-1",
    orderIndex: 1,
    title: "Page 1",
    panels: PANELS_SEED,
  },
];
