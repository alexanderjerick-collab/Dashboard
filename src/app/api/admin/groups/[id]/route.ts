import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  await prisma.group.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: "GROUP_UNLINKED",
      actorId: session.user.id,
      details: { groupId: group.robloxGroupId, name: group.name },
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const group = await prisma.group.update({
    where: { id },
    data: {
      isActive: body.isActive,
      name: body.name,
    },
  });

  return NextResponse.json({ success: true, data: group });
}
