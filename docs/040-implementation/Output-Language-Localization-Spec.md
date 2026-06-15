---
id: IMP-005
type: fix-spec
status: draft
created: 2026-06-15
updated: 2026-06-15
---

# Spec: Output Language Localization

## 1. Mục tiêu

Thêm khả năng chọn ngôn ngữ đầu ra của truyện tranh mà không làm giảm chất lượng AI image generation và không làm mất nguồn dữ liệu chuẩn cho AI.

Phạm vi tính năng này:

- User có thể nhập truyện bằng ngôn ngữ bất kỳ.
- App xử lý nội bộ bằng tiếng Anh.
- User chọn ngôn ngữ đầu ra hiển thị của truyện là:
  - `English`
  - `Vietnamese`
- Prompt dùng cho AI image generation luôn là tiếng Anh.

## 2. Quyết định kiến trúc

### 2.1. Canonical language

Ngôn ngữ chuẩn nội bộ của app là `English`.

Tất cả dữ liệu dùng cho AI phải được chuẩn hóa về English:

- `scenePrompt`
- `dialogue`
- `character.description`

### 2.2. Display language

Ngôn ngữ đầu ra chỉ là lớp hiển thị cho user.

`displayLanguage` có 2 giá trị:

- `en`
- `vi`

### 2.3. Không dịch chồng trực tiếp lên canonical fields

Không được dùng cùng một field vừa làm canonical data vừa làm localized display.

Không được làm kiểu:

- user chọn `vi`
- app dịch `dialogue` sang tiếng Việt
- sau đó ghi đè luôn `dialogue`

Vì như vậy sẽ:

- phá prompt tiếng Anh cho AI
- gây drift khi đổi ngôn ngữ qua lại
- làm lệch giữa dữ liệu AI và dữ liệu hiển thị

## 3. Data model đề xuất

### 3.1. Project-level config

Thêm field cấu hình ở project:

- `outputLanguage: "en" | "vi"`

Ý nghĩa:

- quyết định ngôn ngữ hiển thị trong UI cho storyboard/comic text

### 3.2. Panel-level data

Giữ canonical fields hiện tại làm bản English chuẩn:

- `scenePrompt`
- `dialogue`

Thêm localized display fields song ngữ để hỗ trợ chuyển đổi tức thì ở client:

- `scenePromptDisplayEn?: string` (Mô tả cảnh tiếng Anh hiển thị)
- `scenePromptDisplayVi?: string` (Mô tả cảnh tiếng Việt hiển thị)
- `scenePromptDisplay?: string` (Dữ liệu hiển thị dự phòng/tương thích ngược)
- `dialogueDisplayEn?: string` (Lời thoại tiếng Anh hiển thị)
- `dialogueDisplayVi?: string` (Lời thoại tiếng Việt hiển thị)
- `dialogueDisplay?: string` (Lời thoại hiển thị dự phòng/tương thích ngược)

Rule:

- `scenePrompt` luôn là English canonical
- `dialogue` luôn là English canonical
- Chuyển đổi ngôn ngữ hiển thị sẽ đọc trực tiếp từ `...DisplayEn` hoặc `...DisplayVi` tương ứng.

### 3.3. Character-level data

Giữ canonical field hiện tại:

- `description`

Thêm:

- `descriptionDisplayEn?: string`
- `descriptionDisplayVi?: string`
- `descriptionDisplay?: string`

Rule:

- `description` luôn là English canonical
- Việc lấy mô tả nhân vật hiển thị dựa vào ngôn ngữ hiện tại của dự án qua helper `getCharacterDescriptionDisplay`.

### 3.4. Bubble-level data

Không thêm language field cho bubble ở phase đầu.

Rule:

- bubble là lớp hiển thị/edit thủ công
- bubble text được seed từ `dialogueDisplay` nếu có
- nếu user sửa bubble, bubble text trở thành source of truth hiển thị cuối cùng

## 4. Flow xử lý

### 4.1. Khi user nhập truyện

Input:

- `storyTitle`
- `storyText`
- `outputLanguage`

Nguyên tắc:

- Không cần ép user chọn ngôn ngữ input.
- Có thể nhập tiếng Việt, tiếng Anh, hoặc ngôn ngữ khác.

### 4.2. Storyboard generation flow

Flow đề xuất:

1. Server nhận `storyTitle`, `storyText`, `outputLanguage`.
2. Gemini tạo storyboard canonical bằng English.
3. Gemini trả:
   - panels English
   - characters English
