---
id: IMP-001
type: implementation
status: approved
created: 2026-05-15
updated: 2026-05-17
---

# Kế Hoạch Triển Khai: Text-to-Comic App

Tài liệu này chuyển PRD thành backlog triển khai theo lát cắt dọc. Mục tiêu là có demo end-to-end trong 5 tuần, ưu tiên PNG export và workflow ổn định hơn các tính năng nâng cao.

## 1. MVP Definition

MVP hoàn thành khi người dùng có thể:
1. Tạo project từ truyện chữ.
2. Dùng AI tạo storyboard dạng panel JSON.
3. Sửa prompt/dialogue từng panel.
4. Generate ảnh từng panel hoặc toàn bộ theo tuần tự.
5. Regenerate riêng panel lỗi.
6. Thêm/kéo speech bubble thủ công.
7. Export PNG dọc.

## 2. Timeline

| Tuần | Outcome | Demo cuối tuần |
| --- | --- | --- |
| Tuần 1 | Foundation + prototype conversion | Mở app, tạo project, xem workspace từ data mẫu |
| Tuần 2 | AI Storyboard MVP | Nhập text, Gemini/current Flash trả panels JSON, hiển thị editor |
| Tuần 3 | Image Generation MVP | Generate một panel, generate all tuần tự, regenerate panel |
| Tuần 4 | Comic Editing | Character casting cơ bản, speech bubble lưu được |
| Tuần 5 | Export + QA + Report | Export PNG dọc, demo script hoàn chỉnh |

## 3. Backlog By Epic

### Epic 1: Foundation & Data

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E1-T1 | Khởi tạo Next.js App Router, TypeScript, Tailwind, shadcn/ui | Must | 4h | App chạy local, có layout base |
| E1-T2 | Tạo Supabase project và env config | Must | 3h | Kết nối DB/Storage bằng env vars |
| E1-T3 | Tạo schema `Project`, `Character`, `Panel` | Must | 5h | DB tạo được project và panel |
| E1-T4 | Tạo `AppShell` từ prototype | Must | 6h | Có navbar/sidebar/main workspace |
| E1-T5 | Auth Supabase cơ bản | Should | 6h | User login/logout; nếu không kịp dùng local demo user |

### Epic 2: Project & Text Import

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E2-T1 | Build `TextImportForm` | Must | 4h | Nhập title/text, validate empty |
| E2-T2 | API/server action tạo project | Must | 4h | Project lưu `DRAFT` với original text |
| E2-T3 | Dashboard danh sách project | Should | 5h | Hiển thị title/status/updatedAt |
| E2-T4 | Route project workspace | Must | 4h | Mở project theo id và load panels |

### Epic 3: AI Storyboard

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E3-T1 | Thiết kế JSON schema cho panel | Must | 3h | Có Zod schema và type TS |
| E3-T2 | Viết prompt text-to-storyboard | Must | 4h | Prompt yêu cầu JSON gồm prompt/characters/dialogue |
| E3-T3 | Tích hợp Gemini/current Flash model | Must | 6h | API nhận projectId và trả panels |
| E3-T4 | Validate + lưu panels | Must | 5h | Panel records tạo đúng order |
| E3-T5 | Retry/repair khi JSON lỗi | Should | 4h | JSON lỗi retry 1 lần hoặc báo lỗi rõ |
| E3-T6 | UI loading/error cho analyze | Must | 4h | Quota/policy/parse error hiển thị được |

### Epic 4: Storyboard Editor

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E4-T1 | Build `StoryboardPanelCard` | Must | 6h | Hiển thị prompt/dialogue/status |
| E4-T2 | Cho phép edit prompt/dialogue | Must | 5h | Save thay đổi vào DB |
| E4-T3 | Character chips trong panel | Should | 3h | Hiển thị characters AI detect |
| E4-T4 | Delete/reorder panel cơ bản | Could | 5h | Không chặn MVP nếu thiếu |

