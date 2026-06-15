/**
 * @file comic-studio.spec.ts
 * @description End-to-end happy path for the final project demo.
 */

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("about:blank");
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("creates, generates, edits, and exports a comic", async ({ page }) => {
  await page.goto("/");

  const newProjectButton = page.getByRole("button", { name: /Tạo dự án/ });
  await newProjectButton.first().click();

  await page.getByLabel("Tiêu đề truyện tranh").fill("E2E Snow Road");
  await page
    .getByLabel("Nội dung câu chuyện chữ gốc")
    .fill(
      "Snow covered the mountain road while a quiet inn waited for guests. A young innkeeper watched the door. A cheerful traveler entered with a loud request for noodles.",
    );
  await page
    .getByRole("button", { name: "Tạo storyboard", exact: true })
    .click();

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
  await page.getByRole("button", { name: "Lưu file" }).click();
  const download = await downloadPromise;
  const downloadPath = `./downloads/${download.suggestedFilename()}`;
  await download.saveAs(downloadPath);
  expect(download.suggestedFilename()).toContain("e2e-snow-road");
});

test("keeps the storyboard workflow usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Dự án", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Tạo dự án/ })
    .first()
    .click();
  await page.getByLabel("Tiêu đề truyện tranh").fill("Mobile Demo");
  await page
    .getByLabel("Nội dung câu chuyện chữ gốc")
    .fill(
      "A student presents a clean comic pipeline. The classroom watches as each storyboard panel appears. The final page is ready for seminar.",
    );
  await page
    .getByRole("button", { name: "Tạo storyboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dựng storyboard" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Nhân vật" })).toBeVisible();
  await expect(page.getByLabel("Mô tả cảnh cho khung 1")).toBeVisible();
});

test("restores a local-first backup from settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cấu hình dịch vụ AI" }).click();

  const backup = {
    app: "text-to-comic",
    exportedAt: "2026-06-07T00:00:00.000Z",
    snapshot: {
      version: 1,
      savedAt: "2026-06-07T00:00:00.000Z",
      projects: [
        {
          id: "backup-project",
          title: "Backup Demo Story",
          status: "storyboard",
          updatedAt: "Backup",
          panelCount: 1,
          style: "webtoon",
        },
      ],
      activeProjectId: "backup-project",
      activePageId: "backup-page",
      characters: [
        {
          id: "backup-hero",
          name: "Backup Hero",
          role: "Nhân vật chính",
          description: "Một nhân vật dùng để kiểm tra khôi phục dữ liệu.",
          color: "#8b5cf6",
        },
      ],
      pages: [
        {
          id: "backup-page",
          projectId: "backup-project",
          orderIndex: 1,
          title: "Page 1",
          panels: [
            {
              id: "backup-panel",
              orderIndex: 1,
              scenePrompt: "A restored panel from a local backup file.",
              dialogue: "Backup Hero: I am back.",
              characterIds: ["backup-hero"],
              status: "draft",
              imageTone: "from-zinc-900 via-stone-800 to-slate-900",
              bubbles: [],
              seed: 123,
              style: "inherit",
            },
          ],
        },
      ],
      storyTitle: "Backup Demo Story",
      storyText: "A short story restored from backup.",
      selectedPanelId: "backup-panel",
      selectedBubbleId: "",
    },
  };

  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByText("Đã khôi phục backup")).toBeVisible();
  await expect(page.getByText("Backup Demo Story").first()).toBeVisible();
});
