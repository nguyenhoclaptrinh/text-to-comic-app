---
id: DEL-001
type: delivery
status: draft
created: 2026-05-17
updated: 2026-05-17
---

# Demo Runbook: Text-to-Comic App

## Demo Goal

Show an end-to-end AI-assisted comic creation workflow with a Vietnamese,
demo-first workspace:

```text
Dự án -> Nhập truyện -> Storyboard -> Vẽ ảnh -> Chỉnh truyện -> Xuất file
```

## Pre-Demo Checklist

- Run `npm install`.
- Copy `.env.example` to `.env.local` if Gemini or an image backend will be used live.
- Run `npm run dev`.
- Open `http://localhost:3000`.
- Keep one browser tab ready with the app loaded.
- Prepare a short story paragraph of 300-1,000 words.
- Run quality gates before final submission:

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

## Demo Script

1. Start from `Dự án` and show the existing draft.
2. Open `Nhập truyện`, paste a short story, and create a storyboard.
3. In `Storyboard`, edit one `Mô tả cảnh` and one `Lời thoại`.
4. Open `Nhân vật` and adjust a name/role/visual description.
5. Use `Vẽ ảnh` for one panel, then `Vẽ tất cả`.
6. Open `Chỉnh truyện` and add or drag a speech bubble.
7. Reload the page to show local persistence and generation recovery.
8. Open `Xuất file`, download PNG, and explain the missing-image warning if shown.

## Acceptance Evidence

| Requirement                   | Current Evidence                                                         |
| ----------------------------- | ------------------------------------------------------------------------ |
| Create project from text      | Text Import creates a new project and panels                             |
| Storyboard editing            | Panel prompt/dialogue fields are editable                                |
| Character consistency support | Character casting data is editable and persisted                         |
| Generate/regenerate panel     | Per-panel `Vẽ ảnh` / `Vẽ lại` and `Vẽ tất cả` update panel status        |
| Bubble editing                | Bubble text, add/delete, and drag are available                          |
| Reload safety                 | Studio snapshot persists in localStorage                                 |
| Export PNG                    | Export modal renders vertical PNG through canvas                         |
| Error handling                | Typed AI errors, missing-image warnings, interrupted generation recovery |

## Current Limitations

- Gemini requires `GEMINI_API_KEY`; without it the storyboard API intentionally falls back to deterministic demo data.
- Real image generation requires `IMAGE_BACKEND_URL`; without it the image API intentionally falls back to cached SVG panel artwork.
- Supabase Auth/DB/Storage is documented as target architecture but not implemented in the prototype.
- PNG export is the primary demo path and supports generated/cached panel images plus bubble overlays.
- Panel statuses are shown in Vietnamese: `Chưa vẽ`, `Đang chờ`, `Đang vẽ`, `Đã vẽ`, `Cần thử lại`.
- Reference image upload is shown as a future control.

## Next Integration Tasks

1. Add a real `GEMINI_API_KEY` and smoke test live storyboard JSON.
2. Add real image generation provider and storage upload.
3. Replace localStorage repository with Supabase repository after schema setup.
4. Add Playwright E2E test for the demo happy path.

For the full remaining roadmap, see `docs/040-implementation/FinalProjectCompletionPlan.md`.
