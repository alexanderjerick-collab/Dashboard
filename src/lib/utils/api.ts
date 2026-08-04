import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createHash } from "crypto";

export type ApiContext = {
  params?: Record<string, string>;
  session: {
    user: {
      id: string;
      role: string;
      email: string;
      name: string;
    };
  };
};

type Handler = (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>;

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: Omit<ApiContext, "session">) => {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }
    return handler(req, {
      ...ctx,
      session: session as unknown as ApiContext["session"],
    });
  };
}

export async function validateApiKey(req: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: Record<string, boolean>;
}> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };

  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, permission: true } } },
  });

  if (!apiKey || !apiKey.isActive) return { valid: false };

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  const perms = apiKey.user?.permission;
  return {
    valid: true,
    userId: apiKey.user?.id,
    permissions: perms
      ? {
          promote: perms.canPromote,
          demote: perms.canDemote,
          exile: perms.canExile,
          acceptReqs: perms.canAcceptReqs,
          rejectReqs: perms.canRejectReqs,
        }
      : undefined,
  };
}
