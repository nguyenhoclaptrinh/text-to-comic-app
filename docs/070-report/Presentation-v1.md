---
id: RPT-004
type: presentation
status: draft
created: 2026-06-14
updated: 2026-06-14
---

# Presentation v1: ComicCraft AI

## Ghi chú định vị

Repo hiện triển khai mạnh nhất flow:

```text
Text -> Storyboard -> Prompt chỉnh tay -> Generate panel image -> Bubble edit -> Export PNG
```

Vì vậy khi trình bày với tên **ComicCraft AI**, nên mô tả chính xác là:

- Ứng dụng tạo truyện tranh với AI.
- Người dùng chỉnh sửa scenario thủ công theo prompt ở cấp panel.
- Nếu muốn nói "tạo truyện tranh từ ảnh", nên ghi đây là hướng mở rộng hoặc là ảnh panel do AI sinh từ prompt, vì upload ảnh đầu vào chưa là flow trung tâm trong UI hiện tại.

## Slide 1: Trang tiêu đề

### Tiêu đề hiển thị

**ComicCraft AI**  
Ứng dụng tạo truyện tranh với AI và chỉnh sửa scenario thủ công theo prompt

### Nội dung chính

- Tên đề tài
- Tên nhóm hoặc thành viên
- Môn học, giảng viên hướng dẫn
- Thời gian báo cáo

### Thông điệp cần nói

- Đây không chỉ là công cụ tạo ảnh bằng AI.
- Đây là một workspace hỗ trợ sáng tác comic có thể chỉnh sửa và export được.

### Visual gợi ý

- 1 screenshot màn `Storyboard` hoặc `Comic Editor`

## Slide 2: Động lực nghiên cứu

### Tiêu đề hiển thị

**Động lực nghiên cứu**

### Nội dung chính

- Nhiều người có ý tưởng truyện nhưng không có kỹ năng vẽ hoặc thời gian dựng từng khung.
- Công cụ AI hiện tại tạo nội dung nhanh nhưng thường khó kiểm soát mạch truyện, lời thoại và tính nhất quán nhân vật.
- Trong thực tế, người dùng không chỉ cần "generate", mà cần một quy trình có thể sửa, thử lại và hoàn thiện sản phẩm.

### Thông điệp cần nói

- Bài toán thực tế không phải chỉ là sinh ảnh đẹp.
- Bài toán là tạo ra một comic nháp có thể biên tập được.

## Slide 3: Phát biểu bài toán

### Tiêu đề hiển thị

**Phát biểu bài toán**

### Nội dung chính

- Làm thế nào để chuyển một câu chuyện thành truyện tranh số theo quy trình end-to-end?
- Làm thế nào để AI hỗ trợ sinh storyboard và panel image nhưng người dùng vẫn giữ quyền kiểm soát kết quả?
- Làm thế nào để hệ thống vẫn chạy được khi AI backend lỗi, timeout, quota hoặc thiếu API key?

### Thông điệp cần nói

- Bài toán cốt lõi là thiết kế hệ thống `AI-assisted but human-controlled`.

## Slide 4: Mục tiêu và câu hỏi nghiên cứu

### Tiêu đề hiển thị

**Mục tiêu và câu hỏi nghiên cứu**

### Nội dung chính

Mục tiêu:

- Xây dựng ứng dụng web cho phép nhập truyện, tạo storyboard, sinh ảnh panel, chỉnh lời thoại và export.
- Cho phép người dùng chỉnh scenario thủ công trước và sau bước sinh ảnh.
- Đảm bảo hệ thống vẫn có khả năng hoàn tất demo khi dịch vụ AI không ổn định.

Câu hỏi nghiên cứu:

- AI có giúp rút ngắn thời gian tạo comic nháp không?
- Việc chỉnh prompt thủ công có cải thiện khả năng kiểm soát kết quả không?
- Fallback và schema validation có làm hệ thống ổn định hơn trong môi trường demo thực tế không?

## Slide 5: Phạm vi nghiên cứu

### Tiêu đề hiển thị

**Phạm vi nghiên cứu**

### Nội dung chính

Trong phạm vi:

- Ứng dụng web prototype
- Text import
- Storyboard generation
- Panel image generation
- Character casting
- Speech bubble editor
- PNG export

Ngoài phạm vi:

- Mạng xã hội truyện tranh
- Mobile native app
- Huấn luyện model riêng cho từng người dùng
- Cam kết chất lượng ảnh thương mại
- Character consistency ở mức cao như LoRA/IP-Adapter production

### Thông điệp cần nói

