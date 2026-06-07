/**
 * @file route.ts
 * @description Storyboard generation API route backed by Gemini with fallback.
 */

import { NextResponse } from "next/server";

import { generateMultiPageStoryboard } from "@/lib/server/gemini-storyboard";
import {
  StoryboardRequestSchema,
  StoryboardResponseSchema,
} from "@/lib/studio/api-contracts";
import { createFallbackStoryboardResponse } from "@/lib/studio/storyboard";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = StoryboardRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Title and story text are required.",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const projectId = `project-${Date.now()}`;
  const customApiKey = request.headers.get("x-gemini-api-key") || undefined;
  try {
    const result = await generateMultiPageStoryboard(
      parsedRequest.data,
      projectId,
      customApiKey,
    );

    return NextResponse.json(
      StoryboardResponseSchema.parse({
        pages: result.pages,
        source: result.source,
        usedModel: result.usedModel,
        usedProvider: result.usedProvider,
      }),
    );
  } catch {
    const fallback = createFallbackStoryboardResponse(
      parsedRequest.data.storyText,
      projectId,
      "Gemini failed or returned invalid JSON. Using fallback storyboard.",
    );
    return NextResponse.json(StoryboardResponseSchema.parse(fallback));
  }
}
