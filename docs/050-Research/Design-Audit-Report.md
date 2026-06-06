---
id: Design-Audit-Report
type: research
status: completed
created: 2026-06-06
updated: 2026-06-06
---

# BÁO CÁO AUDIT TOÀN DIỆN CÁC LỖ HỔNG THIẾT KẾ (DESIGN AUDIT REPORT)

*Người thực hiện: Antigravity AI (Phân vai: Lead Architect, Product Manager, QA Tester)*

Báo cáo này liệt kê danh sách toàn bộ các điểm thiết kế bất hợp lý, thiếu sót hoặc kém tối ưu (Technical Debt & Design Flaws) trong dự án `text-to-comic-app` hiện tại, kèm theo giải pháp kỹ thuật khắc phục tương ứng cho từng vấn đề.

---

## DANH SÁCH 7 LỖ HỔNG THIẾT KẾ ĐÃ ĐƯỢC AUDIT

### 🚨 Lỗi 1: Tầng dữ liệu Supabase "ảo" (Supabase Mirage)
*   **Thiết kế đần**: Có file `supabase/schema.sql` và tài liệu mô tả kết nối DB, nhưng mã nguồn thực tế của ứng dụng Next.js vẫn chỉ đọc/ghi thông qua `localStorage` (`LocalStorageStudioRepository`). Tầng persistence kết nối Supabase Postgres thật hoàn toàn chưa được tích hợp chạy.
*   **Hậu quả**: Người dùng mất sạch dữ liệu khi xóa cache trình duyệt, không có khả năng đồng bộ đám mây thực tế.
*   **Giải pháp khắc phục**: Kích hoạt `SupabaseStudioRepository` trong `hooks/useComicStudioPersistence.ts`, cấu hình Supabase Client và thay thế hoàn toàn tầng Mock LocalStorage bằng các truy vấn SQL thông qua client.

### 🚨 Lỗi 2: Lỗi xóa sạch truyện gốc khi AI lỗi (Fallback Overwrite)
*   **Thiết kế đần**: Khi Gemini API gặp lỗi (timeout, hết hạn mức hoặc trả về JSON sai định dạng), hàm `createFallbackStoryboardResponse` sẽ tự động trả về một kịch bản truyện mẫu cố định có tên là "The Lost Compass".
*   **Hậu quả**: Toàn bộ nội dung truyện chữ do người dùng dán vào ban đầu bị xóa sạch và thay thế bằng truyện mẫu.
*   **Giải pháp khắc phục**: (Đã xử lý một phần trong utils.ts) Nâng cấp bộ parser Regex thô để bóc tách thoại và chia các panel từ chính câu truyện gốc của người dùng để làm fallback, tuyệt đối không dùng truyện mẫu cố định.

### 🚨 Lỗi 3: Lỗ hổng nhất quán nhân vật (Character Consistency)
*   **Thiết kế đần**: Casting Panel cho phép nhập mô tả ngoại hình, nhưng prompt sinh ảnh thực tế chỉ ghép nối thô sơ `name: description` ở cuối câu prompt, khiến AI sinh khuôn mặt/trang phục nhân vật thay đổi liên tục qua các panel.
*   **Hậu quả**: Truyện tranh mất tính logic trực quan, người dùng từ bỏ ứng dụng.
*   **Giải pháp khắc phục**: (Đã cập nhật prompt trong image-generation.ts) Định hình lại cấu trúc prompt đưa thông tin nhân vật chính và phong cách vẽ lên đầu câu, bổ sung các từ khóa neo giữ chất lượng và tính nhất quán (`consistent character styling, same outfit, same face`).

### 🚨 Lỗi 4: Giới hạn panel cứng nhắc (3 - 6 Panels)
*   **Thiết kế đần**: Schema JSON của Gemini bị giới hạn cứng (`minItems: 3, maxItems: 6`), kịch bản chia panel thô trong `utils.ts` cũng bị cố định 3 panels.
*   **Hậu quả**: Không thể chuyển thể các chương truyện dài hơn 1,000 từ.
*   **Giải pháp khắc phục**: 
    - Nâng cấp schema của Gemini: Cho phép trả về từ `3` đến `12` panels hoặc chia chunk truyện chữ theo ngữ cảnh.
    - Cập nhật hàm `createMockPanels` chia số lượng panel động dựa theo chiều dài câu thực tế.

### 🚨 Lỗi 5: Lệch tọa độ bong bóng thoại (Speech Bubble Coordinates Offset)
*   **Thiết kế đần**: Tọa độ được hiển thị dạng phần trăm trên UI, nhưng khi render canvas xuất ảnh (PNG/PDF) lại sử dụng chiều cao cố định và font chữ không đồng bộ tỉ lệ scale.
*   **Hậu quả**: Bong bóng thoại bị lệch vị trí, tràn chữ ra ngoài khung hình khi xuất ảnh.
*   **Giải pháp khắc phục**: (Đã xử lý trong export-renderer.ts) Thiết lập hàm đo chiều cao thực tế của text sau khi wrap dòng để co giãn bong bóng thoại tự động trên Canvas, vẽ thêm đuôi bong bóng thoại để tăng tính thẩm mỹ.

### 🚨 Lỗi 6: Trang Import rườm rà (Redundant Import Screen)
*   **Thiết kế đần**: Bắt người dùng đi qua 1 trang trống độc lập chỉ để dán text rồi bấm nút, làm gãy mạch trải nghiệm người dùng.
*   **Hậu quả**: Giao diện trống trải, trải nghiệm onboarding rườm rà.
*   **Giải pháp khắc phục**: Tích hợp ô nhập truyện chữ thô thành một Modal popup nhanh xuất hiện ngay trên màn hình Dashboard khi nhấn "Tạo truyện mới". Sau đó tự động chuyển thẳng người dùng sang màn hình Storyboard với trạng thái Loading trực tiếp.

### 🚨 Lỗi 7: Lỗi Gateway Timeout do sinh ảnh đồng bộ (Serverless Timeout)
*   **Thiết kế đần**: API route `/api/generate-panel` gọi trực tiếp và đồng bộ tới máy chủ GPU (Colab URL hoặc Hugging Face). Nếu GPU xử lý lâu quá 10 giây (giới hạn serverless của Vercel), API sẽ bị Gateway Timeout (504).
*   **Hậu quả**: Tiến trình sinh ảnh bị ngắt quãng giữa chừng, client nhận mã lỗi 504.
*   **Giải pháp khắc phục**: Chuyển sang kiến trúc xử lý bất đồng bộ (Asynchronous Queue): 
    - Khi nhận request, server chỉ lưu Panel trạng thái `generating` và đưa tác vụ vào hàng đợi (Queue).
    - GPU xử lý xong sẽ gửi Webhook trả kết quả, Next.js cập nhật database và push notify về client qua Server-Sent Events (SSE) hoặc WebSocket.
