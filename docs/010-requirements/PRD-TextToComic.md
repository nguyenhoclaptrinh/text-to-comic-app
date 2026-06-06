---
id: PRD-001
type: requirements
status: approved
created: 2026-05-15
updated: 2026-05-17
---

# Product Requirements Document (PRD): Text-to-Comic App

## 1. Product Vision

Text-to-Comic App là ứng dụng web giúp người dùng chuyển một đoạn truyện chữ thành bản truyện tranh/webtoon có thể chỉnh sửa và tải xuống. Sản phẩm không đặt mục tiêu thay thế họa sĩ chuyên nghiệp trong phiên bản đồ án, mà tập trung vào trải nghiệm **AI tạo bản nháp nhanh + người dùng chỉnh sửa có kiểm soát**.

## 2. Target Users & Jobs To Be Done

### Persona 1: Tác giả truyện chữ nghiệp dư

- **Bối cảnh:** Có truyện ngắn/chương truyện nhưng không có kỹ năng vẽ.
- **JTBD:** Khi muốn minh họa một phân cảnh, tôi muốn AI tạo storyboard và hình ảnh nháp để có bản comic đầu tiên mà không cần thuê họa sĩ.
- **Success signal:** Có thể tạo một đoạn webtoon ngắn trong một phiên làm việc.

### Persona 2: Sinh viên/người làm demo sáng tạo

- **Bối cảnh:** Cần sản phẩm AI có tính trình diễn tốt, chi phí thấp.
- **JTBD:** Khi cần demo một pipeline AI thực tế, tôi muốn nhập text, xem AI phân tích, tạo ảnh, chỉnh speech bubble và export.
- **Success signal:** Demo chạy được end-to-end với lỗi có thể giải thích và xử lý.

### Persona 3: Người dùng giải trí

- **Bối cảnh:** Muốn hình ảnh hóa đoạn truyện, meme hoặc tình huống ngắn.
- **JTBD:** Khi có ý tưởng ngắn, tôi muốn nhanh chóng tạo vài panel để chia sẻ hoặc lưu lại.
- **Success signal:** Không cần hiểu prompt engineering vẫn tạo được kết quả chấp nhận được.

## 3. Goals, Non-Goals & Success Metrics

### Goals

- Hoàn thiện luồng end-to-end: Dự án -> Nhập truyện -> Storyboard -> Vẽ ảnh -> Chỉnh truyện -> Xuất file.
- Tích hợp ít nhất 2 nhóm AI capability: text-to-structured-storyboard và text-to-image.
- Giữ character consistency ở mức demo cơ bản bằng character reference/prompt consistency; IP-Adapter/ControlNet là mục tiêu nâng cao.
- Vận hành demo trong giới hạn free tier/Colab khi có thể, có fallback rõ khi quota hoặc backend AI không khả dụng.

### Non-Goals

- Không xây mạng xã hội truyện tranh.
- Không triển khai subscription/monetization.
- Không làm native mobile app.
- Không train LoRA riêng cho từng người dùng trong MVP.
- Không cam kết chất lượng ảnh thương mại hoặc character consistency tuyệt đối.

### Success Metrics

| Metric                   | Target cho đồ án                                  | Ghi chú                          |
| ------------------------ | ------------------------------------------------- | -------------------------------- |
| End-to-end completion    | 1 project mẫu xuất được webtoon image hoặc PDF    | Bắt buộc                         |
| Storyboard JSON validity | >= 90% request demo trả về JSON parse được        | Có retry/fallback schema         |
| Panel generation success | >= 80% panel demo tạo ảnh thành công              | Tính trên backend AI đang online |
| Time to first storyboard | <= 60 giây cho đoạn text ngắn 1.000-2.000 từ      | Demo target                      |
| Manual regenerate        | Có thể regenerate từng panel riêng lẻ             | Không làm lại toàn bộ truyện     |
| Export success           | Export được ít nhất 1 định dạng: PNG dọc hoặc PDF | PNG dọc là MVP                   |

## 4. Scope

### MVP Must-Have

