/**
 * @file comic-studio.spec.ts
 * @description End-to-end happy path for the final project demo.
 */

import { expect, test } from "@playwright/test";

test("creates, generates, edits, and exports a comic", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Projects" }).click();

  const newProjectButton = page.getByRole("button", { name: /Tạo dự án/ });
  await newProjectButton.first().click();

  await page.getByLabel("Tiêu đề truyện tranh").fill("E2E Snow Road");
  await page
    .getByLabel("Nội dung câu chuyện chữ gốc")
    .fill(
      "Snow covered the mountain road while a quiet inn waited for guests. A young innkeeper watched the door. A cheerful traveler entered with a loud request for noodles.",
    );
  await page.getByRole("button", { name: "Bắt đầu Phân tích" }).click();

  await expect(
    page.getByRole("heading", { name: "Biên soạn Storyboard" }),
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

  await page
    .getByRole("button", { name: "Mở Trình biên tập Bong bóng" })
    .click();
  await page.getByRole("button", { name: "Thêm Bong bóng thoại" }).click();
  await page.getByLabel("Nội dung hội thoại").fill("A guest at last!");

  await page.getByRole("button", { name: "Xuất truyện" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất bản & Tải về" }).click();
  const download = await downloadPromise;
  const downloadPath = `./downloads/${download.suggestedFilename()}`;
  await download.saveAs(downloadPath);
  expect(download.suggestedFilename()).toContain("e2e-snow-road");
});
