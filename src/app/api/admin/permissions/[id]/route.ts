import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const permission = await prisma.permission.update({ where: { id }, data: body });

  await prisma.auditLog.create({
    data: { action: "RANK_UPDATED", actorId: session.user.id, details: { name: permission.name } },
  });

  return NextResponse.json({ success: true, data: permission });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unlink users first
  await prisma.user.updateMany({ where: { permissionId: id }, data: { permissionId: null } });
  await prisma.permission.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { action: "RANK_DELETED", actorId: session.user.id, details: { name: permission.name } },
  });

  return NextResponse.json({ success: true });
}
