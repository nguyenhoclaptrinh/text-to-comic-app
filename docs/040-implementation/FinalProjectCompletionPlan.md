---
id: IMP-002
type: implementation-plan
status: draft
created: 2026-05-17
updated: 2026-05-17
---

# Final Project Completion Plan: Text-to-Comic App

## 1. Purpose

Tài liệu này ghi lại kế hoạch từ trạng thái hiện tại đến khi đồ án cuối kỳ được coi là hoàn thành. Mục tiêu không phải biến app thành sản phẩm production đầy đủ, mà là có một demo AI-assisted comic creation chạy ổn, có fallback, có kiểm thử, và có thể giải thích rõ trước hội đồng.

## 2. Current State

Hiện tại ứng dụng đã có prototype frontend end-to-end:

- Text Import -> Storyboard -> Generate mock panel -> Comic Editor -> Bubble -> Export PNG.
- Local snapshot persistence bằng `localStorage`.
- Character Casting editable.
- Storyboard panel delete/regenerate/generate all.
- Vertical PNG export bằng canvas.
- Unit tests, coverage, lint, build, audit gates.
- README và demo runbook.

Các phần chưa có thật:

- Gemini text-to-storyboard chưa được nối API thật.
- Image generation chưa nối backend thật.
- Supabase Auth/DB/Storage chưa triển khai.
- Export hiện render prototype artwork, chưa dùng ảnh AI thật từ storage.
- Chưa có Playwright E2E test cho happy path.

## 3. Completion Definition

Đồ án được coi là xong khi thỏa các điều kiện sau:

| Area | Required Outcome |
| --- | --- |
| Product flow | Tạo được 1 project từ truyện chữ và đi đến PNG export |
| AI text | Có ít nhất một AI thật tạo storyboard JSON, ưu tiên Gemini |
| AI image | Có image generation thật hoặc cached fallback được giải thích rõ |
| Editing | Sửa panel, character, speech bubble, kéo bubble được |
| Persistence | Reload không mất storyboard, character, panel, bubble |
| Export | PNG dọc giữ đúng thứ tự panel và bubble |
| Error handling | Có lỗi rõ cho quota, offline, timeout, JSON invalid |
| QA | Format, lint, test, coverage, build, audit pass |
| Delivery | Có README, runbook, báo cáo, slide, demo data |

## 4. Architecture Decision Summary

### 4.1. Text AI

**Decision:** Dùng Gemini API cho text-to-storyboard.

**Why:**

- Phù hợp bài toán structured JSON.
- Dễ chứng minh năng lực AI thật trong đồ án.
- Rủi ro vận hành thấp hơn tự chạy local LLM.
- Dễ thay mock provider hiện tại trong `lib/studio/ai-services.ts`.

**Condition:**

- Cần `GEMINI_API_KEY`.
- API key chỉ nằm phía server, không expose ra client.
- Phải có Zod schema validate output.
- Phải có retry/repair JSON một lần.

### 4.2. Image AI

**Decision:** Dùng hybrid: image backend thật nếu online, cached fallback nếu backend lỗi.

**Why:**

- Image generation là phần rủi ro nhất: GPU, quota, timeout, tunnel offline.
- Demo cuối kỳ không được phụ thuộc 100% vào Kaggle/Colab live.
- Cached fallback giúp vẫn demo được bubble editor và PNG export.

**Preferred order:**

1. Local GPU/ComfyUI nếu có máy đủ mạnh.
2. Colab/Kaggle notebook để tạo ảnh hoặc mở endpoint tạm.
3. Cached panel images nếu backend offline.

**Condition:**

- Cần bộ ảnh mẫu cho ít nhất 3-6 panel.
- Nếu dùng external image URL, phải xử lý CORS để canvas export không lỗi.
- UI phải phân biệt success/error/offline rõ ràng.

### 4.3. Data Persistence

**Decision:** Giữ localStorage làm baseline; Supabase là nâng cấp nếu còn thời gian.

**Why:**

- LocalStorage hiện đã đáp ứng reload-safe cho demo.
- Supabase giúp đồ án giống production hơn nhưng tăng rủi ro schema, auth, RLS, storage.
- Không nên để database integration làm hỏng MVP đã chạy.

**Condition nếu triển khai Supabase:**

- Tạo bảng `projects`, `characters`, `panels`.
- Có storage bucket cho panel images/reference images.
- Có RLS nếu bật Auth.
- Có migration hoặc SQL script lưu trong repo.

