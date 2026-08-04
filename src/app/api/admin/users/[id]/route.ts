import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      robloxUsername: true,
      robloxAvatarUrl: true,
      createdAt: true,
      permission: { select: { name: true, level: true } },
      warnings: { include: { issuedBy: { select: { username: true } } }, orderBy: { createdAt: "desc" } },
      staffNotes: { include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } },
      auditLogs: { take: 20, orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["status", "role", "permissionId", "robloxUserId", "robloxUsername", "robloxAvatarUrl"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const user = await prisma.user.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      action: "PERMISSION_UPDATED",
      actorId: session.user.id,
      targetUserId: id,
      details: data,
    },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: "USER_DELETED",
      actorId: session.user.id,
      details: { username: user.username },
    },
  });

  return NextResponse.json({ success: true });
}