4. Nếu `outputLanguage = "en"`:
   - `scenePromptDisplay = scenePrompt`
   - `dialogueDisplay = dialogue`
   - `descriptionDisplay = description`
5. Nếu `outputLanguage = "vi"`:
   - gọi Gemini translation step để dịch từ canonical English sang Vietnamese
   - ghi vào các field display tương ứng

### 4.3. Translation flow

Translation chỉ được thực hiện theo hướng:

- `canonical English -> display language`

Không làm:

- `display language -> canonical English` sau khi user đổi option

Lý do:

- canonical English phải luôn ổn định
- tránh loss khi dịch qua lại nhiều lần

### 4.4. Image generation flow

Image generation chỉ dùng canonical English fields:

- `panel.scenePrompt`
- `panel.dialogue`
- `character.description`

Không dùng:

- `scenePromptDisplay`
- `dialogueDisplay`
- `descriptionDisplay`

### 4.5. Bubble seeding flow

Khi panel mới được tạo:

- nếu có `dialogueDisplay`, bubble seed lấy từ `dialogueDisplay`
- nếu chưa có `dialogueDisplay`, bubble seed lấy từ `dialogue`

Sau đó bubble tuân theo spec dữ liệu đã chốt trước:

- user sửa bubble thì không bị app overwrite bừa

## 5. UI/UX behavior

### 5.1. Vị trí option

Thêm `Output language` ở khu vực import story hoặc project settings.

Phase đầu chỉ cần 2 lựa chọn:

- `English`
- `Vietnamese`

### 5.2. Storyboard editor

UI hiển thị:

- `scenePromptDisplay`
- `dialogueDisplay`

Nhưng khi cần generate ảnh:

- backend vẫn lấy canonical English fields

### 5.3. Character casting

UI hiển thị:

- `descriptionDisplay`

Nếu user sửa description trong UI, cần chốt một trong 2 chế độ:

1. Phase 1 đơn giản:
   - chỉ cho sửa canonical English
   - localized display sẽ regenerate lại từ canonical
2. Phase 2 nâng cao:
   - cho sửa theo display language rồi dịch ngược về English canonical

Khuyến nghị cho phase đầu:

- chỉ cho sửa canonical English trong editor chuyên sâu
- phần hiển thị localized là read-through/rendered view

### 5.4. Comic editor / bubble

Bubble phải hiển thị theo output language hiện tại.

Nếu user đổi `outputLanguage` sau khi storyboard đã tạo:

- chỉ auto-update những bubble còn ở trạng thái seed từ dialogue
- bubble user đã sửa tay thì không được overwrite

## 6. API changes

### 6.1. Storyboard request

Mở rộng request schema:

- `outputLanguage?: "en" | "vi"`

Default:

- `en`

### 6.2. Storyboard response

Mở rộng panel response với:

- `scenePromptDisplay?: string`
- `dialogueDisplay?: string`

Mở rộng character response với:

- `descriptionDisplay?: string`

### 6.3. Optional translation endpoint

Có 2 hướng triển khai:

1. Dịch ngay trong `/api/storyboard`
2. Tách endpoint riêng kiểu `/api/localize-storyboard`

Khuyến nghị phase đầu:

- dịch ngay trong `/api/storyboard`

Lý do:

- ít state transition hơn
- dễ đảm bảo canonical + display được tạo cùng lúc

## 7. Prompting rules

### 7.1. Storyboard generation prompt

Prompt phải yêu cầu Gemini:

- phân tích truyện input bất kể ngôn ngữ gì
- trả canonical storyboard bằng English

### 7.2. Translation prompt

Prompt dịch phải yêu cầu:

- dịch từ English canonical sang ngôn ngữ đích
- giữ nguyên tên riêng nếu phù hợp
- không thêm ý mới
- không rút gọn
- không thay đổi meaning

### 7.3. Guardrails

Prompt dịch phải cấm:

- paraphrase sáng tạo
- thêm context không có trong source
- sửa tone/story details ngoài phạm vi dịch

### 7.4. Prompt contract implemented in phase 1

Canonical generation step hiện được chốt như sau:

- Input: `storyTitle`, `storyText`, `outputLanguage`
- Prompt rule: luôn yêu cầu Gemini trả `scenePrompt`, `dialogue`, `character.description` bằng English
- JSON shape canonical:
  `{"panels":[{"orderIndex":1,"scenePrompt":"...","characters":["..."],"dialogue":"..."}],"characters":[{"name":"...","gender":"Nam/Nữ/Khác","role":"Vai chính/Vai phụ/Phản diện/Quần chúng","description":"..."}]}`

