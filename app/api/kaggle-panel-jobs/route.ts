/**
 * @file route.ts
 * @description Starts Supabase-backed Kaggle panel image jobs.
 */

import { NextResponse } from "next/server";

import {
  createKagglePanelJob,
  KaggleImageJobError,
} from "@/lib/server/kaggle-image-jobs";
import {
  GeneratePanelRequestSchema,
  KaggleImageJobResponseSchema,
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

  try {
    return NextResponse.json(
      KaggleImageJobResponseSchema.parse(
        await createKagglePanelJob(parsedRequest.data),
      ),
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        code: "AI_IMAGE_OFFLINE",
        message:
          error instanceof KaggleImageJobError
            ? error.message
            : "Kaggle image jobs are unavailable.",
        retryable: true,
      },
      { status: error instanceof KaggleImageJobError ? error.status : 503 },
    );
  }
}
