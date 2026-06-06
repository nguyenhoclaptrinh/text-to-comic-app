/**
 * @file studio-user-facing-errors.test.ts
 * @description Unit tests for user-safe error mapping.
 */

import { describe, expect, it } from "vitest";

import { toUserFacingError } from "@/lib/studio/user-facing-errors";

describe("studio user-facing errors", () => {
  it("should map known technical errors into Vietnamese safe copy", () => {
    expect(
      toUserFacingError({
        code: "AI_IMAGE_TIMEOUT",
        message: "Provider timeout",
        retryable: false,
      }),
    ).toMatchObject({
      code: "AI_IMAGE_TIMEOUT",
      retryable: false,
      message:
        "Vẽ ảnh mất quá nhiều thời gian. Ảnh cũ vẫn được giữ, hãy thử lại khung này.",
    });
  });

  it("should default retryable to true for known errors without retry metadata", () => {
    expect(toUserFacingError({ code: "AI_TEXT_INVALID_JSON" })).toMatchObject({
      code: "AI_TEXT_INVALID_JSON",
      retryable: true,
    });
  });

  it("should hide unknown or non-object errors behind a generic message", () => {
    expect(
      toUserFacingError({ code: "SOME_PROVIDER_STACKTRACE" }),
    ).toMatchObject({
      code: "UNKNOWN",
      retryable: true,
    });
    expect(toUserFacingError("plain failure")).toMatchObject({
      code: "UNKNOWN",
      retryable: true,
    });
  });
});
