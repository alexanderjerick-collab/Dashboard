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

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key || key.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiKey.update({ where: { id }, data: { status: "REVOKED" } });

  await prisma.auditLog.create({
    data: {
      action: "API_KEY_REVOKED",
      actorId: session.user.id,
      apiKeyId: id,
      details: { name: key.name },
    },
  });

  return NextResponse.json({ success: true });
}
