import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      githubUsername: true,
      bio: true,
      website: true,
      location: true,
      twitterUsername: true,
      stellarPublicKey: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          projects: true,
          donations: true,
          badges: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = [
    "name",
    "bio",
    "website",
    "location",
    "twitterUsername",
    "stellarPublicKey",
  ] as const;

  type AllowedField = (typeof allowedFields)[number];
  const updateData: Partial<Record<AllowedField, string | null>> = {};

  for (const field of allowedFields) {
    if (field in body) {
      const val = body[field];
      if (typeof val === "string" || val === null) {
        updateData[field] = val;
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      githubUsername: true,
      bio: true,
      website: true,
      location: true,
      twitterUsername: true,
      stellarPublicKey: true,
      role: true,
    },
  });

  return NextResponse.json({ user });
}
