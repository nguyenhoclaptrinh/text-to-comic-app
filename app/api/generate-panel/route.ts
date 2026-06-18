/**
 * @file route.ts
 * @description Panel image generation API route with cached fallback.
 */

import { NextResponse } from "next/server";

import { generatePanelImageFromProvider } from "@/lib/server/image-generation";
import {
  GeneratePanelRequestSchema,
  GeneratePanelResponseSchema,
} from "@/lib/studio/api-contracts";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedRequest = GeneratePanelRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Panel generation request is invalid.",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const customHfToken = request.headers.get("x-huggingface-token") || undefined;
  const customGeminiKey = request.headers.get("x-gemini-api-key") || undefined;
  try {
    return NextResponse.json(
      GeneratePanelResponseSchema.parse(
        await generatePanelImageFromProvider(
          parsedRequest.data,
          customHfToken,
          customGeminiKey,
        ),
      ),
    );
  } catch (error) {
    console.error("[API /api/generate-panel] Image generation failed:", error);
    return NextResponse.json(
      {
        code: "AI_IMAGE_OFFLINE",
        message: error instanceof Error ? error.message : "Image generation failed. Please retry later.",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
