---
id: IMP-003
type: implementation-plan
status: draft
created: 2026-06-15
updated: 2026-06-15
---   

# Review Plan: Character Sync And English Output

## 1. Mục tiêu review

Tài liệu này gom các yêu cầu cần sửa trước khi chốt luồng demo:

1. Verify nhánh `Ngan` đã fix đúng việc cập nhật nhân vật rồi mới merge `master`.
2. Fix luồng generate ảnh để prompt đi sang model bằng tiếng Anh.
3. Cho phép nhập truyện tiếng Việt hoặc ngôn ngữ khác, nhưng output truyện tranh chuẩn hóa sang tiếng Anh.
4. Giữ khả năng để người dùng tự sửa lời thoại hiển thị trên ảnh, bao gồm nhập lại tiếng Việt thủ công.
5. Chốt quyết định phạm vi “English-only” để tránh sửa lan man UI.

## 2. Hiện trạng kỹ thuật

### 2.1. Luồng storyboard

- `app/api/storyboard/route.ts` gọi `generateMultiPageStoryboard()`.
- `lib/server/gemini-storyboard.ts` đang prompt Gemini bằng tiếng Anh, nhưng chưa ép output `scenePrompt`, `dialogue`, `character.description` phải là tiếng Anh.
- Schema hiện tại vẫn dùng enum tiếng Việt cho `gender` và `role` trong `lib/studio/api-contracts.ts`, nhưng đã có mapping chấp nhận cả English lẫn Vietnamese input.
- `lib/studio/storyboard.ts` tạo bubble mặc định trực tiếp từ `panel.dialogue`.

Hệ quả:

- Người dùng nhập truyện tiếng Việt thì storyboard AI có thể trả `scenePrompt` và `dialogue` bằng tiếng Việt.
- Khi đó image prompt phụ thuộc vào lớp dịch ở bước generate ảnh, không phải từ source dữ liệu chuẩn.

### 2.2. Luồng generate ảnh

- `lib/server/image-generation.ts` đã có `translateRequestToEnglish()`.
- Hàm này chỉ dịch `panel.scenePrompt` và `character.description` sang tiếng Anh trước khi tạo prompt ảnh.
- Prompt ảnh cũng đã cấm model vẽ text/speech bubble trực tiếp.

Hệ quả:

- Đây mới là lớp “chữa cháy” ở thời điểm generate ảnh.
- Nếu translation fail hoặc không có `GEMINI_API_KEY`, prompt ảnh vẫn có thể còn tiếng Việt.
- Character consistency phụ thuộc mạnh vào việc `character.description` trong state có được cập nhật đúng và có được truyền vào generate-all hay không.

### 2.3. Luồng lời thoại trên ảnh

- `components/studio/EditablePanelText.tsx` cho sửa `panel.dialogue`.
- `lib/studio/factories.ts` và `lib/studio/storyboard.ts` tự tạo bubble từ `panel.dialogue`.
- `components/studio/BubbleTools.tsx` đã cho chỉnh text bubble thủ công trong Comic Editor.

Kết luận:

- Yêu cầu số 4 thực tế đã có nền tảng.
- Phần cần làm thêm chủ yếu là làm rõ UX và tránh để bubble bị ghi đè ngoài ý muốn sau khi user tự sửa.

## 3. Quyết định đề xuất

### 3.1. Khuyến nghị chính

Không nên đổi toàn bộ app sang tiếng Anh ở UI lúc này.

Nên chốt quy tắc sau:

- Input truyện: chấp nhận tiếng Việt hoặc ngôn ngữ khác.
- Output AI nội bộ cho storyboard: chuẩn hóa sang tiếng Anh cho `scenePrompt`, `dialogue`, `character.description`.
- Prompt generate ảnh: luôn là tiếng Anh.
- Text hiển thị trên bubble: cho phép user tự sửa tự do, bao gồm tiếng Việt.
- UI chrome hiện tại: giữ nguyên tiếng Việt để không làm phát sinh nhiều regression.

Lý do:

- Đây là phương án nhỏ nhất nhưng giải quyết đúng 3 vấn đề quan trọng: chất lượng ảnh, tính ổn định character, và quyền chỉnh lời thoại.
- Nếu đổi toàn bộ UI/content sang tiếng Anh, phạm vi sẽ lan sang label, empty state, error copy, test snapshot và tài liệu demo.

### 3.2. Quyết định cho mục số 5

Khuyến nghị chọn:

`Không chỉnh tất cả thành tiếng Anh. Chỉ chuẩn hóa AI output và image prompt sang tiếng Anh; phần bubble cho user nhập tự do.`

## 4. Những chỗ cần sửa

### 4.1. Verify và merge nhánh `Ngan`

Mục tiêu:

- Xác nhận fix “cập nhật nhân vật” thật sự đi tới bước generate-all.

Checklist review trên nhánh `Ngan`:

1. Sửa character trong Character Casting.
2. Kiểm tra state `characters` mới có đi xuống `StoryboardPanelCard` và `generatePanelImage()` hay không.
3. Chạy “Generate all” với một truyện có 1 nhân vật xuất hiện nhiều panel.
4. So ảnh giữa các panel để xác nhận mặt/đặc điểm nhân vật bám đúng description mới.
5. Nếu pass mới merge vào `master`.

File cần soi khi review:

