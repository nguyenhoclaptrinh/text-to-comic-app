# Text-to-Comic App

Text-to-Comic App là nguyên mẫu Next.js giúp chuyển truyện chữ thành quy trình tạo truyện tranh/webtoon có thể chỉnh sửa. Dự án được tối ưu cho phần trình bày đồ án cuối kỳ: tạo project, phân tích văn bản thành storyboard, tạo hoặc tạo lại ảnh từng panel qua lớp dịch vụ AI có kiểm soát kiểu dữ liệu, chỉnh nhân vật và speech bubble, lưu tiến độ cục bộ, sau đó xuất ảnh PNG dọc.

## Mục Tiêu

Ứng dụng tập trung vào trải nghiệm **AI tạo bản nháp nhanh + người dùng chỉnh sửa có kiểm soát**. MVP không nhằm thay thế họa sĩ chuyên nghiệp, mà chứng minh một pipeline end-to-end gồm nhập truyện, tạo storyboard, sinh ảnh, chỉnh lời thoại và xuất thành sản phẩm có thể chia sẻ.

## Tính Năng MVP

- Dashboard project và luồng nhập truyện chữ.
- Storyboard Editor cho phép sửa scene prompt, lời thoại, trạng thái panel và chip nhân vật.
- Character Casting sidebar để chỉnh tên, vai trò và mô tả ngoại hình nhân vật.
- API storyboard sẵn sàng dùng Gemini, kèm fallback xác định khi chưa cấu hình API key.
- API tạo ảnh qua adapter, kèm fallback ảnh SVG cache khi chưa có image backend.
- Tạo ảnh từng panel, tạo lại từng panel và thao tác Generate All.
- Speech bubble editor hỗ trợ thêm, sửa, xóa và kéo thả vị trí.
- Lưu snapshot cục bộ bằng `localStorage`.
- Xuất PNG dọc, có cảnh báo khi thiếu ảnh panel.
- Bộ kiểm thử unit, coverage threshold, lint, format, build và audit gate.

## Công Nghệ

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest với V8 coverage
- Playwright E2E
- ESLint và Prettier

## Chạy Dự Án

Cài dependency:

```bash
npm install
```

Chạy môi trường phát triển:

```bash
npm run dev
```

Mở ứng dụng tại `http://localhost:3000`.

## Cấu Hình Môi Trường

Khi muốn dùng dịch vụ AI thật, tạo file `.env.local` từ `.env.example`:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
IMAGE_BACKEND_URL=
```

Nếu chưa cấu hình các biến này, ứng dụng vẫn chạy bằng dữ liệu fallback xác định. Cách này giúp demo đồ án hoạt động được cả khi không có API key, hết quota hoặc image backend đang offline.

## Luồng Demo Đề Xuất

1. Mở Dashboard hoặc Text Import.
2. Nhập tiêu đề và nội dung truyện ngắn.
3. Phân tích truyện để tạo danh sách storyboard panel.
4. Sửa scene prompt, lời thoại và mô tả nhân vật.
5. Tạo ảnh cho một panel hoặc chạy Generate All.
6. Mở Comic Editor, thêm hoặc kéo speech bubble.
7. Xuất PNG từ thanh công cụ.
8. Reload trình duyệt để chứng minh dữ liệu được lưu cục bộ.

## Kiểm Tra Chất Lượng

Các lệnh kiểm tra trước khi nộp hoặc demo:

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

## Phạm Vi Hiện Tại

Lớp AI đã có contract phía server và cơ chế fallback. Gemini có thể bật bằng `GEMINI_API_KEY`; image generation thật có thể bật bằng `IMAGE_BACKEND_URL`. Supabase Auth, Database và Storage hiện là kiến trúc mục tiêu được tài liệu hóa, chưa nằm trong baseline lưu trữ cục bộ của prototype.

## Tài Liệu Liên Quan

- `docs/010-requirements/PRD-TextToComic.md`
- `docs/020-architecture/SystemDesign.md`
- `docs/035-QA/Test-Plan.md`
- `docs/060-delivery/Demo-Runbook.md`
- `docs/060-delivery/Supabase-Setup.md`
- `docs/070-report/FinalReport.md`
- `docs/070-report/PresentationOutline.md`
