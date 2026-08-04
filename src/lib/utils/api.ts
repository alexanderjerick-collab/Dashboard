import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

type Handler = (req: NextRequest, ctx: { params?: Promise<Record<string, string>>; session: { user: { id: string; role: string; email: string; name: string } } }) => Promise<NextResponse>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: { params?: Promise<Record<string, string>> }) => {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }
    return handler(req, { ...ctx, session: session as Parameters<Handler>[1]["session"] });
  };
}

export async function validateApiKey(req: NextRequest): Promise<{ valid: boolean; userId?: string; permissions?: Record<string, boolean> }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };

  const key = authHeader.slice(7);
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
  });

  if (!apiKey || apiKey.status !== "ACTIVE") return { valid: false };
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";
  if (apiKey.ipRestrictions.length > 0 && !apiKey.ipRestrictions.includes(ip)) {
    return { valid: false };
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date(), lastUsedIp: ip, usageCount: { increment: 1 } },
  });

  return {
    valid: true,
    userId: apiKey.userId,
    permissions: apiKey.permissions as Record<string, boolean>,
  };
}
