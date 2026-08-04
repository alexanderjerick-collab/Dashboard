import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AuditAction } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const action = searchParams.get("action") as AuditAction | null;
  const actorId = searchParams.get("actorId");
  const groupId = searchParams.get("groupId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  if (groupId) where.groupId = groupId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { username: true } },
        group: { select: { name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { logs, total, page, limit } });
}
