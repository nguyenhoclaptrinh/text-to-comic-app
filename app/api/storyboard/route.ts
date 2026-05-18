/**
 * @file route.ts
 * @description Storyboard generation API route backed by Gemini with fallback.
 */

import { NextResponse } from "next/server";

import { generateStoryboardWithGemini } from "@/lib/server/gemini-storyboard";
import {
  StoryboardRequestSchema,
  StoryboardResponseSchema,
} from "@/lib/studio/api-contracts";
import {
  createFallbackStoryboardResponse,
  normalizeStoryboardAiResponse,
} from "@/lib/studio/storyboard";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = StoryboardRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Title and story text are required.",
      },
      { status: 400 },
    );
  }

  try {
    const geminiResponse = await generateStoryboardWithGemini(
      parsedRequest.data,
    );

    if (!geminiResponse) {
      return NextResponse.json(
        StoryboardResponseSchema.parse(
          createFallbackStoryboardResponse(parsedRequest.data.storyText),
        ),
      );
    }

    return NextResponse.json(
      StoryboardResponseSchema.parse({
        panels: normalizeStoryboardAiResponse(geminiResponse),
        source: "gemini",
      }),
    );
  } catch {
    return NextResponse.json(
      StoryboardResponseSchema.parse(
        createFallbackStoryboardResponse(
          parsedRequest.data.storyText,
          "Gemini failed or returned invalid JSON. Using fallback storyboard.",
        ),
      ),
    );
  }
}