- Nhập hoặc dán đoạn truyện chữ để tạo project.
- AI phân tích text thành danh sách panel có scene description, characters, dialogue.
- Storyboard Editor cho phép sửa prompt, dialogue và thứ tự panel cơ bản.
- Tạo ảnh cho từng panel, hỗ trợ generate all theo tuần tự phía client.
- Regenerate riêng một panel.
- Speech bubble editor thủ công: thêm/sửa/xóa text bubble và kéo vị trí.
- Export thành ảnh dọc webtoon PNG.
- Trạng thái lỗi rõ ràng khi AI text/image bị quota, timeout, policy block hoặc offline.

### Should-Have

- Dashboard danh sách project.
- Supabase Auth cơ bản.
- Character Casting: upload ảnh mẫu hoặc mô tả nhân vật để tăng nhất quán.
- Lưu panel, image URL và speech bubble vào database.
- Export PDF.

### Could-Have

- Style selection: manga black-white, webtoon color, western comic.
- Gợi ý vị trí speech bubble dựa trên vùng trống của ảnh.
- Batch retry các panel lỗi.

### Out-of-Scope

- Community, like/share/comment.
- Monetization/subscription.
- Native iOS/Android.
- LoRA training riêng từng user.
- Publish marketplace/platform như Webtoon.

## 5. User Stories & Acceptance Criteria

### Epic 1: Project & Text Import

**US 1.1:** Là người dùng, tôi muốn tạo project mới bằng cách dán truyện chữ để bắt đầu chuyển đổi thành comic.

Acceptance Criteria:

- Người dùng nhập title và original text.
- Hệ thống validate text không rỗng và cảnh báo nếu vượt ngưỡng xử lý demo.
- Project được lưu với trạng thái `DRAFT`.
- Người dùng được chuyển sang bước tạo storyboard.

**US 1.2:** Là người dùng, tôi muốn xem lại project đang làm dở để tiếp tục chỉnh sửa.

Acceptance Criteria:

- Dashboard hiển thị title, trạng thái, thời gian tạo/cập nhật.
- Người dùng chỉ thấy project của mình nếu Auth được bật.
- Mở project hiển thị lại storyboard/panel đã lưu.

### Epic 2: Storyboard Generation & Editing

**US 2.1:** Là người dùng, tôi muốn AI tách truyện chữ thành các panel có mô tả cảnh, nhân vật và lời thoại.

Acceptance Criteria:

- Kết quả AI trả về JSON theo schema cố định.
- Mỗi panel có `orderIndex`, `scenePrompt`, `characters`, `dialogue`, `status`.
- Nếu JSON lỗi, hệ thống hiển thị lỗi và cho phép retry.
- Storyboard được lưu trước khi tạo ảnh.

**US 2.2:** Là người dùng, tôi muốn sửa mô tả cảnh và lời thoại từng panel trước khi tạo ảnh.

Acceptance Criteria:

- Người dùng sửa prompt/dialogue trực tiếp trong panel card.
- Thay đổi được lưu trước khi gọi image generation.
- Panel đã tạo ảnh vẫn có thể sửa text bubble mà không bắt buộc regenerate ảnh.

**US 2.3:** Là người dùng, tôi muốn khai báo character reference để AI vẽ nhân vật nhất quán hơn.

Acceptance Criteria:

- Người dùng thêm tên nhân vật, mô tả, và tùy chọn ảnh reference.
- Panel có thể liên kết character theo tên/id.
- Nếu image backend không hỗ trợ reference, hệ thống vẫn dùng mô tả nhân vật trong prompt và không hiển thị lỗi kỹ thuật cho người dùng cuối.

### Epic 3: Comic Image Generation

**US 3.1:** Là người dùng, tôi muốn bấm Generate All để hệ thống tạo ảnh cho toàn bộ panel.

Acceptance Criteria:

- Client gọi generate từng panel tuần tự hoặc giới hạn concurrency thấp.
- UI hiển thị trạng thái thân thiện: `Chưa vẽ`, `Đang chờ`, `Đang vẽ`, `Đã vẽ`, `Cần thử lại`.
- Ảnh tạo thành công được upload/lưu URL.
- Một panel lỗi không làm mất kết quả của các panel đã thành công.

**US 3.2:** Là người dùng, tôi muốn regenerate riêng một panel khi ảnh không đạt.

