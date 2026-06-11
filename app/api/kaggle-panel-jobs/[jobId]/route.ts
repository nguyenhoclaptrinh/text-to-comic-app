/**
 * @file route.ts
 * @description Reads Supabase-backed Kaggle panel image job status.
 */

import { NextResponse } from "next/server";

import {
  getKagglePanelJob,
  KaggleImageJobError,
} from "@/lib/server/kaggle-image-jobs";
import { KaggleImageJobResponseSchema } from "@/lib/studio/api-contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const job = await getKagglePanelJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Kaggle image job was not found.",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(KaggleImageJobResponseSchema.parse(job));
  } catch (error) {
    return NextResponse.json(
      {
        code: "AI_IMAGE_OFFLINE",
        message:
          error instanceof KaggleImageJobError
            ? error.message
            : "Kaggle image job status is unavailable.",
        retryable: true,
      },
      { status: error instanceof KaggleImageJobError ? error.status : 503 },
    );
  }
}
