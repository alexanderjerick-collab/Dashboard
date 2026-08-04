import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      status: true,
      permissions: true,
      expiresAt: true,
      lastUsedAt: true,
      usageCount: true,
      rateLimit: true,
      ipRestrictions: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: keys });
}

const schema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.record(z.boolean()).default({}),
  expiresAt: z.string().optional().nullable(),
  rateLimit: z.number().int().min(1).max(10000).default(100),
  ipRestrictions: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 8);

  const key = await prisma.apiKey.create({
    data: {
      name: parsed.data.name,
      keyHash,
      keyPrefix,
      permissions: parsed.data.permissions,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      rateLimit: parsed.data.rateLimit,
      ipRestrictions: parsed.data.ipRestrictions,
      userId: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: { action: "API_KEY_CREATED", actorId: session.user.id, apiKeyId: key.id, details: { name: key.name } },
  });

  return NextResponse.json({
    success: true,
    data: { ...key, rawKey: `rf_${rawKey}` },
  }, { status: 201 });
}
