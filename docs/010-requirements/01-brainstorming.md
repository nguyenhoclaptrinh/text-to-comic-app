---
id: BRN-001
type: brainstorm
status: reviewed
created: 2026-05-15
updated: 2026-05-17
---

# Ý tưởng Đồ án: Text-to-Comic App

## 1. Core Problem

Người dùng có truyện chữ nhưng không có thời gian, kỹ năng vẽ hoặc ngân sách thuê họa sĩ để tạo bản truyện tranh minh họa. Với đồ án sinh viên, sản phẩm cần vừa có tính trình diễn AI rõ ràng, vừa đủ thực tế để không chỉ là demo gọi API.

Các thách thức chính:
- **Chi phí AI:** Cần tối ưu để demo trong free tier/Colab, nhưng không được coi "0đ mãi mãi" là cam kết production.
- **Character consistency:** Nhân vật cần nhất quán ở mức chấp nhận được qua prompt/reference; IP-Adapter/ControlNet là mục tiêu nâng cao.
- **Khả năng kiểm soát:** AI có thể sai, nên người dùng phải sửa storyboard, regenerate panel và chỉnh speech bubble.
- **Độ ổn định demo:** Colab/ngrok/free API có thể offline, quota hoặc timeout; sản phẩm phải lưu trạng thái để retry.

## 2. Product Direction Options

### Hướng 1: Semi-Automated Comic Creator
- **Cách hoạt động:** Người dùng nhập text, AI chia cảnh và lời thoại, người dùng tự review và bấm tạo từng ảnh.
- **Ưu điểm:** Ít rủi ro, dễ kiểm soát lỗi, phù hợp MVP nhỏ.
- **Nhược điểm:** Ít cảm giác "AI magic", thao tác thủ công nhiều.

### Hướng 2: Auto-Pipeline with Human-in-the-loop (Khuyến nghị)
- **Cách hoạt động:** Người dùng nhập truyện, AI tạo storyboard, hệ thống có thể render nhiều panel theo tuần tự, người dùng chỉnh prompt/dialogue/bubble và regenerate panel lỗi.
- **Ưu điểm:** Cân bằng tốt giữa wow factor và tính khả thi; đúng bản chất sản phẩm sáng tạo có AI hỗ trợ.
- **Nhược điểm:** Cần xử lý trạng thái async, lỗi AI, lưu dữ liệu và UI editor phức tạp hơn.

### Hướng 3: AI Comic Publishing Platform
- **Cách hoạt động:** Nền tảng giống Webtoon: publish, đọc, like, comment, follow, monetization, train LoRA riêng.
- **Ưu điểm:** Tầm nhìn lớn.
- **Nhược điểm:** Quá rộng cho đồ án 5 tuần, chi phí và rủi ro kỹ thuật cao.

## 3. Trade-off Analysis

| Phương án | Dev Cost | Money Cost | UX Value | Stability | Risk |
| --- | --- | --- | --- | --- | --- |
| Hướng 1 | Thấp | Thấp | Khá | Cao | Thấp |
| Hướng 2 | Trung bình | Thấp nếu dùng free tier/Colab | Cao | Trung bình | Vừa |
| Hướng 3 | Rất cao | Cao | Rất cao | Thấp | Rất cao |

**Decision:** Chọn Hướng 2, nhưng triển khai theo MVP chặt: text -> storyboard -> edit -> generate panel -> speech bubble -> export PNG dọc. Các phần platform/social/monetization/LoRA nằm ngoài scope.

## 4. MVP Feature Set

### Must-Have
1. **Text Import & Project Draft:** Tạo project từ title và truyện chữ.
2. **AI Storyboard:** LLM tách thành panel JSON gồm scene prompt, character, dialogue.
3. **Storyboard Editor:** Người dùng sửa prompt/dialogue trước khi vẽ.
4. **Panel Image Generation:** Tạo ảnh từng panel, có Generate All tuần tự.
5. **Regenerate Panel:** Tạo lại riêng một panel lỗi.
6. **Manual Speech Bubble:** Thêm/sửa/xóa/kéo bubble thủ công.
7. **Webtoon PNG Export:** Xuất dải ảnh dọc gồm panel và bubble.
8. **Error Handling:** Quota, timeout, policy block, Colab offline, JSON parse error.

### Should-Have
1. **Dashboard:** Xem project đang làm dở.
2. **Auth:** Supabase Auth cơ bản.
3. **Character Casting:** Lưu tên, mô tả, ảnh mẫu nhân vật.
4. **PDF Export:** Xuất PDF nếu còn thời gian.

### Could-Have
1. **Style Selection:** Manga, webtoon, western comic.
2. **Smart Bubble Suggestion:** Gợi ý vị trí bubble trên vùng trống.
3. **Batch Retry:** Retry các panel lỗi.

## 5. AI & Free-Tier Strategy

### Text-to-Storyboard
- Dùng Gemini Flash model hiện có trong Google AI Studio/Gemini API.
- Bắt buộc JSON schema để giảm lỗi parse.
- Có fallback: retry prompt sửa JSON hoặc cho người dùng sửa thủ công.

### Text-to-Image
- **Basic path:** Hugging Face/Inference Providers hoặc API image generation free-credit nếu còn quota.
- **Advanced demo path:** Google Colab chạy ComfyUI/Stable Diffusion qua ngrok/cloudflared.
- **Product expectation:** Không cam kết backend image luôn online; storyboard và prompt phải được lưu để generate lại sau.

### Character Consistency
- MVP: dùng character description + reference image URL trong prompt.
- Advanced: IP-Adapter/ControlNet trên Colab nếu kịp.
- Không cam kết 100% giống mặt ở mọi panel.

## 6. Recommended Demo Script

1. Người dùng tạo project và dán đoạn truyện 500-1.500 từ.
2. Bấm "Analyze Story" để tạo storyboard.
3. Sửa prompt/dialogue của 1 panel để chứng minh human-in-the-loop.
4. Generate từng panel hoặc Generate All.
5. Regenerate một panel lỗi.
6. Thêm speech bubble và kéo vị trí.
7. Export PNG dọc.
8. Giải thích fallback khi image backend offline/quota.

## 7. Product Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Free tier thay đổi/quota thấp | Demo gián đoạn | Chuẩn bị data mock/cache ảnh demo, hỗ trợ retry |
| Colab/ngrok offline | Không tạo ảnh được | Lưu storyboard, báo AI Image Offline, cho dùng ảnh mẫu |
| LLM trả JSON lỗi | UI không render được | JSON schema, validation, retry, manual fallback |
| Character không nhất quán | Giảm chất lượng demo | Character description/reference, regenerate, giải thích giới hạn |
| Scope quá rộng | Không hoàn thành | Khóa MVP Must-Have, đẩy Should/Could sang bonus |
| Export lỗi layout | Demo cuối không trọn vẹn | Ưu tiên PNG dọc trước PDF |

## 8. Final Recommendation

Sản phẩm nên được trình bày là **AI-assisted comic creation tool**, không phải hệ thống tự động tạo truyện tranh hoàn hảo. Giá trị chính là pipeline có kiểm soát: AI giúp tạo bản nháp nhanh, còn người dùng quyết định chỉnh sửa và xuất bản.