## 5. Roadmap From Now To Final Submission

### Phase 1: Lock Contracts And Schemas

**Tasks:**

- Thêm Zod schema cho storyboard AI response.
- Thêm request/response types cho `/api/storyboard`.
- Thêm request/response types cho `/api/generate-panel`.
- Chuẩn hóa error code: `AI_TEXT_QUOTA`, `AI_TEXT_POLICY_BLOCK`, `AI_TEXT_INVALID_JSON`, `AI_IMAGE_OFFLINE`, `AI_IMAGE_TIMEOUT`.

**Conditions:**

- Không gọi AI nếu chưa có schema.
- Không để AI response đi thẳng vào UI mà không validate.

**Why:**

- AI có thể trả sai format. Schema là lớp phòng thủ đầu tiên để demo không gãy.

**Acceptance Criteria:**

- Invalid JSON không crash app.
- Error được hiển thị trong UI.
- Unit test cover schema parse success/fail.

### Phase 2: Integrate Gemini Storyboard

**Tasks:**

- Thêm `.env.example` với `GEMINI_API_KEY` và `GEMINI_MODEL`.
- Tạo server route `POST /api/storyboard`.
- Gọi Gemini bằng prompt ép JSON.
- Validate bằng Zod.
- Retry/repair một lần nếu JSON invalid.
- Thay mock `analyzeStoryToPanels()` bằng provider có fallback.

**Conditions:**

- API key chỉ dùng server-side.
- Có story sample 300-1,000 words.
- Có JSON fallback file trong repo hoặc mock provider.

**Why:**

- Đây là AI capability quan trọng nhất để chứng minh sản phẩm hiểu truyện và tạo storyboard.

**Acceptance Criteria:**

- Bấm Analyze Story gọi Gemini thật.
- Time to first storyboard dưới 60 giây với text demo ngắn.
- Nếu Gemini lỗi, nội dung người dùng không mất.

### Phase 3: Implement Image Generation With Fallback

**Tasks:**

- Quyết định image provider demo: local ComfyUI, Colab/Kaggle endpoint, hoặc Hugging Face.
- Tạo server route `POST /api/generate-panel`.
- Build prompt từ panel prompt + character description.
- Generate one panel và regenerate riêng một panel.
- Nếu backend offline/quota, dùng cached image hoặc chuyển panel sang error rõ.
- Lưu image data vào panel state hoặc storage URL.

**Conditions:**

- Cần endpoint image test được trước buổi demo.
- Cần cached images trong trường hợp endpoint chết.
- Cần giới hạn generate all tuần tự để tránh timeout.

**Why:**

- Text-to-image là phần tạo "wow factor", nhưng cũng là điểm dễ hỏng nhất. Phải có fallback product-level.

**Acceptance Criteria:**

- Generate một panel thành công.
- Regenerate chỉ thay panel được chọn.
- Lỗi một panel không làm mất panel khác.
- Generate All chạy tuần tự.

### Phase 4: Export With Real Or Cached Images

**Tasks:**

- Cập nhật export renderer để dùng ảnh panel nếu có.
- Giữ bubble overlay trong PNG.
- Cảnh báo nếu panel thiếu ảnh.
- Cho export partial hoặc quay lại Storyboard.

**Conditions:**

- Ảnh phải load được trong browser.
- Nếu ảnh từ storage/external URL, phải kiểm tra CORS canvas.

**Why:**

- Export là kết quả cuối cùng của demo. Nếu không tải được PNG, workflow chưa hoàn chỉnh.

**Acceptance Criteria:**

- PNG export có đúng thứ tự panel.
- Bubble xuất đúng vị trí tương đối.
- Missing image warning hoạt động.

### Phase 5: Optional Supabase Upgrade

**Tasks:**

- Tạo Supabase project.
- Tạo SQL schema cho project, character, panel.
- Tạo repository adapter thay localStorage.
- Upload image vào Supabase Storage.
- Auth là optional nếu còn thời gian.

**Conditions:**

- Chỉ làm sau khi Gemini + image fallback + export ổn.
- Có rollback path về localStorage.

**Why:**

- Database tăng điểm kiến trúc và tính thực tế, nhưng không quan trọng hơn demo end-to-end.

**Acceptance Criteria:**

