import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIssues } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const labels = searchParams.get("labels") ?? "good+first+issue,help+wanted";

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo parameter" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  try {
    const issues = await getIssues(owner, repo, labels, user?.githubAccessToken);
    return NextResponse.json({ issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch issues";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
