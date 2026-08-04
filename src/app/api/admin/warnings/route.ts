import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod"; 

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const warnings = await prisma.warning.findMany({
    where: userId ? { userId } : {},
    include: {
      user: { select: { username: true } },
      issuedBy: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: warnings });
}

const schema = z.object({
  userId: z.string(),
  reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const issuedById = session.user.id;
  if (!issuedById) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const warning = await prisma.warning.create({
    data: {
      userId: parsed.data.userId,
      issuedById,
      reason: parsed.data.reason,
    },
    include: {
      user: { select: { username: true } },
      issuedBy: { select: { username: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "WARNING_ISSUED",
      actorId: issuedById,
      targetUserId: parsed.data.userId,
      details: { reason: parsed.data.reason },
    },
  });

  return NextResponse.json({ success: true, data: warning }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.warning.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
