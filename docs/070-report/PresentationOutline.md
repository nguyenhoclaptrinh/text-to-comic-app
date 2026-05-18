---
id: RPT-002
type: presentation
status: draft
created: 2026-05-18
updated: 2026-05-18
---

# Presentation Outline: Text-to-Comic App

## Slide 1: Title

Text-to-Comic App  
AI-assisted comic creation workflow

## Slide 2: Problem

- Người dùng có truyện chữ nhưng không có kỹ năng vẽ.
- AI có thể hỗ trợ nhưng dễ sai format, sai hình, timeout, quota.
- Cần workflow cho phép người dùng kiểm soát kết quả.

## Slide 3: Product Vision

AI tạo bản nháp nhanh, người dùng chỉnh sửa có kiểm soát.

Core flow:

```text
Text -> Storyboard -> Generate panel -> Bubble editor -> Export PNG
```

## Slide 4: Target Users

- Tác giả truyện chữ nghiệp dư.
- Sinh viên cần demo AI sáng tạo.
- Người dùng giải trí muốn hình ảnh hóa ý tưởng.

## Slide 5: MVP Scope

- Text Import.
- Gemini-ready Storyboard API.
- Storyboard Editor.
- Character Casting.
- Panel Generate/Regenerate.
- Speech Bubble Editor.
- Vertical PNG Export.
- Local persistence and fallback.

## Slide 6: Architecture

```text
Browser
  -> Next.js UI
  -> API Routes
      -> /api/storyboard
      -> /api/generate-panel
  -> Gemini / Image backend / fallback
  -> localStorage snapshot
```

## Slide 7: AI Flow

Storyboard:

- Validate input.
- Call Gemini if `GEMINI_API_KEY` exists.
- Parse structured JSON.
- Validate with Zod.
- Fallback if invalid/offline.

Image:

- Build prompt from panel + characters.
- Call image backend if configured.
- Use cached SVG fallback if not configured.

## Slide 8: Data Flow

- `Project` stores title/status/panel count.
- `Character` stores visual consistency data.
- `Panel` stores prompt/dialogue/status/image/bubbles.
- `Bubble` stores text and coordinates.
- `StudioSnapshot` persists current workspace.

## Slide 9: Error Handling

- Empty input -> validation error.
- Gemini missing/quota/invalid JSON -> fallback storyboard.
- Image backend offline -> cached image or retryable error.
- Reload during generation -> retryable error state.
- Missing image on export -> warning.

## Slide 10: Demo

1. Import story.
2. Analyze storyboard.
3. Edit prompt/dialogue.
4. Edit character.
5. Generate panel.
6. Add bubble.
7. Export PNG.
8. Reload persistence.

## Slide 11: Quality Evidence

Commands:

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

Evidence:

- Unit tests.
- Coverage gate.
- Playwright E2E happy path.
- Build and audit pass.

## Slide 12: Limitations

- Gemini live mode needs API key.
- Real image backend needs endpoint.
- Supabase is schema-ready but not default persistence.
- Character consistency is prompt-based.
- Cached images are fallback demo assets.

## Slide 13: Future Work

- Supabase Auth/DB/Storage.
- Real image generation with ComfyUI/Stable Diffusion.
- Reference image upload.
- PDF export.
- Style presets.
- Better character consistency with IP-Adapter/ControlNet.

## Slide 14: Conclusion

The project prioritizes a reliable, controllable AI workflow over fragile full automation. The app still completes the comic export even when external AI services are unavailable.
