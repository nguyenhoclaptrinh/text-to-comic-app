---
id: RPT-005
type: presentation
status: draft
created: 2026-06-14
updated: 2026-06-14
---

# Presentation v2: ComicCraft AI

## Ghi chú định vị

Tên trình bày dùng là **ComicCraft AI**, nhưng nội dung cần bám đúng capability hiện tại của repo:

```text
Text -> Storyboard -> Prompt chỉnh tay -> Generate panel image -> Bubble edit -> Export PNG
```

Vì vậy, nên mô tả đây là ứng dụng tạo truyện tranh với AI theo hướng **human-in-the-loop**, nhấn mạnh chỉnh sửa scenario thủ công theo prompt. Nếu cần nhắc tới "từ ảnh", nên xem đó là hướng mở rộng thay vì flow chính hiện tại.

## Slide 1. Trang tiêu đề

### Nội dung đặt trên slide

**ComicCraft AI**  
Ứng dụng tạo truyện tranh với AI và chỉnh sửa scenario thủ công theo prompt

ComicCraft AI là một ứng dụng web hỗ trợ chuyển đổi truyện chữ thành truyện tranh số thông qua quy trình cộng tác giữa AI và người dùng. Hệ thống được thiết kế để AI tạo bản nháp ban đầu, còn người dùng giữ quyền kiểm soát đối với scenario, prompt, lời thoại và kết quả hình ảnh ở từng khung truyện.

### Cách thể hiện

- Bố cục `hero slide`
- Bên trái: tiêu đề và đoạn mô tả ngắn
- Bên phải: 1 screenshot lớn của màn `Storyboard`
- Dưới cùng: tên nhóm, môn học, giảng viên, ngày báo cáo

### Mục đích slide

- Thiết lập đúng định vị học thuật của đề tài ngay từ đầu
- Giúp người nghe hiểu đây là một hệ thống workflow, không phải chỉ là công cụ generate ảnh

## Slide 2. Động lực nghiên cứu

### Nội dung đặt trên slide

- Người dùng có ý tưởng truyện nhưng thiếu kỹ năng vẽ và thời gian dựng comic thủ công
- Công cụ AI hiện nay tạo nội dung nhanh nhưng khó kiểm soát mạch truyện, lời thoại và tính nhất quán nhân vật
- Nhu cầu thực tế là một quy trình tạo comic có thể sửa, thử lại và hoàn thiện

### Cách thể hiện

- Bố cục `3 cột vấn đề`
- Mỗi cột là một pain point kèm icon
- Dòng chốt ở cuối slide:
  `Vấn đề không chỉ là tạo ảnh, mà là tạo comic có thể biên tập được`

### Mục đích slide

- Cho người nghe thấy vì sao đề tài có ý nghĩa thực tiễn

## Slide 3. Phát biểu bài toán

### Nội dung đặt trên slide

**Bài toán đặt ra**

- Chuyển truyện chữ thành truyện tranh số theo quy trình end-to-end
- Tận dụng AI để tạo storyboard và hình ảnh nhưng vẫn giữ quyền kiểm soát cho người dùng
- Duy trì khả năng hoạt động khi backend AI lỗi, timeout, quota hoặc offline

### Cách thể hiện

- Bố cục `problem statement`
- Phần đầu là 1 câu dẫn ngắn
- Bên dưới là 3 bullet lớn, mỗi bullet 1 ý
- Tô nổi từ khóa `end-to-end`, `control`, `robustness`

### Mục đích slide

- Xác định rõ bài toán nghiên cứu thay vì mô tả chung chung

## Slide 4. Mục tiêu nghiên cứu

### Nội dung đặt trên slide

- Xây dựng ứng dụng web hỗ trợ nhập truyện, tạo storyboard, sinh ảnh panel, chỉnh lời thoại và export
- Cho phép người dùng chỉnh scenario thủ công trước và sau bước sinh ảnh
- Bảo đảm hệ thống vẫn có thể hoàn tất demo khi dịch vụ AI không ổn định

### Cách thể hiện

