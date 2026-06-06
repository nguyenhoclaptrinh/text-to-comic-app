/**
 * @file user-facing-errors.ts
 * @description Maps technical AI/API failures into user-safe demo messages.
 */

import type { StudioApiErrorCode } from "@/lib/studio/api-contracts";

export type StudioUserFacingError = {
  code: StudioApiErrorCode | "UNKNOWN";
  message: string;
  retryable: boolean;
};

const USER_ERROR_MESSAGES: Record<StudioApiErrorCode, string> = {
  VALIDATION_ERROR:
    "Thông tin chưa đủ để tạo truyện. Hãy nhập tiêu đề và nội dung truyện rõ ràng hơn.",
  AI_TEXT_QUOTA:
    "Dịch vụ phân tích truyện đang quá tải hoặc hết lượt dùng. Bạn có thể thử lại sau.",
  AI_TEXT_POLICY_BLOCK:
    "Nội dung này chưa thể phân tích tự động. Hãy chỉnh lại đoạn truyện nhẹ hơn rồi thử lại.",
  AI_TEXT_INVALID_JSON:
    "AI trả về storyboard chưa đúng định dạng. Hãy thử phân tích lại.",
  AI_TEXT_UNAVAILABLE:
    "Chưa thể phân tích truyện lúc này. Bản demo vẫn có dữ liệu dự phòng để tiếp tục.",
  AI_IMAGE_OFFLINE:
    "Dịch vụ vẽ ảnh chưa sẵn sàng. Khung truyện vẫn được lưu, bạn có thể thử vẽ lại sau.",
  AI_IMAGE_TIMEOUT:
    "Vẽ ảnh mất quá nhiều thời gian. Ảnh cũ vẫn được giữ, hãy thử lại khung này.",
  AI_IMAGE_INVALID_RESPONSE:
    "Dịch vụ vẽ ảnh trả về kết quả chưa hợp lệ. Hãy thử vẽ lại khung này.",
};

export function toUserFacingError(error: unknown): StudioUserFacingError {
  if (isRecord(error)) {
    const code = error.code;
    if (isStudioApiErrorCode(code)) {
      return {
        code,
        message: USER_ERROR_MESSAGES[code],
        retryable:
          typeof error.retryable === "boolean" ? error.retryable : true,
      };
    }
  }

  return {
    code: "UNKNOWN",
    message:
      "Có lỗi ngoài dự kiến. Dữ liệu đã nhập vẫn được giữ để bạn thử lại.",
    retryable: true,
  };
}

function isStudioApiErrorCode(value: unknown): value is StudioApiErrorCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(USER_ERROR_MESSAGES, value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
