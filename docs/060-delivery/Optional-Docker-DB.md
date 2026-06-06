---
id: DEL-004
type: architecture-note
status: draft
created: 2026-06-07
---

# Optional Docker DB Path

## Quyết Định Hiện Tại

Production demo mặc định vẫn dùng local-first storage. Docker DB không bắt buộc
để chạy app, vì mục tiêu chính là demo ổn định trên một máy và không phụ thuộc
dịch vụ ngoài.

## Khi Nào Nên Bật Docker DB

Chỉ triển khai Docker DB nếu cần:

- Demo multi-browser hoặc multi-user.
- Kiểm thử Supabase/Postgres persistence thật.
- Chuẩn bị self-host dài hạn.
- Cần backup server-side thay vì backup JSON thủ công.

## Mô Hình Dữ Liệu Đề Xuất

```mermaid
erDiagram
    PROJECT ||--o{ PAGE : has
    PAGE ||--o{ PANEL : contains
    PANEL ||--o{ BUBBLE : overlays
    PROJECT ||--o{ CHARACTER : defines
    PANEL }o--o{ CHARACTER : references

    PROJECT {
      uuid id PK
      text title
      text original_text
      text status
      text style
      timestamptz created_at
      timestamptz updated_at
    }

    PAGE {
      uuid id PK
      uuid project_id FK
      int order_index
      text title
    }

    PANEL {
      uuid id PK
      uuid project_id FK
      uuid page_id FK
      int order_index
      text scene_prompt
      text dialogue
      text status
      text image_url
      int seed
      text style
    }

    BUBBLE {
      uuid id PK
      uuid panel_id FK
      text text
      numeric x
      numeric y
      numeric width
      numeric height
    }

    CHARACTER {
      uuid id PK
      uuid project_id FK
      text name
      text role
      text description
      text color
    }
```

## Docker Compose Gợi Ý

Không commit bắt buộc trong baseline. Nếu cần, tạo `docker-compose.local-db.yml`
riêng:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: text_to_comic
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/schema.sql:/docker-entrypoint-initdb.d/001-schema.sql:ro

volumes:
  postgres_data:
```

## Migration Strategy

1. Giữ `StudioSnapshot` là contract nội bộ.
2. Viết adapter `PostgresStudioRepository` hoặc hoàn thiện
   `SupabaseStudioRepository`.
3. Mapping từ snapshot sang relational:
   - `projects[]` -> `projects`
   - `pages[]` -> `pages`
   - `page.panels[]` -> `panels`
   - `panel.bubbles[]` -> `bubbles` hoặc `panels.speech_bubbles`
   - `characters[]` -> `characters`
4. Local-first vẫn là fallback khi DB offline.

## Guardrails

- Không dùng DB local nếu chưa có E2E save/load.
- Không bật auth/multi-user giữa buổi demo.
- Không lưu API key người dùng vào DB.
- Backup JSON vẫn phải hoạt động ngay cả khi DB có lỗi.