Localization step hiện được chốt như sau:

- Chỉ chạy khi `outputLanguage = "vi"`
- Input: canonical English storyboard JSON
- Prompt rule: giữ nguyên structure, không thêm bớt panel/character, chỉ dịch text hiển thị
- JSON shape localized:
  `{"panels":[{"orderIndex":1,"scenePromptDisplay":"...","dialogueDisplay":"..."}],"characters":[{"name":"...","descriptionDisplay":"..."}]}`

### 7.5. Translation invariants

Bước localization phải đảm bảo:

- `orderIndex` không đổi
- `character.name` dùng để map lại description display
- nếu localization fail, app fallback hiển thị English canonical
- image generation không bao giờ dùng các field `...Display`

### 7.6. Phase 1 editing behavior

Behavior đã chốt cho phase 1:

- Nếu `outputLanguage = "en"`: editor sửa trực tiếp canonical fields
- Nếu `outputLanguage = "vi"`: editor storyboard và character description sửa `display fields`
- Bubble seed sẽ sync theo `dialogueDisplay` khi bubble vẫn còn là bubble auto-seeded
- Bubble custom không bị overwrite

## 8. Data truth rules

### 8.1. Canonical fields

Là nguồn sự thật cho AI:

- `scenePrompt`
- `dialogue`
- `description`

### 8.2. Display fields

Là nguồn hiển thị mặc định cho UI:

- `scenePromptDisplay`
- `dialogueDisplay`
- `descriptionDisplay`

### 8.3. Bubble fields

Là nguồn hiển thị cuối cùng trên panel/export sau khi user edit:

- `bubble.text`

## 9. Khi user đổi output language sau khi đã tạo storyboard

Flow:

1. Giữ nguyên canonical English fields.
2. Gọi translation step từ canonical English sang ngôn ngữ mới.
3. Cập nhật display fields.
4. Chỉ đồng bộ bubble nếu bubble vẫn còn là auto-seeded text.
5. Không overwrite bubble custom.

## 10. Failure handling

### 10.1. Nếu translation fail

App phải:

- giữ canonical English fields
- fallback hiển thị English
- báo warning rõ cho user

Không được:

- xóa storyboard
- ghi rỗng display fields

### 10.2. Nếu storyboard generation thành công nhưng localization fail

Kết quả hợp lệ tối thiểu:

- app vẫn dùng English output
- image generation vẫn chạy bình thường

## 11. Persistence

Snapshot/local storage phải lưu thêm:

- `project.outputLanguage`
- panel display fields
- character display fields

Migrations cần:

- project cũ default `outputLanguage = "en"`
- display fields cũ có thể để `undefined`

## 12. Phased rollout

### Phase 1

- thêm `outputLanguage`
- canonical English generation
- display translation `en/vi`
- image prompt vẫn English
- bubble sync theo localized display nhưng không overwrite bubble custom

### Phase 2

- đổi output language sau khi project đã tạo
- regenerate display fields on demand
- update seeded bubbles an toàn

### Phase 3

- mở rộng thêm ngôn ngữ khác ngoài `en/vi`

## 13. Acceptance criteria

1. User nhập truyện tiếng Việt vẫn tạo được canonical storyboard English.
2. Nếu chọn output `vi`, UI hiển thị thoại/mô tả cảnh/mô tả nhân vật bằng tiếng Việt.
3. Nếu chọn output `en`, UI hiển thị bằng tiếng Anh.
4. Generate ảnh luôn dùng English canonical data.
5. Đổi output language không làm mất canonical English fields.
6. Bubble custom không bị overwrite khi đổi ngôn ngữ output.
7. Không có bước nào dịch ngược chồng đè lên canonical English.

## 14. Điểm cần review trước khi code

1. Có chấp nhận thêm display fields mới vào model hiện tại không, hay muốn giữ model tối giản và derive từ translation cache?
2. Ở phase đầu, user có được sửa trực tiếp localized text không, hay chỉ sửa canonical text?
3. Khi đổi output language giữa `en` và `vi`, có cần cập nhật lại bubble seed ngay lập tức không, hay chỉ áp dụng cho panel mới tạo?

## 15. Khuyến nghị chốt cho phase đầu

Để giảm rủi ro, nên chốt:

1. Lưu cả canonical fields và display fields.
2. User chọn output language ngay từ lúc tạo storyboard.
3. Generate ảnh luôn dùng canonical English.
4. Bubble custom không auto-update khi đổi language.
5. Nếu translation fail, fallback UI về English.
