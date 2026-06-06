/**
 * @file snapshot-schema.ts
 * @description Zod schema for persisted local-first studio snapshots.
 */

import { z } from "zod";

import {
  CharacterSchema,
  PageSchema,
  PanelSchema,
} from "@/lib/studio/api-contracts";
import { STUDIO_SNAPSHOT_VERSION } from "@/lib/studio/constants";

const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["draft", "storyboard", "generating", "done", "error"]),
  updatedAt: z.string().min(1),
  panelCount: z.number().int().nonnegative(),
  style: z.string().optional(),
});

export const StudioSnapshotSchema = z.object({
  version: z.number().int().positive().max(STUDIO_SNAPSHOT_VERSION),
  savedAt: z.string().optional(),
  projects: z.array(ProjectSchema).min(1),
  activeProjectId: z.string().min(1),
  activePageId: z.string().min(1),
  characters: z.array(CharacterSchema),
  pages: z.array(PageSchema).min(1),
  panels: z.array(PanelSchema).optional(),
  storyTitle: z.string(),
  storyText: z.string(),
  selectedPanelId: z.string(),
  selectedBubbleId: z.string(),
});
