---
id: RES-003
type: research
status: draft
created: 2026-06-07
---

# Research: AI Model Rotation 2026

## Mục Tiêu

Chuẩn hóa tích hợp AI để demo Text-to-Comic Studio không phụ thuộc một model cứng.
App ưu tiên local-first và fallback deterministic, nhưng khi có API key thì server
route sẽ xoay vòng model theo cấu hình production.

## Nguồn Chính

- Gemini model list: https://ai.google.dev/gemini-api/docs/models
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- Google Cloud Gemini model lineup: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models
- Hugging Face Inference Providers: https://huggingface.co/docs/inference-providers/en/index

## Quyết Định

- Text storyboard dùng pool mặc định:
  `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`,
  `gemini-2.5-flash-lite`.
- Image generation ưu tiên env `GEMINI_IMAGE_MODELS`; fallback code giữ pool có thể
  override để tránh khóa app vào một tên model image duy nhất.
- Hugging Face dùng `HF_IMAGE_MODEL`, mặc định
  `black-forest-labs/FLUX.1-dev:fastest`.
- `GEMINI_MODEL` vẫn được giữ để tương thích cấu hình cũ, nhưng production nên dùng
  `GEMINI_TEXT_MODELS` để kiểm soát toàn bộ pool.

## Runtime Policy

- Retry/rotate cho `408`, `409`, `429`, `500`, `502`, `503`, `504`.
- Dừng ngay với `400`, `401`, `403` vì thường là lỗi payload, schema hoặc API key.
- Mỗi request AI bị chặn bởi `AI_MODEL_TIMEOUT_MS`, mặc định `20000`.
- API response mở rộng không breaking bằng `usedProvider` và `usedModel`.
- Settings chỉ hiển thị default pool và lần gọi gần nhất; server env bí mật không bị
  expose ra browser.

## Fallback

- `/api/storyboard` trả storyboard fallback nếu Gemini không khả dụng.
- `/api/generate-panel` thử Gemini image, image backend riêng, Hugging Face, rồi
  cached SVG fallback.
- Demo vẫn hoàn thành được flow nhập truyện, storyboard, chỉnh truyện và export PNG
  khi không cấu hình API key.