- Bố cục `3 khối mục tiêu`
- Mỗi khối gồm: nhãn ngắn + mô tả 1 dòng
- Nhãn gợi ý: `Pipeline`, `User Control`, `Reliability`

### Mục đích slide

- Giúp người nghe thấy sản phẩm được xây theo mục tiêu kỹ thuật rõ ràng

## Slide 5. Câu hỏi nghiên cứu

### Nội dung đặt trên slide

1. AI có giúp rút ngắn thời gian tạo comic nháp không?
2. Chỉnh prompt thủ công có giúp kiểm soát kết quả tốt hơn không?
3. Fallback và validation có làm hệ thống ổn định hơn trong demo thực tế không?

### Cách thể hiện

- Bố cục `question slide`
- Mỗi câu hỏi đặt trong một thẻ riêng
- Dùng đánh số lớn `01 02 03`

### Mục đích slide

- Tạo mạch nghiên cứu rõ ràng trước khi đi vào phân tích giải pháp

## Slide 6. Phạm vi nghiên cứu

### Nội dung đặt trên slide

**Trong phạm vi**

- Text import
- Storyboard generation
- Panel image generation
- Character casting
- Speech bubble editor
- PNG export

**Ngoài phạm vi**

- Mạng xã hội truyện tranh
- Mobile app native
- Huấn luyện model riêng
- Chất lượng ảnh thương mại

### Cách thể hiện

- Bố cục `2 cột so sánh`
- Cột trái màu nhấn nhẹ cho `Trong phạm vi`
- Cột phải màu trung tính cho `Ngoài phạm vi`

### Mục đích slide

- Giới hạn đúng kỳ vọng của hội đồng/người nghe

## Slide 7. Hướng tiếp cận

### Nội dung đặt trên slide

**Human-in-the-loop workflow**

```text
Nhập truyện -> AI dựng storyboard -> Chỉnh prompt/scenario -> Vẽ ảnh panel -> Chỉnh bubble -> Export
```

- AI tạo bản nháp nhanh
- Người dùng giữ quyền kiểm soát nội dung
- Hệ thống ưu tiên khả năng chỉnh sửa hơn tự động hóa hoàn toàn

### Cách thể hiện

- Bố cục `flow diagram`
- Trục ngang 6 bước
- Mỗi bước có icon và nhãn ngắn
- Bước `Chỉnh prompt/scenario` nên làm nổi bật nhất

### Mục đích slide

- Đây là slide bản lề, giúp người nghe hiểu logic toàn bộ hệ thống

## Slide 8. Tổng quan ứng dụng

### Nội dung đặt trên slide

- `Dashboard`: quản lý project
- `Text Import`: nhập truyện và chọn style
- `Storyboard Workspace`: chỉnh cảnh, lời thoại, nhân vật
- `Comic Editor`: chỉnh bubble trên ảnh
- `Export`: xuất PNG dọc

### Cách thể hiện

- Bố cục `5 khối tính năng`
- Tốt nhất dùng screenshot thu nhỏ cho từng màn
- Nếu thiếu thời gian, dùng 3 ảnh: `Import`, `Storyboard`, `Editor`

### Mục đích slide

- Cho người nghe hình dung app là một workspace đầy đủ

## Slide 9. Kiến trúc hệ thống

### Nội dung đặt trên slide

```text
Browser UI
  -> Next.js Client Components
  -> /api/storyboard
  -> /api/generate-panel
  -> AI Services
  -> localStorage + IndexedDB
```

- Tách giao diện, API và AI service
- Lưu trạng thái theo hướng local-first
- Có cơ chế fallback khi AI không sẵn sàng

### Cách thể hiện

- Bố cục `architecture block diagram`
- Dùng sơ đồ 3 lớp: `UI`, `API`, `AI + Storage`
- Đừng để quá nhiều chữ trong sơ đồ

### Mục đích slide

- Chứng minh hệ thống có tổ chức kiến trúc rõ ràng, không chỉ là demo front-end

## Slide 10. Luồng tạo storyboard

### Nội dung đặt trên slide

