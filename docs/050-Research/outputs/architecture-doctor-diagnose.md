# BÁO CÁO ĐÁNH GIÁ CHUYÊN SÂU KIẾN TRÚC HỆ THỐNG (Architecture Health Report)

**Ngày đánh giá**: 2026-05-29  
**Người thực hiện**: Antigravity AI (Phân vai: Architecture Doctor)  
**Phạm vi**: Toàn bộ codebase (Text-to-Comic App Next.js)  
**Công cụ sử dụng**: Phân tích mã nguồn tĩnh, Kiểm thử Vitest, ESLint Linting, Next.js Production Build Validation  

---

## 1. TỔNG QUAN ĐIỂM SỐ SỨC KHỎE (Executive Summary)

**Điểm sức khỏe tổng thể: 82/100** ⚠️ (Mức độ tốt, tuy nhiên tồn tại lỗ hổng thiết kế nghiêm trọng trong lớp tích hợp đám mây)

| Tiêu chí | Điểm số | Trạng thái | Vấn đề cốt lõi phát hiện |
| :--- | :---: | :---: | :--- |
| **Tính Modular (Modularity)** | **92/100** | ✅ Tốt | Cấu trúc phân lớp App Router Next.js sạch sẽ, Client Hooks tách biệt tốt với logic Pure. |
| **Độ Kết Khối (Coupling)** | **65/100** | ⚠️ Cảnh báo | Có sự mismatch kiểu dữ liệu nghiêm trọng (ID String vs UUID) giữa Client Repository và Supabase Schema. |
| **Độ Kết Dính (Cohesion)** | **88/100** | ✅ Tốt | Các module chức năng đơn mục tiêu rõ ràng (`persistence.ts`, `indexeddb-storage.ts`, `export-renderer.ts`). |
| **Mức Độ Kiểm Thử (Test Coverage)** | **95/100** | ✅ Rất tốt | Hệ thống kiểm thử Vitest hoạt động hoàn hảo với 39/39 tests xanh lá, bao quát đầy đủ business logic. |
| **Tài Liệu Hóa (Documentation)** | **90/100** | ✅ Tốt | Cấu trúc tài liệu `docs/` được định nghĩa chuyên nghiệp (PRD, System Design, QA Test Plan, Demo Runbook). |
| **Bảo Mật Kiến Trúc (Security)** | **70/100** | ⚠️ Cảnh báo | Client-side sync giao tiếp trực tiếp PostgREST với API key lộ thiên thay vì định tuyến qua proxy an toàn. |

**Top 3 Vấn đề Cốt lõi:**
1. 🔴 **Lỗi Mismatch Kiểu Dữ Liệu UUID Trong Supabase Sync (Critical)**: Frontend tạo định dạng ID ngẫu nhiên dạng chuỗi `project-${Date.now()}` trong khi tầng Supabase Database bắt buộc kiểu `UUID`. Lệnh đồng bộ sẽ bị sập ngay lập tức (Runtime DB Error).
2. 🟡 **Direct Client-Side PostgREST DB Call (Security Gap)**: Lớp repository đồng bộ trực tiếp gọi Fetch đến API REST của Supabase từ trình duyệt với Anon Key, bỏ qua cơ chế lọc hoặc kiểm soát qua API Proxy Server/Next.js Server Actions.
3. 🟡 **IndexedDB Background Write Race Condition (Reliability)**: Phương thức `saveSnapshot` kích hoạt tiến trình ghi ảnh base64 bất đồng bộ xuống IndexedDB nhưng ngay lập tức trả về snapshot đã chỉnh sửa và lưu vào `localStorage` đồng bộ, có nguy cơ gây mất liên kết ảnh nếu người dùng đóng tab ngay sau khi thao tác.

---

## 2. 🔴 CÁC VẤN ĐỀ NGUY HỂM CẦN KHẮC PHỤC NGAY (Tier 1 - Fix This Sprint)