Acceptance Criteria:

- Chỉ panel được chọn chuyển sang trạng thái generating.
- Prompt/dialogue hiện tại của panel được dùng cho lần regenerate.
- Ảnh cũ chỉ bị thay thế khi ảnh mới tạo thành công.
- Nếu lỗi, người dùng thấy lý do và có thể thử lại.

### Epic 4: Comic Editing & Export

**US 4.1:** Là người dùng, tôi muốn thêm và kéo speech bubble vào đúng vị trí trên ảnh.

Acceptance Criteria:

- Người dùng thêm, sửa text, kéo vị trí và xóa bubble.
- Tọa độ bubble được lưu theo panel.
- Bubble không biến mất khi reload project.

**US 4.2:** Là người dùng, tôi muốn tải toàn bộ comic thành file có thể xem/chia sẻ.

Acceptance Criteria:

- MVP export được PNG dọc theo thứ tự panel.
- Export giữ ảnh panel và speech bubble.
- Nếu thiếu ảnh ở một panel, hệ thống cảnh báo và cho phép export phần đã có hoặc quay lại generate.
- PDF export là should-have, không chặn MVP.

## 6. Edge Cases & Error Handling

| Case                            | Expected Behavior                                                   |
| ------------------------------- | ------------------------------------------------------------------- |
| Text quá dài                    | Cảnh báo giới hạn demo; nếu hỗ trợ, chia chunk và xử lý tuần tự     |
| Gemini/model text bị quota      | Hiển thị thông báo quota/rate limit, cho phép retry sau             |
| JSON không đúng schema          | Retry một lần với prompt sửa lỗi hoặc hiển thị raw error            |
| Nội dung bị safety policy block | Thông báo nội dung không thể xử lý và đề nghị chỉnh văn bản         |
| Colab/ngrok offline             | Hiển thị trạng thái AI Image Offline, lưu storyboard để gen lại sau |
| Image generation timeout        | Panel chuyển `ERROR`, không ảnh hưởng panel khác                    |
| Upload image lỗi                | Giữ base64/temporary state nếu có thể, cho phép retry upload        |
| Export thiếu panel              | Cảnh báo và cho người dùng chọn export partial hoặc hủy             |

## 7. AI Cost & Availability Assumptions

- Mục tiêu đồ án là **demo cost = 0đ trong điều kiện free tier/Colab còn khả dụng**, không cam kết vận hành production miễn phí.
- Gemini free tier, Hugging Face credits, Colab GPU, ngrok/cloudflared tunnel đều có thể thay đổi hạn mức hoặc yêu cầu xác thực theo thời gian.
- Hệ thống phải có fallback product-level: lưu storyboard, cho retry, cho generate từng panel, và cho export kết quả partial.
- Tài liệu/triển khai nên ghi rõ ngày kiểm tra hạn mức: 2026-05-17.

## 8. Milestones

### Tuần 1: Foundation & Prototype Conversion

- Setup Next.js, TypeScript, Tailwind, shadcn/ui.
- Tạo layout chính từ prototype.
- Tạo schema ban đầu: Project, Character, Panel.
- Hoàn tất flow nhập text và tạo project local/database.

### Tuần 2: AI Storyboard MVP

- Tích hợp Gemini/current Flash model cho text-to-storyboard.
- Ép output JSON theo schema.
- Hiển thị Storyboard Editor và cho phép sửa panel.
- Xử lý lỗi JSON/quota/policy ở mức UI.

### Tuần 3: Image Generation MVP

- Tích hợp image backend mức cơ bản: Hugging Face hoặc Colab endpoint.
- Generate từng panel và Generate All tuần tự.
- Upload/lưu image URL.
- Regenerate riêng từng panel.

### Tuần 4: Comic Editing

- Character Casting cơ bản.
- Speech bubble editor thủ công.
- Lưu tọa độ bubble.
- Cải thiện trạng thái loading/error/empty.

### Tuần 5: Export, QA & Report

- Export PNG dọc MVP.
- PDF export nếu còn thời gian.
- Test end-to-end bằng project mẫu.
- Chuẩn bị báo cáo, demo script, rủi ro và hướng phát triển.