1. Nhận truyện đầu vào
2. Gọi AI text model
3. Ép output về JSON có cấu trúc
4. Validate bằng schema
5. Fallback nếu phản hồi lỗi

### Cách thể hiện

- Bố cục `pipeline 5 bước`
- Có thể dùng mũi tên nối từ trái sang phải
- Bước `Validate` và `Fallback` nên tô màu nhấn để thể hiện độ tin cậy

### Mục đích slide

- Làm rõ vì sao storyboard của hệ thống có tính ổn định cao hơn cách gọi model trực tiếp

## Slide 11. Luồng sinh ảnh panel

### Nội dung đặt trên slide

1. Tạo prompt từ scene + dialogue + character context
2. Sinh ảnh theo từng panel
3. Hỗ trợ generate một panel hoặc toàn bộ panel
4. Retry cục bộ nếu một panel lỗi
5. Dùng fallback image khi backend không sẵn sàng

### Cách thể hiện

- Bố cục `step + state`
- Bên trái: 5 bước xử lý
- Bên phải: trạng thái panel `chờ`, `đang vẽ`, `xong`, `lỗi`

### Mục đích slide

- Cho người nghe thấy hệ thống xử lý ảnh theo hướng linh hoạt và an toàn

## Slide 12. So sánh các mô hình hoặc backend sinh ảnh

### Nội dung đặt trên slide

| Mô hình / Backend | Điểm mạnh | Hạn chế | Mức phù hợp với đề tài |
| --- | --- | --- | --- |
| Gemini Image | Tích hợp nhanh, đồng bộ với pipeline Gemini | Khó kiểm soát sâu, phụ thuộc quota/API | Phù hợp để thử nghiệm nhanh |
| `sd-turbo` local | Chạy được local, chi phí thấp, dễ demo | Chất lượng chưa cao, consistency hạn chế | Phù hợp cho prototype và demo |
| Kaggle / cloud job | Có thể tận dụng tài nguyên ngoài máy local | Độ trễ cao hơn, phụ thuộc hạ tầng ngoài | Phù hợp cho batch generation |
| Fallback cached image | Đảm bảo demo không bị gián đoạn | Không phải ảnh AI thật, giá trị thị giác thấp | Phù hợp cho độ tin cậy hệ thống |

### Cách thể hiện

- Bố cục `comparison table`
- Tô nổi cột `Điểm mạnh` và `Mức phù hợp`
- Có thể thêm dòng kết luận ở cuối:
  `Không có một mô hình duy nhất tối ưu cho mọi tiêu chí; hệ thống chọn cách tiếp cận đa backend để cân bằng chất lượng, tốc độ và độ ổn định`

### Mục đích slide

- Giải thích rõ vì sao hệ thống không phụ thuộc vào một mô hình sinh ảnh duy nhất
- Tăng tính nghiên cứu khi trình bày quyết định công nghệ

## Slide 13. Cơ chế chỉnh sửa scenario thủ công

### Nội dung đặt trên slide

- Chỉnh `scene prompt` cho từng panel
- Chỉnh `dialogue` trước hoặc sau khi có ảnh
- Bổ sung mô tả nhân vật qua `Character Casting`
- Regenerate riêng từng panel theo prompt mới

### Cách thể hiện

- Bố cục `before/after`
- Bên trái: prompt gốc từ AI
- Bên phải: prompt sau khi người dùng chỉnh
- Bên dưới: ảnh panel hoặc screenshot panel card

### Mục đích slide

- Nhấn mạnh đóng góp trọng tâm của đề tài

## Slide 14. Các chức năng chính đã hoàn thành

### Nội dung đặt trên slide

- Tạo project từ truyện chữ
- Tạo storyboard nhiều panel
- Chỉnh prompt và dialogue
- Character casting
- Generate / Regenerate panel
- Bubble editor kéo thả
- Export PNG dọc
- Local persistence và error recovery

### Cách thể hiện

- Bố cục `checklist slide`
- Chia làm 2 cột để tránh quá dài
- Dùng dấu check hoặc trạng thái `Done`

### Mục đích slide