### Vấn đề C1: Lỗi Mismatch Kiểu Dữ Liệu UUID Trong Supabase Sync
- **Vị trí**: [supabase-repository.ts](file:///d:/2026DaiHoc/PhapChung/FinalApplication/lib/studio/supabase-repository.ts) & [schema.sql](file:///d:/2026DaiHoc/PhapChung/FinalApplication/supabase/schema.sql)
- **Kiểu lỗi**: Type Mismatch (String ID vs UUID Constraint)
- **Tác động**: Khi người dùng bật đồng bộ Supabase (`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` khả dụng), việc gửi payload chứa các ID có tiền tố dạng string (như `project-1`, `character-1716942800000`, `panel-...`) vào trường `UUID` sẽ gây lỗi cú pháp nghiêm trọng từ PostgreSQL: `invalid input syntax for type uuid`.

**Bằng chứng phân tích (Evidence):**
*Trong file [schema.sql](file:///d:/2026DaiHoc/PhapChung/FinalApplication/supabase/schema.sql#L7-L19):*
```sql
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  ...
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  ...
);
```
*Trong file [factories.ts](file:///d:/2026DaiHoc/PhapChung/FinalApplication/lib/studio/factories.ts#L18-L30):*
```typescript
export function createProject(projectId: string, storyTitle: string): Project {
  return {
    id: projectId, // Truyền string có tiền tố "project-" từ client
    title: storyTitle.trim(),
    ...
  };
}
```

**Ước lượng SQALE (SQALE Estimate):**
- **Chi phí khắc phục**: 2 ngày công (Refactor định dạng ID Client sử dụng standard v4 UUID + cập nhật unit tests).
- **Chi phí nếu trì hoãn**: 8 ngày công/quý (Sửa đổi thủ công các exception, hệ thống đồng bộ đám mây hoàn toàn tê liệt khi kết nối DB thật).
- **ROI**: Rất cao. Đảm bảo lớp DB hoạt động trơn tru 100%.

**Khuyến nghị điều trị**: **R3 Refactor**.
1. Tận dụng cơ chế `crypto.randomUUID()` tiêu chuẩn của trình duyệt/Node.js để khởi tạo các ID ngẫu nhiên trên Client thay thế cho phương pháp ghép chuỗi `${Date.now()}`.
2. Cập nhật các hàm sinh thực thể (Factories) để chỉ tạo mã UUID thuần túy không chứa tiền tố chữ.

---

## 3. 🟡 CÁC VẤN ĐỀ KIẾN TRÚC PHỤ (Tier 2 - Plan Next 1-3 Sprints)

### Vấn đề S1: Giao tiếp PostgREST trực tiếp từ Trình duyệt (Direct Client-Side Sync)
- **Vị trí**: [supabase-repository.ts](file:///d:/2026DaiHoc/PhapChung/FinalApplication/lib/studio/supabase-repository.ts)
- **Kiểu lỗi**: Security Gap / Architecture coupling
- **Tác động**: Mặc dù dùng Anon Key là cơ chế mặc định của Supabase kết hợp RLS, việc thực hiện hàng loạt API `fetch` trực tiếp từ client đến database thô mà không thông qua một tầng trung gian (API Router/Next.js Server Actions) làm lộ cấu trúc vật lý của cơ sở dữ liệu trên Client DevTools Network. Việc này tạo rủi ro lạm dụng hạn mức API và spam dữ liệu rác.
- **Ước lượng SQALE**: 1.5 ngày công để đóng gói logic đồng bộ thành Next.js Server Action hoặc API Route, bổ sung cơ chế kiểm duyệt dữ liệu (Sanitization).
- **Khuyến nghị R**: **R4 Rearchitect** (Chuyển đổi sang Server-Driven Sync).

### Vấn đề S2: Race Condition trong Ghi Ảnh IndexedDB Bất Đồng Bộ
- **Vị trí**: [persistence.ts](file:///d:/2026DaiHoc/PhapChung/FinalApplication/lib/studio/persistence.ts#L228-L281)
- **Kiểu lỗi**: Asynchronous Side-effect Race Condition
- **Tác động**: Trong hàm `extractAndSaveBase64Images`, việc nhập bất đồng bộ thư viện `indexeddb-storage` và gọi `writeImage` diễn ra ở chế độ nền (Fire and Forget) mà không được đợi (`await`). Trong khi đó, `saveSnapshot` vẫn chạy đồng bộ và lưu trữ ngay lập tức. Nếu trình duyệt bị tắt đột ngột trước khi IndexedDB ghi xong, dữ liệu snapshot trong `localStorage` sẽ trỏ đến một con trỏ ảnh ảo `indexeddb://panel-image-X` không tồn tại, gây mất liên kết ảnh.
- **Ước lượng SQALE**: 1 ngày công để chuyển đổi toàn bộ pipeline save thành asynchronous (`async/await`) để đảm bảo ảnh được lưu trữ an toàn trong IndexedDB trước khi pointer được cam kết vào Local Storage.
- **Khuyến nghị R**: **R3 Refactor**.

---

## 4. 🟢 NỢ KỸ THUẬT ĐƯỢC CHẤP NHẬN (Tier 3 - Backlog)

| Mã số | Mô tả chi tiết | Vị trí ảnh hưởng | Mức độ/Ước tính |
| :--- | :--- | :--- | :---: |
| **D-1** | Bubble Text Canvas Overflow: Nếu chữ quá dài vượt giới hạn bong bóng, text sẽ bị tràn ra ngoài biên bong bóng thoại khi vẽ canvas PNG. | [export-renderer.ts](file:///d:/2026DaiHoc/PhapChung/FinalApplication/lib/studio/export-renderer.ts#L197) | Thấp (0.5 ngày công) |
| **D-2** | Sequential Generation Block: Tiến trình sinh ảnh panel (`generateAll`) thực hiện tuần tự để tránh timeout server, nhưng có thể gây cảm giác chậm cho người dùng. | [usePanelActions.ts](file:///d:/2026DaiHoc/PhapChung/FinalApplication/hooks/usePanelActions.ts) | Trung bình (1 ngày công) |

---

## 5. CÁC ĐIỂM SÁNG KIẾN TRÚC XUẤT SẮC (Positive Findings)

- **Cực kỳ tối ưu dung lượng LocalStorage**: Chiến lược tách Base64 ảnh lớn ra khỏi `localStorage` và lưu trữ vào IndexedDB thông qua pointers (`indexeddb://...`) là một thiết kế **xuất sắc**. Giải pháp này giải quyết triệt để giới hạn 5MB của LocalStorage mà vẫn giữ nguyên được hiệu năng đọc/ghi.
- **Cấu hình Fallback an toàn (Safety Net)**: Hệ thống cung cấp cơ chế deterministic fallback khi chưa cài đặt biến môi trường AI. Ứng dụng tự tạo storyboard phân đoạn từ văn bản thật của người dùng (`createMockPanels` trong `utils.ts`) chứ không sử dụng kịch bản cứng, giúp buổi demo đồ án luôn mượt mà.
- **Kiểm thử bao phủ rộng (Green Safety Net)**: Hệ thống có 39/39 test cases bao phủ toàn bộ lớp persistence, utils và export rendering. Thời gian chạy cực nhanh (~720ms) giúp nhà phát triển tự tin kiểm thử liên tục.
- **Zero Lint Errors**: Mã nguồn vượt qua kiểm định ESLint nghiêm ngặt với 0 lỗi cảnh báo, thể hiện tính kỷ luật và nhất quán cực tốt trong viết code.
- **Turbopack Build Tốc Độ Cao**: Quá trình biên dịch Next.js 16 Production Build thành công tuyệt đối chỉ trong vài giây, chứng tỏ cấu trúc cây import sạch và không có memory leak hay lỗi kiểu dữ liệu lúc compile.

---

## 6. KIẾN NGHỊ LỘ TRÌNH ĐIỀU TRỊ (Roadmap Khuyến Nghị)

### Thực hiện ngay lập tức (Sprint này)
1. **Khắc phục lỗi UUID Mismatch**:
   - Thay thế toàn bộ mã sinh chuỗi ID tiền tố bằng chuẩn UUID v4 trong các file `factories.ts`, `persistence.ts`.
   - Cập nhật các mock data trong `mock-data.ts` và dữ liệu so khớp trong file tests để đảm bảo toàn bộ unit tests hoạt động ổn định.
2. **Khắc phục Race Condition của IndexedDB**:
   - Refactor `saveSnapshot` thành hàm bất đồng bộ. Sử dụng `await Promise.all` đợi toàn bộ tiến trình lưu binary ảnh hoàn tất rồi mới ghi snapshot trỏ đến IndexedDB vào local storage.

### Kế hoạch trung hạn (1-2 Sprints tiếp theo)
3. **Bọc Lớp Bảo Mật Sync (Next.js Server Actions)**:
   - Viết các Server Actions trong Next.js (chạy phía server) để đảm nhận việc giao tiếp với Supabase.
   - Client thay vì dùng trực tiếp endpoint PostgREST thô sẽ gọi qua Server Action. Cách này vừa ẩn giấu schema vừa tăng cường bảo mật RLS trên server side.

### Kế hoạch dài hạn
4. **Bổ sung AI Quota & Consistent Character Seed**:
   - Lưu trữ seed ngẫu nhiên cố định cho nhân vật khi tạo storyboard để các panel tiếp theo giữ nguyên được tạo hình quần áo/khuôn mặt của nhân vật.
