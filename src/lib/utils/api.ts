import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