- Mục tiêu của đề tài là chứng minh pipeline khả thi, không phải giải quyết toàn bộ ngành sáng tác truyện tranh bằng AI.

## Slide 6: Giả thuyết và hướng tiếp cận

### Tiêu đề hiển thị

**Giả thuyết và hướng tiếp cận**

### Nội dung chính

Giả thuyết:

- Nếu AI chỉ đóng vai trò tạo bản nháp nhanh, còn người dùng được chỉnh scenario ở cấp panel, thì trải nghiệm sẽ thực tế và đáng tin cậy hơn full automation.

Hướng tiếp cận:

```text
Nhập truyện -> AI dựng storyboard -> Người dùng chỉnh prompt/scenario -> Vẽ ảnh panel -> Chỉnh bubble -> Export
```

### Thông điệp cần nói

- Trọng tâm của hệ thống là `human-in-the-loop`.

## Slide 7: Tổng quan ứng dụng

### Tiêu đề hiển thị

**Tổng quan ứng dụng**

### Nội dung chính

Ứng dụng gồm các khu vực chính:

- `Dashboard`: quản lý project
- `Text Import`: nhập truyện và chọn phong cách vẽ
- `Storyboard Workspace`: sửa mô tả cảnh, lời thoại, nhân vật và sinh ảnh
- `Comic Editor`: thêm, sửa, kéo bubble trên ảnh
- `Export`: xuất PNG dọc kiểu webtoon

### Thông điệp cần nói

- Hệ thống được tổ chức như một creative workspace thay vì một demo một màn hình.

### Visual gợi ý

- 3 screenshot theo thứ tự `Text Import -> Storyboard -> Comic Editor`

## Slide 8: Kiến trúc hệ thống

### Tiêu đề hiển thị

**Kiến trúc hệ thống**

### Nội dung chính

```text
Browser UI
  -> Next.js Client Components
  -> API Routes
      -> /api/storyboard
      -> /api/generate-panel
  -> AI Services
      -> Gemini storyboard
      -> Gemini image / image backend / Kaggle / fallback
  -> localStorage + IndexedDB
```

### Thông điệp cần nói

- Kiến trúc được thiết kế theo hướng local-first và demo-first.
- Khi AI service gặp sự cố, người dùng vẫn giữ được dữ liệu và tiếp tục quy trình.

## Slide 9: Luồng xử lý storyboard bằng AI

### Tiêu đề hiển thị

**Luồng xử lý storyboard**

### Nội dung chính

Quy trình:

1. Nhận `title`, `story text`, `style`
2. Gọi model text nếu có cấu hình API key
3. Ép output về JSON có cấu trúc
4. Validate response bằng schema
5. Nếu lỗi, chuyển sang fallback storyboard

### Thông điệp cần nói

- AI không trả nội dung tự do mà phải đi qua lớp schema validation.
- Điều này giúp storyboard ổn định hơn và dễ tích hợp vào UI biên tập.

## Slide 10: Luồng xử lý sinh ảnh panel

### Tiêu đề hiển thị

**Luồng xử lý sinh ảnh panel**

### Nội dung chính

Quy trình:

1. Lấy `scene prompt`, `dialogue`, `character context`
2. Tổng hợp prompt cuối cùng cho panel
3. Gọi image backend nếu được cấu hình
4. Nếu backend không sẵn sàng, dùng fallback image
5. Cập nhật trạng thái panel: chờ, đang vẽ, xong, lỗi

### Thông điệp cần nói

- Hệ thống sinh ảnh theo từng panel nên dễ retry cục bộ.
- Một panel lỗi không phá hỏng toàn bộ project.

## Slide 11: Cơ chế chỉnh sửa scenario thủ công

### Tiêu đề hiển thị

**Cơ chế chỉnh sửa scenario thủ công**

### Nội dung chính

- Người dùng sửa `scene prompt` cho từng panel.
- Người dùng sửa `dialogue` trước khi vẽ hoặc sau khi có ảnh.
- Character Casting giúp mô tả nhân vật nhất quán hơn.
- Có thể regenerate riêng từng panel theo prompt mới.

### Thông điệp cần nói

- Đây là đóng góp trung tâm của ứng dụng.
- Giá trị không nằm ở chỗ AI tự động hoàn toàn, mà nằm ở khả năng người dùng can thiệp đúng thời điểm.

### Visual gợi ý

- Screenshot panel card có phần `Mô tả cảnh`, `Lời thoại`, `Vẽ ảnh`

## Slide 12: Các tính năng chính đã hoàn thành

### Tiêu đề hiển thị

