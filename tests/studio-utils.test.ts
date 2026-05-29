/**
 * @file studio-utils.test.ts
 * @description Unit tests for pure studio utility functions.
 */

import { describe, expect, it } from "vitest";

import {
  BUBBLE_BOUNDARY_PADDING,
  BUBBLE_TEXT_MAX_LENGTH,
} from "@/lib/studio/constants";
import { PANELS_SEED } from "@/lib/studio/mock-data";
import {
  clamp,
  createMockPanels,
  dialogueToBubble,
  nextBubbleCoordinate,
  updateCharacterProfile,
  updatePanelBubble,
} from "@/lib/studio/utils";

describe("studio utils", () => {
  it("should clamp values within a numeric boundary", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(50, 0, 10)).toBe(10);
  });

  it("should extract dialogue text after the speaker delimiter", () => {
    expect(
      dialogueToBubble("Xiao Se: Weather like this will not bring guests."),
    ).toBe("Weather like this will not bring guests.");
  });

  it("should preserve speakerless dialogue and enforce bubble length limit", () => {
    const longDialogue = "A".repeat(BUBBLE_TEXT_MAX_LENGTH + 10);

    expect(dialogueToBubble(longDialogue)).toHaveLength(BUBBLE_TEXT_MAX_LENGTH);
  });

  it("should create three draft panels from story text with deterministic ids", () => {
    const panels = createMockPanels("A cold road leads to a quiet inn.");

    expect(panels).toHaveLength(3);
    panels.forEach((panel) => {
      expect(panel.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
    expect(panels.every((panel) => panel.status === "draft")).toBe(true);
    expect(panels[0].scenePrompt).toContain("A cold road");
  });

  it("should keep moved bubbles inside the visible panel boundary", () => {
    expect(nextBubbleCoordinate(-100, 0, 0, 320, 35)).toBe(
      BUBBLE_BOUNDARY_PADDING,
    );
    expect(nextBubbleCoordinate(1000, 0, 0, 320, 35)).toBe(63); // 100% - 35% - 2%
  });

  it("should update only the requested bubble on the requested panel", () => {
    const panel = PANELS_SEED[0];
    const updated = updatePanelBubble(panel, panel.id, "bubble-1", {
      text: "Updated bubble",
      x: 64,
    });

    expect(updated).not.toBe(panel);
    expect(updated.bubbles[0]).toMatchObject({
      text: "Updated bubble",
      x: 64,
    });
    expect(updatePanelBubble(panel, "other-panel", "bubble-1", {})).toBe(panel);
  });

  it("should update only the requested character profile", () => {
    const character = {
      id: "character-1",
      name: "Old Name",
      role: "Hero",
      description: "Old description",
      color: "#ffffff",
    };

    expect(
      updateCharacterProfile(character, "character-1", {
        name: "New Name",
      }),
    ).toMatchObject({ name: "New Name" });
    expect(updateCharacterProfile(character, "other", { name: "Other" })).toBe(
      character,
    );
  });
});