- Tóm tắt mức độ hoàn thiện của hệ thống trước khi chuyển sang đánh giá

## Slide 15. Đánh giá hệ thống

### Nội dung đặt trên slide

**Tiêu chí đánh giá**

- Hoàn thành flow từ truyện chữ đến comic
- Có thể chỉnh sửa scenario ở cấp panel
- Hệ thống vẫn chạy khi AI lỗi
- Kết quả đầu ra có thể export và sử dụng

**Bằng chứng kỹ thuật**

- Unit tests
- Integration tests
- Playwright E2E
- Typed API contracts
- Build/lint/test gates

### Cách thể hiện

- Bố cục `2 khối`
- Trái: tiêu chí đánh giá
- Phải: bằng chứng kỹ thuật
- Có thể chèn 1 dòng lệnh ngắn ở cuối

### Mục đích slide

- Tăng tính thuyết phục về mặt kỹ thuật và nghiên cứu ứng dụng

## Slide 16. Kịch bản demo

### Nội dung đặt trên slide

1. Nhập truyện
2. Tạo storyboard
3. Sửa mô tả cảnh
4. Sửa lời thoại
5. Vẽ panel
6. Chỉnh bubble
7. Export PNG

### Cách thể hiện

- Bố cục `demo roadmap`
- Trình bày theo timeline dọc
- Dùng highlight màu ở bước `Sửa mô tả cảnh` để nhấn manual control

### Mục đích slide

- Chuẩn bị tâm thế cho phần demo hoặc giúp người nghe tóm được use case chuẩn

## Slide 17. Hạn chế hiện tại

### Nội dung đặt trên slide

- Chất lượng ảnh còn phụ thuộc backend AI
- Character consistency mới ở mức prompt/reference
- Upload ảnh đầu vào chưa là flow cốt lõi trong UI
- Supabase chưa là persistence mặc định

### Cách thể hiện

- Bố cục `4 thẻ rủi ro`
- Mỗi thẻ gồm `hạn chế` và `ý nghĩa`
- Tránh làm slide này quá nặng màu tiêu cực

### Mục đích slide

- Thể hiện tính trung thực học thuật và xác định đúng mức trưởng thành của sản phẩm

## Slide 18. Hướng phát triển

### Nội dung đặt trên slide

- Upload reference image thật cho character/scene
- Tích hợp backend sinh ảnh mạnh hơn
- Đồng bộ project lên Supabase
- PDF export và style presets
- Mở rộng sang pipeline image-to-comic

### Cách thể hiện

- Bố cục `roadmap`
- Chia thành `ngắn hạn` và `trung hạn`
- Có thể dùng mũi tên tiến hóa từ prototype sang production-ready

### Mục đích slide

- Cho thấy đề tài có khả năng mở rộng thành sản phẩm tiếp theo

## Slide 19. Kết luận

### Nội dung đặt trên slide

- ComicCraft AI chứng minh tính khả thi của workflow tạo truyện tranh có AI hỗ trợ
- Đóng góp chính là kết hợp AI sinh nháp với chỉnh sửa scenario thủ công
- Human-in-the-loop phù hợp hơn full automation trong bài toán sáng tạo

### Cách thể hiện

- Bố cục `closing slide`
- 3 ý chốt ở trung tâm
- Có thể thêm 1 câu kết ở cuối:
  `AI hỗ trợ sáng tác hiệu quả hơn khi người dùng vẫn giữ quyền kiểm soát nội dung`

### Mục đích slide

- Kết lại bằng đóng góp học thuật và giá trị thực tiễn của đề tài

## Gợi ý phong cách trình bày tổng thể

- Không dùng cùng một layout cho mọi slide
- Xen kẽ các kiểu: `hero`, `3 cột`, `2 cột`, `flow`, `roadmap`, `before/after`, `checklist`
- Mỗi slide chỉ nên có 1 thông điệp chính
- Ưu tiên screenshot thật từ app ở các slide 1, 8, 13 và 16
- Khi nói về AI, nên lặp lại nhất quán 4 từ khóa:
  `control`, `validation`, `fallback`, `human-in-the-loop`