- `lib/studio/ai-services.ts`
- `lib/server/image-generation.ts`
- `components/studio/StoryboardPanelCard.tsx`
- `components/studio/CharacterCastingPanel.tsx`
- `hooks/usePanelActions.ts`
- `hooks/useCastingState.ts`

Lưu ý:

- Vì sandbox hiện tại không cho mình xác nhận branch list bằng lệnh `git branch`, tài liệu này xem `Ngan` là nhánh cần manual verify trước merge.

### 4.2. Ép storyboard output sang tiếng Anh

Sửa tại:

- `lib/server/gemini-storyboard.ts`

Việc cần làm:

1. Cập nhật `createStoryboardPrompt()` để yêu cầu:
   - `scenePrompt` phải bằng English.
   - `dialogue` phải bằng English.
   - `character.description` phải bằng English.
2. Cập nhật `createRepairPrompt()` để giữ nguyên rule English-only nếu Gemini trả JSON lỗi.
3. Nếu cần độ ổn định cao hơn, thêm bước normalize/translate sau parse thành công trước khi trả về UI.

Kết quả mong muốn:

- Người dùng có thể paste truyện tiếng Việt.
- Storyboard output trong state vẫn là English, giúp downstream ổn định hơn.

### 4.3. Ép image prompt luôn là tiếng Anh

Sửa tại:

- `lib/server/image-generation.ts`

Việc cần làm:

1. Giữ `translateRequestToEnglish()` như lớp safety net.
2. Mở rộng translation nếu cần cho các field khác được đưa vào prompt sau này.
3. Bổ sung test cho case:
   - input tiếng Việt
   - translation thành công
   - request gửi sang Hugging Face / Imagen chứa English prompt

Kết quả mong muốn:

- Dù storyboard upstream có lệch, prompt ảnh cuối cùng vẫn cố định bằng English.

### 4.4. Giữ bubble text cho user tự sửa bằng tiếng Việt

Sửa tại:

- `components/studio/BubbleTools.tsx`
- `components/studio/EditablePanelText.tsx`
- `lib/studio/factories.ts`
- `lib/studio/storyboard.ts`

Việc cần làm:

1. Rà lại logic sinh bubble mặc định để không ghi đè bubble đã bị user sửa tay.
2. Nếu `panel.dialogue` đổi sau khi bubble đã tồn tại, cần chốt rule:
   - hoặc không auto-sync bubble nữa,
   - hoặc chỉ sync khi bubble đang ở trạng thái auto-generated.
3. Đổi copy hướng dẫn cho rõ hơn: ảnh không tự chứa text, lời thoại nằm ở bubble overlay và có thể sửa thủ công.

Khuyến nghị:

- Sau khi user đã có bubble riêng, không tự động ghi đè text bubble từ `panel.dialogue`.

## 5. Kế hoạch thực hiện

### Phase 1. Review nhánh `Ngan`

- Pull nhánh `Ngan`.
- Smoke test sửa nhân vật -> generate all.
- Nếu pass, merge `Ngan` vào `master`.
- Nếu fail, ghi rõ bug là do state không cập nhật, mapping `characterIds`, hay prompt không phản ánh description mới.

### Phase 2. Chuẩn hóa English output cho storyboard

- Update prompt trong `lib/server/gemini-storyboard.ts`.
- Bổ sung test cho input Vietnamese nhưng output schema parse vẫn hợp lệ và content expected là English.

### Phase 3. Khóa English prompt cho image generation

- Giữ translation layer hiện tại.
- Bổ sung test request tiếng Việt sang prompt tiếng Anh.
- Xác minh Hugging Face và Imagen cùng nhận prompt tiếng Anh.

### Phase 4. Chốt rule bubble editing

- Ngăn bubble text bị overwrite sau khi user chỉnh tay.
- Giữ khả năng user nhập tiếng Việt vào bubble.
- Rà lại Comic Editor để copy/hint phản ánh đúng hành vi này.

## 6. Test và review checklist

### 6.1. Functional

1. Nhập truyện tiếng Việt.
2. Generate storyboard.
3. Xác nhận `scenePrompt` và `dialogue` trong panel ra tiếng Anh.
4. Generate 1 panel và Generate all.
5. Xác nhận prompt ảnh đi bằng tiếng Anh.
6. Chỉnh lời thoại bubble thành tiếng Việt.
7. Export ảnh và xác nhận bubble tiếng Việt vẫn hiển thị đúng.

### 6.2. Regression

1. Không làm hỏng flow fallback khi không có API key.
2. Không làm mất bubble cũ khi reload.
3. Không làm hỏng panel export.
4. Không làm hỏng manual character editing.

## 7. Phạm vi merge đề xuất

Nên chia thành 2 PR để review dễ hơn:

### PR A: Character sync verification + merge `Ngan`

- Chỉ xử lý bug nhân vật và smoke test generate-all.
- Không trộn với đổi language rules.

### PR B: English output policy

- Storyboard English output.
- English image prompt enforcement.
- Bubble manual-edit rule.

Lý do:

- Nếu gộp chung, rất khó biết lỗi ảnh là do character sync hay do đổi prompt/language.

## 8. Kết luận

Phương án ít rủi ro nhất là:

- Verify và merge fix nhân vật từ nhánh `Ngan` trước.
- Sau đó chuẩn hóa AI output sang tiếng Anh ở tầng storyboard.
- Giữ translation ở tầng generate ảnh như lớp dự phòng.
- Không đổi toàn bộ UI sang tiếng Anh.
- Cho phép bubble text được sửa thủ công bằng tiếng Việt.
