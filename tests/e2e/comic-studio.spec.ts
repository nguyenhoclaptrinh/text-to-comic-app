/**
 * @file comic-studio.spec.ts
 * @description End-to-end happy path for the final project demo.
 */

import { expect, test } from "@playwright/test";

test("creates, generates, edits, and exports a comic", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Import" }).click();
  await page.getByLabel("Project title").fill("E2E Snow Road");
  await page
    .getByLabel("Original story text")
    .fill(
      "Snow covered the mountain road while a quiet inn waited for guests. A young innkeeper watched the door. A cheerful traveler entered with a loud request for noodles.",
    );
  await page.getByRole("button", { name: /Analyze Story/ }).click();

  await expect(
    page.getByRole("heading", { name: "Storyboard Editor" }),
  ).toBeVisible();

  await page
    .getByLabel("Scene prompt for panel 1")
    .fill("A snowy roadside inn with warm lanterns and a quiet innkeeper.");
  await page
    .getByLabel("Dialogue for panel 1")
    .fill("Innkeeper: Another storm, another empty room.");

  await page
    .getByRole("button", { name: "Generate", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Regenerate", exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Open Comic Editor" }).click();
  await page.getByRole("button", { name: "Add Bubble" }).click();
  await page.getByLabel("Text").fill("A guest at last!");

  await page.getByRole("button", { name: "Export" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toContain("e2e-snow-road");
});
