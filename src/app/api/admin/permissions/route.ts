import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const permissions = await prisma.permission.findMany({ orderBy: { level: "desc" } });
  return NextResponse.json({ success: true, data: permissions });
}

const schema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  level: z.number().int().min(0).max(100),
  canPromote: z.boolean().default(false),
  canDemote: z.boolean().default(false),
  canExile: z.boolean().default(false),
  canAcceptReqs: z.boolean().default(false),
  canRejectReqs: z.boolean().default(false),
  canEditPerms: z.boolean().default(false),
  canCreateUsers: z.boolean().default(false),
  canDeleteUsers: z.boolean().default(false),
  canCreateApiKeys: z.boolean().default(false),
  canViewLogs: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(false),
  canManageLicenses: z.boolean().default(false),
  canManageBilling: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const permission = await prisma.permission.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: { action: "RANK_CREATED", actorId: session.user.id, details: { name: permission.name } },
  });

  return NextResponse.json({ success: true, data: permission }, { status: 201 });
}
