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
import { slugifyCharacterName } from "@/lib/studio/storyboard";

describe("studio utils", () => {
  it("should clamp values within a numeric boundary", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(50, 0, 10)).toBe(10);
  });

  it("should preserve dialogue text exactly for bubble seeding", () => {
    expect(
      dialogueToBubble("Xiao Se: Weather like this will not bring guests."),
    ).toBe("Xiao Se: Weather like this will not bring guests.");
  });

  it("should preserve speakerless dialogue without rewriting content", () => {
    const longDialogue = "A".repeat(BUBBLE_TEXT_MAX_LENGTH + 10);

    expect(dialogueToBubble(longDialogue)).toBe(longDialogue);
  });

  it("should create three draft panels from story text with deterministic ids", () => {
    const panels = createMockPanels("A cold road leads to a quiet inn.");

    expect(panels).toHaveLength(3);
    panels.forEach((panel) => {
      expect(panel.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
    expect(panels.every((panel) => panel.status === "draft")).toBe(true);
    expect(panels[0].scenePrompt).toContain("A cold road");
  });

  it("should cover all parsing branches of createMockPanels", () => {
    // 1. Short text (sentences.length < 3)
    const panelsShort = createMockPanels(
      "Innkeeper: Welcome to our humble place.",
    );
    expect(panelsShort).toHaveLength(3);
    expect(panelsShort[0].dialogue).toBe(
      "Innkeeper: Welcome to our humble place.",
    );

    // 2. Text with quotes and longer than bubble max length
    const longTextWithQuotes =
      'He sighed. "This is going to be a very long day, my friend, so let us make the best out of it." The wind blew.';
    const panelsQuote = createMockPanels(longTextWithQuotes);
    expect(panelsQuote).toHaveLength(3);
    expect(panelsQuote[1].dialogue).toContain("This is going to be");
    expect(panelsQuote[1].dialogue.startsWith("Speaker:")).toBe(false);
    expect(panelsQuote[1].dialogue.length).toBeLessThanOrEqual(
      BUBBLE_TEXT_MAX_LENGTH,
    );
  });

  it("should keep moved bubbles inside the visible panel boundary", () => {
    expect(nextBubbleCoordinate(-100, 0, 0, 320, 35)).toBe(
      BUBBLE_BOUNDARY_PADDING,
    );
    expect(nextBubbleCoordinate(1000, 0, 0, 320, 35)).toBe(63); // 100% - 35% - 2%
  });

  it("should update only the requested bubble on the requested panel", () => {
    const panel = {
      ...PANELS_SEED[0],
      bubbles: [
        {
          id: "bubble-1",
          text: "Bubble 1",
          x: 10,
          y: 10,
          width: 20,
          height: 20,
        },
        {
          id: "bubble-2",
          text: "Bubble 2",
          x: 20,
          y: 20,
          width: 20,
          height: 20,
        },
      ],
    };
    const updated = updatePanelBubble(panel, panel.id, "bubble-1", {
      text: "Updated bubble",
      x: 64,
    });

    expect(updated).not.toBe(panel);
    expect(updated.bubbles[0]).toMatchObject({
      text: "Updated bubble",
      x: 64,
    });
    expect(updated.bubbles[1]).toMatchObject({
      text: "Bubble 2",
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

  it("should slugify character names and return fallback for empty strings", () => {
    expect(slugifyCharacterName("  Xiao Se  ")).toBe("xiao-se");
    expect(slugifyCharacterName("Lĩnh Nhạc Công Chúa")).toBe(
      "linh-nhac-cong-chua",
    );
    expect(slugifyCharacterName("!!!")).toBe("unknown-character");
    expect(slugifyCharacterName("")).toBe("unknown-character");
  });
});
