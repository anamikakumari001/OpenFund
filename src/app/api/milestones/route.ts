import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    projectId: string;
    title: string;
    description?: string;
    fundingGoal?: string;
    dueDate?: string;
  };

  const { projectId, title, description, fundingGoal, dueDate } = body;
  if (!projectId || !title) {
    return NextResponse.json({ error: "projectId and title are required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the project owner can add milestones" }, { status: 403 });
  }

  const count = await prisma.milestone.count({ where: { projectId } });

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title,
      description: description ?? undefined,
      fundingGoal: fundingGoal ? parseFloat(fundingGoal) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      order: count,
    },
  });

  return NextResponse.json({ milestone }, { status: 201 });
}
