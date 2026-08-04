import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
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
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { users, total, page, limit } });
}

const createSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "STAFF"]).default("STAFF"),
  permissionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { username, email, password, role, permissionId } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { username, email, passwordHash, role, permissionId },
    select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: { action: "USER_CREATED", actorId: session.user.id, details: { username, email, role } },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
