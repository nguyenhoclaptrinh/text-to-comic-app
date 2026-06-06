/**
 * @file comic-studio.spec.ts
 * @description End-to-end happy path for the final project demo.
 */

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("creates, generates, edits, and exports a comic", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Dự án" }).click();

  const newProjectButton = page.getByRole("button", { name: /Tạo dự án/ });
  await newProjectButton.first().click();

  await page.getByLabel("Tiêu đề truyện tranh").fill("E2E Snow Road");
  await page
    .getByLabel("Nội dung câu chuyện chữ gốc")
    .fill(
      "Snow covered the mountain road while a quiet inn waited for guests. A young innkeeper watched the door. A cheerful traveler entered with a loud request for noodles.",
    );
  await page.getByRole("button", { name: "Tạo storyboard" }).click();

  await expect(
    page.getByRole("heading", { name: "Dựng storyboard" }),
  ).toBeVisible();

  await page
    .getByLabel("Mô tả cảnh cho khung 1")
    .fill("A snowy roadside inn with warm lanterns and a quiet innkeeper.");
  await page
    .getByLabel("Lời thoại cho khung 1")
    .fill("Innkeeper: Another storm, another empty room.");

  await page
    .getByRole("button", { name: "Vẽ ảnh", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Vẽ lại", exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Chỉnh lời thoại trên ảnh" }).click();
  await page.getByRole("button", { name: "Thêm Bong bóng thoại" }).click();
  await page.getByLabel("Nội dung hội thoại").fill("A guest at last!");

  await page
    .locator("header")
    .getByRole("button", { name: "Xuất file" })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải file" }).click();
  const download = await downloadPromise;
  const downloadPath = `./downloads/${download.suggestedFilename()}`;
  await download.saveAs(downloadPath);
  expect(download.suggestedFilename()).toContain("e2e-snow-road");
});

test("keeps the storyboard workflow usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Dự án" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dựng storyboard" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Nhân vật" })).toBeVisible();
  await expect(page.getByLabel("Mô tả cảnh cho khung 1")).toBeVisible();
});
