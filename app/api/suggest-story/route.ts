/**
 * @file route.ts
 * @description API route to generate story script suggestion using Gemini.
 */

import { NextResponse } from "next/server";
import { generateStorySuggestion } from "@/lib/server/gemini-storyboard";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const { title, style, genre, aspectRatio } = body as Record<string, string>;

  if (!title || !style || !genre || !aspectRatio) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message:
          "Vui lòng điền đầy đủ: tiêu đề, phong cách, thể loại và tỉ lệ khung hình.",
      },
      { status: 400 },
    );
  }

  const customApiKey = request.headers.get("x-gemini-api-key") || undefined;

  try {
    const result = await generateStorySuggestion({
      title,
      style,
      genre,
      aspectRatio,
      customApiKey,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[API /api/suggest-story] Failed to generate story suggestion:",
      error,
    );
    return NextResponse.json(
      {
        code: "AI_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Lỗi khi gọi AI đề xuất kịch bản.",
      },
      { status: 500 },
    );
  }
}