- Reload/mở lại project từ DB được.
- Panel image URL lưu được.
- Bubble coordinates không mất.

### Phase 6: QA Hardening

**Tasks:**

- Thêm Playwright E2E happy path:
  - create project
  - analyze
  - edit panel
  - generate panel
  - add bubble
  - export
- Test lỗi:
  - Gemini quota/error
  - invalid JSON
  - image backend offline
  - reload khi panel đang generating
  - export thiếu ảnh
- Chạy toàn bộ quality gates.

**Conditions:**

- Có stable test data.
- Có mock provider để test không phụ thuộc network.

**Why:**

- Đồ án cần chứng minh chất lượng, không chỉ demo thủ công.

**Acceptance Criteria:**

- `npm run format:check` pass.
- `npm run lint` pass.
- `npm run test` pass.
- `npm run test:coverage` pass.
- `npm run build` pass.
- `npm audit --audit-level=moderate` pass.

### Phase 7: Report, Slides, And Demo Assets

**Tasks:**

- Viết báo cáo:
  - problem
  - goals/non-goals
  - architecture
  - data flow
  - AI flow
  - error handling
  - QA evidence
  - limitations
  - future work
- Chuẩn bị slide.
- Chuẩn bị demo data:
  - story sample
  - storyboard JSON fallback
  - cached panel images
  - completed project state

**Conditions:**

- Báo cáo phải nói rõ phần nào là AI thật, phần nào là fallback/mock.
- Demo phải chạy được ngay cả khi mạng/API/GPU lỗi.

**Why:**

- Hội đồng chấm cả sản phẩm, tư duy thiết kế, xử lý rủi ro, và khả năng giải thích.

**Acceptance Criteria:**

- Có demo script dưới 7 phút.
- Có fallback path nếu API lỗi.
- Có ảnh/screenshot/prototype image cho báo cáo.

## 6. Priority Stack

Thứ tự ưu tiên không được đảo nếu chưa có lý do mạnh:

1. Zod schema + typed AI contracts.
2. Gemini storyboard thật.
3. Image generation backend hoặc cached image fallback.
4. Export PNG với real/cached images.
5. Playwright E2E happy path.
6. Report + slides + demo assets.
7. Supabase DB/Storage.
8. Auth, PDF export, reference upload, advanced character consistency.

## 7. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Gemini quota/rate limit | Không tạo storyboard live | JSON fallback, retry later message |
| Gemini trả JSON sai | UI crash hoặc không render panel | Zod validate, repair retry |
| Image backend offline | Không generate ảnh live | Cached panel images |
| Kaggle/Colab tunnel đổi URL | API route lỗi | Env config, offline error, cached fallback |
| CORS canvas khi export ảnh ngoài | PNG export lỗi | Dùng same-origin storage hoặc proxy image |
| Supabase RLS sai | Không đọc/ghi được project | Làm sau MVP, giữ localStorage fallback |
| Scope creep | Không kịp hoàn thành | Không làm social/PDF/Auth nếu core chưa xong |

## 8. Final Checklist

### Product

- [ ] User tạo project từ story text.
- [ ] Gemini tạo storyboard JSON thật.
- [ ] User sửa prompt/dialogue/character.
- [ ] User generate/regenerate panel.
- [ ] User thêm/sửa/xóa/kéo bubble.
- [ ] User export PNG.
- [ ] Reload không mất dữ liệu.

### Engineering

- [ ] AI contracts có schema validation.
- [ ] API key không expose client.
- [ ] Error mapping rõ ràng.
- [ ] Fallback data có sẵn.
- [ ] Build/test/lint/audit pass.
- [ ] Dev server chạy được bằng README.

### Delivery

- [ ] README cập nhật.
- [ ] Demo runbook cập nhật.
- [ ] Báo cáo hoàn chỉnh.
- [ ] Slide hoàn chỉnh.
- [ ] Story sample chuẩn bị sẵn.
- [ ] Cached images chuẩn bị sẵn.
- [ ] Final demo script tập trước.

## 9. Recommended Next Task

Task tiếp theo nên làm là **Phase 1: Zod schema + typed AI contracts**.

Lý do: nếu schema chưa ổn mà tích hợp Gemini ngay, code sẽ nhanh nhưng dễ vỡ. Khi schema và error contract chắc, Gemini, image backend, Supabase, và tests đều có điểm tựa chung để phát triển tiếp.
