import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scrapingJobs } from "@/db/schema";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobIdParam = searchParams.get("jobId");

    if (!jobIdParam) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const jobId = parseInt(jobIdParam, 10);

    const [job] = await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.id, jobId));

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      currentProgress: job.currentProgress,
      totalExpected: job.totalExpected,
      jobType: job.jobType,
    });
  } catch (error) {
    console.error("Error fetching job progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
