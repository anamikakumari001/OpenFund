import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRepos } from "@/lib/github";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  // Fall back to the Account table if the custom field wasn't populated
  let accessToken = user?.githubAccessToken ?? null;
  if (!accessToken) {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
      select: { access_token: true },
    });
    accessToken = account?.access_token ?? null;
  }

  if (!accessToken) {
    return NextResponse.json({ error: "No GitHub access token found" }, { status: 400 });
  }

  try {
    const repos = await getUserRepos(accessToken);
    return NextResponse.json({ repos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch repositories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
