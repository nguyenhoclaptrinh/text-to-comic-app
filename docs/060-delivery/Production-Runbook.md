---
id: DEL-003
type: runbook
status: draft
created: 2026-06-07
---

# Production Runbook: Local-First Demo Deployment

## Mục Tiêu

Chạy Text-to-Comic Studio như một bản demo production ổn định, ưu tiên dữ liệu
local-first. Người dùng vẫn có thể tạo storyboard, vẽ ảnh fallback, chỉnh bong
bóng thoại và xuất PNG kể cả khi chưa cấu hình AI thật.

## Chiến Lược Dữ Liệu

- Nguồn chính: `localStorage` lưu `StudioSnapshot`.
- Ảnh base64 lớn: IndexedDB lưu ảnh, snapshot chỉ giữ `indexeddb://...`.
- Backup thủ công: Settings -> `Dữ liệu của bạn` -> `Tải backup`.
- Restore thủ công: Settings -> `Dữ liệu của bạn` -> `Khôi phục`.
- Cloud/Supabase: optional, không bắt buộc cho demo production.

## Environment

Copy `.env.example` thành `.env.local`.

Required cho local-first:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_SUPABASE_SYNC=false
```

Optional AI:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
IMAGE_BACKEND_URL=
HUGGINGFACE_API_TOKEN=
```

Optional Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Build Và Run

```bash
npm ci
npm run build
npm run start
```

Mở `http://localhost:3000`.

## Pre-Demo Checklist

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

Manual checks:

- Settings hiển thị trạng thái AI provider.
- Tạo project mới từ `Nhập truyện`.
- Vẽ ít nhất một khung.
- Thêm một bong bóng thoại.
- Tải PNG từ `Xuất file`.
- Tải backup JSON và thử restore trên tab/trình duyệt khác nếu có thời gian.

## Backup / Restore

Backup file có dạng:

```json
{
  "app": "text-to-comic",
  "exportedAt": "2026-06-07T00:00:00.000Z",
  "snapshot": {}
}
```

Khuyến nghị:

- Tải backup trước buổi bảo vệ.
- Giữ một backup mẫu trong thư mục ngoài repo.
- Không commit backup chứa API key hoặc dữ liệu cá nhân.

## Rollback

Nếu bản production demo lỗi:

1. Dừng server.
2. Checkout commit đã pass demo gần nhất.
3. Chạy `npm ci && npm run build && npm run start`.
4. Restore backup JSON trong Settings nếu localStorage trống.

## Known Limits

- Local-first chỉ bền trong cùng browser profile.
- Clear site data sẽ xóa snapshot local.
- Supabase sync hiện là optional proxy, chưa là nguồn dữ liệu chính.
- Không có auth/multi-user trong production demo local-first.