**Các tính năng chính**

### Nội dung chính

| Tính năng | Trạng thái |
| --- | --- |
| Tạo project từ truyện chữ | Hoàn thành |
| Tạo storyboard nhiều panel | Hoàn thành |
| Sửa prompt và lời thoại | Hoàn thành |
| Character casting | Hoàn thành |
| Generate / Regenerate panel | Hoàn thành |
| Bubble editor kéo thả | Hoàn thành |
| Export PNG dọc | Hoàn thành |
| Local persistence | Hoàn thành |
| Fallback khi AI lỗi | Hoàn thành |

### Thông điệp cần nói

- Ứng dụng đã hoàn chỉnh được một pipeline end-to-end phục vụ demo và nghiên cứu ứng dụng.

## Slide 13: Đánh giá hệ thống

### Tiêu đề hiển thị

**Đánh giá hệ thống**

### Nội dung chính

Tiêu chí đánh giá:

- Hoàn thành quy trình từ nhập truyện đến export
- Khả năng chỉnh sửa scenario ở cấp panel
- Khả năng phục hồi khi AI service lỗi
- Tính khả dụng của sản phẩm đầu ra

Bằng chứng kỹ thuật:

- Unit tests
- Integration tests
- Playwright E2E
- Typed API contracts
- Build/lint/test gates

### Command minh họa

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

### Thông điệp cần nói

- Đề tài không chỉ dừng ở mức ý tưởng giao diện mà đã có kiểm chứng kỹ thuật tương đối đầy đủ.

## Slide 14: Kịch bản demo

### Tiêu đề hiển thị

**Kịch bản demo**

### Nội dung chính

1. Nhập một đoạn truyện ngắn
2. Bấm `Tạo storyboard`
3. Sửa một `Mô tả cảnh`
4. Sửa một `Lời thoại`
5. Vẽ một panel hoặc `Vẽ tất cả`
6. Mở `Chỉnh lời thoại trên ảnh`
7. Kéo speech bubble
8. Xuất PNG

### Thông điệp cần nói

- Demo phải làm nổi bật 2 ý: AI tạo nháp nhanh và người dùng kiểm soát scenario.

## Slide 15: Hạn chế hiện tại

### Tiêu đề hiển thị

**Hạn chế hiện tại**

### Nội dung chính

- Chất lượng ảnh còn phụ thuộc backend AI.
- Character consistency mới dừng ở mức prompt/reference.
- Upload ảnh đầu vào của người dùng chưa là flow cốt lõi trong UI.
- Supabase mới là hướng mở rộng, chưa là baseline persistence.
- Fallback image phục vụ độ ổn định demo nhiều hơn là chất lượng mỹ thuật cao.

### Thông điệp cần nói

- Việc nêu rõ giới hạn là cần thiết trong trình bày khoa học và giúp xác định đúng giá trị hiện tại của hệ thống.

## Slide 16: Hướng phát triển

### Tiêu đề hiển thị

**Hướng phát triển**

### Nội dung chính

- Bổ sung upload reference image thật cho character hoặc scene
- Tích hợp backend sinh ảnh ổn định hơn
- Đồng bộ project và image lên Supabase
- Thêm PDF export
- Bổ sung style presets
- Mở rộng rõ ràng sang pipeline image-to-comic nếu muốn bám narrative "từ ảnh"

### Thông điệp cần nói

- Kiến trúc hiện tại đủ mở để tiếp tục phát triển thành sản phẩm thực tế hơn.

## Slide 17: Kết luận

### Tiêu đề hiển thị

**Kết luận**

### Nội dung chính

- ComicCraft AI chứng minh tính khả thi của một workflow tạo truyện tranh có AI hỗ trợ.
- Đóng góp chính của hệ thống là kết hợp sinh nội dung tự động với khả năng chỉnh sửa scenario thủ công.
- Hướng tiếp cận human-in-the-loop phù hợp hơn với ứng dụng sáng tạo thực tế so với full automation.

### Câu chốt nên nói

- Giá trị lớn nhất của hệ thống không phải là để AI thay người dùng sáng tác, mà là giúp người dùng sáng tác nhanh hơn nhưng vẫn giữ quyền kiểm soát nội dung.

## Gợi ý trình bày

- Giữ tổng số slide khoảng 15 đến 17 slide.
- Mỗi slide chỉ nên có 1 thông điệp chính.
- Ưu tiên screenshot thật từ app hơn là nhiều chữ.
- Khi nói về AI, luôn gắn với các từ khóa: `controllability`, `fallback`, `validation`, `human-in-the-loop`.
