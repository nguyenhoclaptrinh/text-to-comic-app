# Báo Cáo Tổng Hợp & Đánh Giá Các Mô Hình Sinh Ảnh (Hugging Face Serverless API)

*   **Thời gian thực hiện**: 15/06/2026
*   **Người thực hiện**: Antigravity (AI Assistant)
*   **Người phê duyệt**: Đại ca
*   **Thư mục kết quả**: [grill-me](file:///d:/2026DaiHoc/PhapChung/FinalApplication/grill-me)

---

## 1. Tổng Quan Quá Trình Dò Tìm & Thử Nghiệm

Nhằm tìm kiếm tối đa các mô hình sinh ảnh hoạt động được trên hệ thống định tuyến Serverless API miễn phí của Hugging Face (`hf-inference` provider), em đã thực hiện quét diện rộng tổng cộng **22 mô hình sinh ảnh** khác nhau qua 3 lượt thử nghiệm song song.

### Danh Sách Các Mô Hình Đã Thử Nghiệm
*   **Nhóm Base Models**: FLUX.1-schnell, FLUX.1-dev, SDXL Base 1.0, SD 1.5, SD 1.4, SD 2.1, SD 2.1 Base, SD 3 Medium, SD 3.5 Large, SD 3.5 Medium, SDXL-Turbo, SD-Turbo, SSD-1B.
*   **Nhóm Fine-tuned / Anime / Comic**: Animagine XL 3.0, Animagine XL 3.1, Pony Diffusion V6, DreamShaper 8, AbsoluteReality 1.8.1, Analog Diffusion, Openjourney v4, waifu-diffusion, Anything v3/v4/v5.

---

## 2. Bảng Tổng Hợp Trạng Thái Hoạt Động (Cập Nhật Thực Tế 2026)

Qua kết quả quét song song bằng các script kiểm thử, đây là bản đồ trạng thái thực tế của Hugging Face Serverless API:

| Nhóm Mô Hình | Tên Mô Hình & Repo | Trạng Thái Trực Tuyến | Lỗi Trả Về / Ghi Chú |
| :--- | :--- | :--- | :--- |
| **Mô hình hoạt động (Active)** | `black-forest-labs/FLUX.1-schnell` | ✅ **Hoạt động tốt** | Cho ra ảnh xuất sắc, phản hồi siêu nhanh (~1.2s). |
| | `stabilityai/stable-diffusion-3-medium-diffusers` | ✅ **Hoạt động tốt** | Sinh ảnh chất lượng cao, phản hồi ở mức trung bình (~15.6s). |
| **Mô hình bị khai tử (Deprecated)** | `stabilityai/stable-diffusion-xl-base-1.0` | ❌ Không hỗ trợ | `HTTP 410: Deprecated and no longer supported by provider` |
| | `black-forest-labs/FLUX.1-dev` | ❌ Không hỗ trợ | `HTTP 410: Deprecated and no longer supported by provider` |
| **Mô hình không được hỗ trợ (Not Supported)** | Các mô hình còn lại (Pony V6, Animagine, SD 1.5, SD 3.5, Anything v5...) | ❌ Không hỗ trợ | `HTTP 400: Model not supported by provider hf-inference` |

---

## 3. Phát Hiện Kỹ Thuật Quan Trọng Về Hạn Mức (Lỗi HTTP 402)

> [!CAUTION]
> **Hiện Tượng Hết Hạn Mức Credits (Cạn Kiệt Tài Nguyên)**:
> Trong lượt quét diện rộng cuối cùng, các mô hình hoạt động tốt (FLUX.1-schnell và SD3 Medium) đã trả về lỗi **`HTTP 402: You have depleted your monthly included credits. Purchase pre-paid credits to continue using Inference`**.
> 
> điều này chứng minh rằng Hugging Face Serverless API áp dụng hạn mức tính bằng credits rất chặt chẽ cho mỗi token tài khoản. Khi chạy thử nghiệm sinh các ảnh chất lượng cao liên tục, credits miễn phí hàng tháng của token hiện tại trong file `.env` đã bị tiêu hao hết.

---

## 4. Đánh Giá & So Sánh Chất Lượng (FLUX.1-schnell vs SD3 Medium)

Dựa trên các hình ảnh kết quả đã sinh thành công và lưu trong thư mục [grill-me](file:///d:/2026DaiHoc/PhapChung/FinalApplication/grill-me):

### A. FLUX.1-schnell ([flux-1-schnell.png](file:///d:/2026DaiHoc/PhapChung/FinalApplication/grill-me/flux-1-schnell.png))
*   **Độ bám prompt**: 9.5/10. Hiểu rất tốt các chi tiết phức tạp trong prompt (blue hair, black cloak, cliff, fantasy city).
*   **Chi tiết & Nét vẽ**: Cực kỳ sắc nét, linework sạch sẽ, màu sắc rực rỡ, thích hợp làm phong cách manhwa/webtoon hiện đại.
*   **Khả năng sinh chữ (Text rendering)**: Tốt nhất thế giới hiện nay, các khung hội thoại có chữ sinh ra không bị méo mó.
*   **Tốc độ**: Siêu nhanh (~1.2s).

### B. Stable Diffusion 3 Medium ([stable-diffusion-3-medium.png](file:///d:/2026DaiHoc/PhapChung/FinalApplication/grill-me/stable-diffusion-3-medium.png))
*   **Độ bám prompt**: 8.5/10. Cấu trúc giải phẫu người tốt, bám sát các mô tả nhân vật.
*   **Chi tiết & Nét vẽ**: Mang đậm tính chất nghệ thuật hội họa (painterly/illustration), màu sắc chuyển vùng mềm mại hơn, thích hợp với phong cách comic Âu Mỹ cổ điển.
*   **Khả năng sinh chữ (Text rendering)**: Khá tốt (vượt trội so với SDXL cũ) nhưng vẫn xếp sau FLUX.
*   **Tốc độ**: Khá chậm (~15.6s).

---

## 5. Đề Xuất Khuyến Nghị Cho Đại Ca

Để ứng phó với lỗi cạn kiệt credits miễn phí (HTTP 402) và lỗi thiếu mô hình của Hugging Face Serverless API, em đề xuất 2 giải pháp kiến trúc:

> [!TIP]
> **Giải pháp 1 (Tiếp tục sử dụng Serverless miễn phí)**:
> *   Đại ca vui lòng đăng ký một tài khoản Hugging Face phụ (hoặc nhờ thành viên khác tạo tài khoản), lấy một **User Access Token mới** và cập nhật đè vào trường `HUGGINGFACE_API_TOKEN` trong file `.env`.
> *   Hệ thống Next.js hiện tại đã được em cấu hình an toàn với mặc định là **FLUX.1-schnell** và dự phòng (fallback) sang **SD3 Medium**.

> [!WARNING]
> **Giải pháp 2 (Giải pháp lâu dài cho Production)**:
> *   Chuyển sang sử dụng các API trả phí tích hợp sẵn trong SDK Hugging Face (như **Fal.ai**, **Together AI**) bằng cách nạp API key tương ứng. Việc này sẽ cho phép Đại ca sử dụng lại toàn bộ các mô hình chuyên dụng chất lượng cực cao như **Animagine XL** và **Pony XL** mà không bị phụ thuộc vào dịch vụ serverless miễn phí hạn chế của Hugging Face.
