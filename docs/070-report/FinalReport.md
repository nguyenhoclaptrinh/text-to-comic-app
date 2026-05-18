---
id: RPT-001
type: report
status: draft
created: 2026-05-18
updated: 2026-05-18
---

# Final Report Draft: Text-to-Comic App

## 1. Project Overview

Text-to-Comic App là ứng dụng web hỗ trợ chuyển truyện chữ thành storyboard và bản truyện tranh/webtoon có thể chỉnh sửa. Sản phẩm được thiết kế theo hướng **AI-assisted creation**: AI tạo bản nháp nhanh, còn người dùng kiểm soát prompt, dialogue, nhân vật, speech bubble và kết quả xuất file.

Mục tiêu đồ án không phải thay thế họa sĩ chuyên nghiệp, mà là chứng minh một pipeline AI có tính thực tế:

```text
Text -> Storyboard JSON -> Panel generation -> Bubble editing -> PNG export
```

## 2. Problem Statement

Người viết truyện hoặc sinh viên làm demo sáng tạo thường có nội dung văn bản nhưng thiếu thời gian, kỹ năng vẽ hoặc ngân sách để tạo bản comic minh họa. Các công cụ AI có thể hỗ trợ, nhưng nếu tự động hoàn toàn thì khó kiểm soát lỗi, đặc biệt ở các điểm:

- AI trả sai JSON hoặc sai format.
- Ảnh sinh ra không đúng ý.
- Nhân vật thiếu nhất quán.
- Backend AI có thể timeout, hết quota hoặc offline.
- Người dùng vẫn cần sửa lời thoại và vị trí speech bubble.

Vì vậy, giải pháp phù hợp là workflow có **human-in-the-loop**.

## 3. Objectives

| Objective | Current Status |
| --- | --- |
| Tạo project từ truyện chữ | Done |
| Tạo storyboard dạng panel JSON | Done with Gemini-ready API and fallback |
| Sửa prompt/dialogue từng panel | Done |
| Character Casting | Done, editable |
| Generate/regenerate panel | Done with API adapter and cached fallback |
| Speech bubble editor | Done |
| Reload không mất dữ liệu | Done through localStorage snapshot |
| Export PNG dọc | Done |
| Automated tests | Done with unit and Playwright E2E |

## 4. Scope

### In Scope

- Next.js web application.
- Text import and project creation.
- Storyboard generation through API contract.
- Gemini-ready text-to-storyboard route.
- Image generation route with cached fallback.
- Storyboard editor.
- Character casting editor.
- Speech bubble editor.
- Vertical PNG export.
- Local persistence.
- Unit tests, coverage, lint, build, audit, E2E.

### Out of Scope

- Social publishing platform.
- Payment/subscription.
- Native mobile app.
- LoRA training per user.
- Full production-grade Supabase Auth/RLS deployment.
- Guaranteed commercial image quality.

## 5. Architecture

The project uses a modular monolith architecture with Next.js App Router.

```text
Browser UI
  -> Next.js Client Components
  -> API Routes
      -> /api/storyboard
      -> /api/generate-panel
  -> Studio Services
      -> Gemini storyboard provider
      -> Image backend adapter
      -> Cached fallback provider
  -> Local Persistence
      -> localStorage snapshot
```

Target production architecture can add Supabase:

```text
Next.js
  -> Supabase Auth
  -> Supabase Postgres
  -> Supabase Storage
  -> Gemini API
  -> Image backend / ComfyUI / Colab endpoint
```

## 6. Data Model

Core entities:

- `Project`: title, original text, status, panel count.
- `Character`: name, role, visual description, optional reference image.
- `Panel`: order index, scene prompt, dialogue, status, image URL, speech bubbles.
- `Bubble`: text, x/y coordinates, width, height.

The frontend currently persists a `StudioSnapshot` in localStorage. Supabase schema is prepared separately in `supabase/schema.sql`.

## 7. AI Design

### Text-to-Storyboard

The route `/api/storyboard` validates user input, calls Gemini when `GEMINI_API_KEY` is configured, and falls back to deterministic panels when Gemini is unavailable.

Controls:

- Zod request validation.
- Gemini structured JSON response.
- Zod response validation.
- Fallback storyboard if key is missing or response is invalid.

### Panel Image Generation

The route `/api/generate-panel` accepts a panel and character context. If `IMAGE_BACKEND_URL` is configured, the route can call an external image backend. If it is missing or fails, the app returns cached SVG artwork as a same-origin data URL.

Controls:

- Per-panel generation.
- Generate All runs sequentially.
- Failed/offline backend does not destroy existing panels.
- Export can still work with cached fallback images.

## 8. Error Handling

| Case | Handling |
| --- | --- |
| Empty title/text | Validation error |
| Gemini key missing | Fallback storyboard |
| Gemini invalid JSON | Fallback storyboard |
| Image backend missing | Cached panel image |
| Image backend offline | Typed error or cached fallback |
| Reload during generation | Panel becomes retryable error |
| Export missing image | Warning and partial export behavior |

## 9. Testing Strategy

Automated quality gates:

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

Current automated coverage:

- Unit tests for utility logic.
- Unit tests for factories.
- Unit tests for persistence.
- Unit tests for API contracts and fallback storyboard.
- Unit tests for AI service adapters.
- Unit tests for export planning.
- Playwright E2E for demo happy path.

## 10. Demo Script

1. Open the app.
2. Go to Import.
3. Enter title and story text.
4. Analyze story.
5. Edit a panel prompt and dialogue.
6. Edit a character description.
7. Generate one panel or Generate All.
8. Open Comic Editor.
9. Add/edit a speech bubble.
10. Export PNG.
11. Reload to show persistence.

## 11. Limitations

- Gemini live generation requires `GEMINI_API_KEY`.
- Real image backend requires `IMAGE_BACKEND_URL`.
- Supabase is documented and schema-ready but not connected by default.
- Character consistency is prompt/reference based, not LoRA/IP-Adapter level.
- Cached SVG image fallback is intended for demo reliability, not final art quality.

## 12. Future Work

- Connect Supabase repository adapter.
- Upload generated images to Supabase Storage.
- Add Auth with row-level security.
- Add reference image upload.
- Integrate ComfyUI/Stable Diffusion endpoint.
- Add PDF export.
- Add style presets: manga, webtoon, western comic.
- Add smarter bubble placement suggestions.

## 13. Conclusion

The project demonstrates a complete AI-assisted comic creation workflow with explicit safeguards for real-world AI failure modes. The strongest engineering choice is not pretending the AI pipeline is always reliable; instead, the app validates AI output, keeps user edits safe, provides fallback image/storyboard data, and still lets the user finish an exportable comic.
