/**
 * @file integration-flow.test.ts
 * @description Integration test for the entire storyboard and image generation flow using real Gemini API.
 */

import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { generateMultiPageStoryboard } from "@/lib/server/gemini-storyboard";
import { generatePanelImageFromProvider } from "@/lib/server/image-generation";

// Manual helper to load .env in case Vitest doesn't auto-load it
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const lines = envContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("GEMINI_API_KEY=")) {
          process.env.GEMINI_API_KEY = trimmed.replace("GEMINI_API_KEY=", "").trim();
        }
        if (trimmed.startsWith("GEMINI_MODEL=")) {
          process.env.GEMINI_MODEL = trimmed.replace("GEMINI_MODEL=", "").trim();
        }
      }
    }
  } catch (err) {
    console.error("Error loading .env file:", err);
  }
}

describe("Integration Flow Test with Real Gemini", () => {
  it("should run the entire storyboard generation and image generation flow and log results", async () => {
    loadEnv();

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key Configured:", !!apiKey);
    console.log("Using Model:", process.env.GEMINI_MODEL || "gemini-2.5-flash");

    // Skip if API Key is not configured (e.g. in environments without secrets)
    if (!apiKey) {
      console.warn("Skipping integration test: GEMINI_API_KEY is not configured.");
      return;
    }

    const input = {
      storyTitle: "The Silent Mountain",
      storyText: 
        "The wind howled through the pine trees. Suddenly, the camera pans to a beautiful wooden cabin half-buried in snow, no one is around, only the soft sound of snow falling. Inside the cabin, a flame danced in the stone fireplace.",
    };

    console.log("Step 1: Generating storyboard pages via Gemini...");
    const projectId = `test-project-${Date.now()}`;
    const storyboardResult = await generateMultiPageStoryboard(input, projectId);

    expect(storyboardResult.source).toBe("gemini");
    expect(storyboardResult.pages.length).toBeGreaterThanOrEqual(1);

    const allPanels = storyboardResult.pages.flatMap((page) => page.panels);
    console.log(`Generated ${allPanels.length} panels in total.`);

    // Check if any panel has empty dialogue (to verify our schema fix)
    const emptyDialoguePanels = allPanels.filter((p) => p.dialogue === "");
    console.log(`Found ${emptyDialoguePanels.length} panels with empty dialogue.`);

    console.log("Step 2: Generating panel images...");
    const generationResults: Array<{
      panelId: string;
      scenePrompt: string;
      dialogue: string;
      imageUrl: string;
      source: string;
      bubblesCount: number;
    }> = [];

    for (const panel of allPanels) {
      console.log(`Generating image for Panel ${panel.orderIndex}...`);
      const imageResult = await generatePanelImageFromProvider({
        panel,
        characters: [],
      });

      expect(imageResult.imageUrl).toBeDefined();
      expect(imageResult.imageUrl.length).toBeGreaterThan(0);
      expect(["image-backend", "fallback"]).toContain(imageResult.source);

      generationResults.push({
        panelId: panel.id,
        scenePrompt: panel.scenePrompt,
        dialogue: panel.dialogue,
        imageUrl: imageResult.imageUrl,
        source: imageResult.source,
        bubblesCount: panel.dialogue.trim() ? 1 : 0, // bubbles are managed client-side
      });
    }

    // Write logs and results to a folder in the project
    const logDir = path.resolve(process.cwd(), "logs", "integration-test");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const testOutput = {
      timestamp: new Date().toISOString(),
      input,
      storyboard: storyboardResult,
      panelGeneration: generationResults,
    };

    const outputFilePath = path.join(logDir, "flow-test-results.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(testOutput, null, 2), "utf-8");
    console.log(`Successfully logged flow results and output to: ${outputFilePath}`);

    // Assert that the log file was created and is not empty
    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(fs.statSync(outputFilePath).size).toBeGreaterThan(0);
  }, 30000); // 30s timeout for API calls
});