### Epic 5: Image Generation

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E5-T1 | Chọn image backend demo: Hugging Face hoặc Colab | Must | 2h | Có endpoint/API key test được |
| E5-T2 | API `/api/generate-panel` | Must | 6h | Nhận panelId, gọi backend, cập nhật status |
| E5-T3 | Upload ảnh lên Supabase Storage | Must | 5h | Lưu image URL vào panel |
| E5-T4 | Generate một panel từ UI | Must | 4h | Panel chuyển generating -> success/error |
| E5-T5 | Generate All tuần tự phía client | Must | 5h | Lỗi một panel không dừng toàn bộ nếu user chọn tiếp tục |
| E5-T6 | Regenerate riêng panel | Must | 4h | Chỉ thay ảnh khi ảnh mới thành công |
| E5-T7 | Offline/quota/timeout error mapping | Must | 4h | UI phân biệt offline, timeout, policy/quota |

### Epic 6: Character Casting

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E6-T1 | Build `CharacterCastingPanel` | Should | 5h | Add/edit name + description |
| E6-T2 | Upload reference image | Should | 5h | File type/size validation, lưu URL |
| E6-T3 | Inject character info vào prompt image | Should | 4h | Prompt có character description/reference nếu có |

### Epic 7: Speech Bubble Editor

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E7-T1 | Build bubble overlay trên panel image | Must | 6h | Bubble render trên ảnh |
| E7-T2 | Add/edit/delete bubble | Must | 5h | Người dùng sửa text được |
| E7-T3 | Drag bubble position | Must | 6h | Tọa độ x/y cập nhật |
| E7-T4 | Persist `speech_bubbles` JSON | Must | 4h | Reload không mất bubble |
| E7-T5 | Style bubble cơ bản | Should | 4h | Font, background, border ổn định |

### Epic 8: Export & QA

| ID | Task | Priority | Estimate | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| E8-T1 | Export PNG dọc | Must | 8h | Ảnh xuất đúng thứ tự panel và có bubble |
| E8-T2 | Missing panel warning | Must | 3h | Cảnh báo nếu panel chưa có ảnh |
| E8-T3 | PDF export | Should | 6h | Bonus, không chặn MVP |
| E8-T4 | E2E demo script | Must | 4h | Có kịch bản demo cố định |
| E8-T5 | QA pass cho happy path | Must | 6h | Tạo project -> export thành công |
| E8-T6 | QA pass cho lỗi AI offline/quota | Must | 4h | Lỗi hiển thị rõ, không mất dữ liệu |

## 4. Sprint Plan

### Tuần 1: Foundation
- E1-T1, E1-T2, E1-T3, E1-T4
- E2-T1, E2-T2
- Optional: E1-T5 nếu setup Auth nhanh

### Tuần 2: Storyboard
- E2-T4
- E3-T1 đến E3-T6
- E4-T1, E4-T2

### Tuần 3: Image Generation
- E5-T1 đến E5-T7
- E4-T3 nếu còn thời gian

### Tuần 4: Editing
- E6-T1 đến E6-T3
- E7-T1 đến E7-T5

### Tuần 5: Export & Stabilization
- E8-T1, E8-T2, E8-T4, E8-T5, E8-T6
- E8-T3 nếu MVP đã ổn
- Viết báo cáo và chuẩn bị demo data/cache ảnh

## 5. Demo Fallback Plan

Chuẩn bị trước:
- Một đoạn truyện mẫu 500-1.500 từ.
- Một JSON storyboard mẫu để dùng khi Gemini quota/lỗi.
- Một bộ ảnh panel mẫu để dùng khi Colab/Hugging Face offline.
- Một project đã hoàn chỉnh để export ngay nếu mạng/API lỗi trong buổi chấm.

Fallback rules:
- Nếu text AI lỗi: import JSON mẫu và tiếp tục demo editor.
- Nếu image AI lỗi: dùng ảnh panel mẫu, vẫn demo speech bubble/export.
- Nếu export PDF lỗi: demo PNG dọc vì đây là MVP.

## 6. Definition of Done

Một task chỉ được coi là xong khi:
- Có UI hoặc API chạy được trên local.
- Có trạng thái loading/success/error nếu task liên quan AI hoặc network.
- Dữ liệu quan trọng được lưu, reload không mất.
- Không làm hỏng happy path end-to-end.
- Có ghi chú trong báo cáo nếu task dùng mock/fallback.
