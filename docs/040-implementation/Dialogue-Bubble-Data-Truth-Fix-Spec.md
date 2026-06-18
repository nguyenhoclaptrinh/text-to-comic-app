---
id: IMP-004
type: fix-spec
status: draft
created: 2026-06-15
updated: 2026-06-15
---

# Fix Spec: Dialogue, Bubble, Character, And Fallback Data Truth

## 1. Mục tiêu

Spec này khóa chặt rule dữ liệu để xử lý 2 vấn đề:

1. Chữ trong vùng chỉnh `dialogue` và chữ hiển thị trên bubble/ảnh/export không được lệch nhau do app tự đồng bộ sai.
2. App không được tự bịa thêm nội dung story-related khi không có nguồn dữ liệu rõ ràng từ user hoặc AI.

## 2. Nguyên tắc nguồn dữ liệu

### 2.1. Bubble text là nguồn hiển thị cuối cùng

- `panel.bubbles[].text` là nguồn duy nhất để render chữ lên:
  - Comic Editor
  - Export preview
  - PNG/PDF export
- Không có thành phần nào được render chữ hiển thị cuối cùng từ `panel.dialogue`.

### 2.2. `panel.dialogue` không phải nguồn render cuối

- `panel.dialogue` là dữ liệu thoại ở mức storyboard/panel.
- `panel.dialogue` được dùng cho:
  - hiển thị trong Storyboard editor
  - làm ngữ cảnh cho AI image prompt
  - seed bubble ban đầu khi panel mới được tạo
- `panel.dialogue` không được nhúng trực tiếp lên fallback image.

### 2.3. Bubble chỉ được auto-seed, không được auto-overwrite bừa

- Khi panel mới được AI/fallback tạo ra và có `dialogue`, app được phép seed 1 bubble ban đầu từ chính `dialogue`.
- Sau khi user sửa bubble, app không được tự overwrite bubble đó khi `panel.dialogue` thay đổi.
- Heuristic sync hợp lệ duy nhất:
  - nếu panel có đúng 1 bubble
  - và `bubble.text` hiện tại vẫn đúng bằng `panel.dialogue` cũ
  - thì khi `panel.dialogue` đổi, bubble này được coi là chưa bị user chỉnh tay và có thể sync theo.
- Nếu điều kiện trên không thỏa, bubble phải giữ nguyên.

### 2.4. Không tự bịa story content

Trong flow chính, app không được tự sinh:

- speaker giả như `"Speaker"`
- character profile suy đoán từ `characterIds`
- gender suy luận từ tên/ngữ cảnh khi AI không trả
- character description dạng tóm tắt nội bộ như `"Nhân vật X xuất hiện trong N khung hình"`

Cho phép duy nhất:

- placeholder editor cho page/panel trống do user chủ động thêm tay
- panel/page scaffolding kỹ thuật không được gắn nhãn như dữ liệu truyện thật

## 3. Rule chi tiết theo field

### 3.1. `panel.dialogue`

- Là chuỗi thoại/storyboard gốc cho panel.
- Không bị app cắt speaker prefix khi tạo bubble seed.
- Nếu user sửa `dialogue`, giá trị này được lưu đúng nguyên văn.

### 3.2. `bubble.text`

- Là chữ hiển thị thực tế lên panel/export.
- Bubble seed ban đầu lấy đúng từ `panel.dialogue.trim()`.
- Sau khi user sửa bubble, `bubble.text` trở thành source of truth cho hiển thị và không bị app sửa lại trừ khi user sửa trực tiếp bubble đó.

### 3.3. `panel.imageUrl`

- Nếu là ảnh AI thật: ảnh không được chứa speech bubble text do app render.
- Nếu là fallback SVG: ảnh không được nhúng `panel.dialogue` hay nội dung thoại nào.

### 3.4. `characters`

- Nếu AI route trả `characters`, app dùng danh sách đó.
- Nếu AI route không trả `characters`, app để danh sách nhân vật rỗng hoặc giữ danh sách đã có do user nhập tay.
- Không tự suy luận `name`, `gender`, `role`, `description` từ `characterIds`.

## 4. Hành vi mong muốn

### 4.1. Khi tạo storyboard từ AI

- `panel.dialogue` được tạo từ AI response.
- nếu `dialogue` không rỗng, app seed 1 bubble với `bubble.text === panel.dialogue.trim()`.

### 4.2. Khi tạo storyboard bằng fallback panel parser

- App chỉ lấy `dialogue` nếu parser trích được trực tiếp từ input.
- Nếu quote không xác định được speaker, không tự gắn `"Speaker"`.
- Nếu không trích được dialogue, để `dialogue = ""`.

### 4.3. Khi user sửa `dialogue`

- `panel.dialogue` được cập nhật.
- Bubble chỉ sync theo nếu bubble vẫn còn ở trạng thái seed ban đầu theo rule 2.3.

### 4.4. Khi user sửa bubble text

- Chỉ `bubble.text` thay đổi.
- `panel.dialogue` không bị app tự sửa ngược.

### 4.5. Khi generate ảnh

- API image generation dùng `panel.dialogue` làm scene/dialogue context cho model.
- Kết quả patch trả về không được tự tạo bubble mới từ `panel.dialogue` nếu panel chưa có bubble.
- Bubble là phần editor/export concern, không phải side effect của image generation.

## 5. Các file phải tuân thủ spec này

- `lib/studio/utils.ts`
- `lib/studio/factories.ts`
- `lib/studio/storyboard.ts`
- `lib/studio/ai-services.ts`
- `lib/studio/cached-images.ts`
- `hooks/usePanelActions.ts`
- `hooks/useComicStudioState.ts`
- `components/studio/ComicPanelCanvas.tsx`
- `components/studio/ExportModal.tsx`
- `lib/studio/export-renderer.ts`

## 6. Acceptance criteria

1. Fallback image không còn chứa dialogue text.
2. Comic preview, export preview, PNG/PDF export đều chỉ lấy bubble text để render chữ.
3. Sửa `dialogue` không được ghi đè bubble đã bị user sửa tay.
4. Không còn heuristic tự sinh `"Speaker"` khi không biết speaker.
5. Không còn flow tự dựng character profile khi AI không trả characters.
6. Các test phải cover:
   - bubble seed ban đầu từ dialogue
   - bubble manual edit không bị overwrite
   - fallback image không chứa dialogue
   - fallback quote không tự chèn speaker giả
