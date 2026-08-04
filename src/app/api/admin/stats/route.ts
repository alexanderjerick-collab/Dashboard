import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { subDays, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [groupCount, activeStaff, recentLogs, licenseInfo, apiKeyUsage] = await Promise.all([
    prisma.group.count({ where: { isActive: true } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { username: true } } },
    }),
    prisma.license.findFirst({
      select: { tier: true, status: true, maxGroups: true, maxStaff: true, expiresAt: true },
    }),
    prisma.apiKey.findMany({
      select: { usageCount: true, updatedAt: true },
    }),
  ]);

  const groups = await prisma.group.findMany({ select: { memberCount: true } });
  const memberCount = groups.reduce((sum, g) => sum + g.memberCount, 0);

  // Mock 7-day API usage
  const apiUsage = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, "MMM d"),
      count: Math.floor(Math.random() * 200) + 10,
    };
  });

  // Estimate pending join requests (we don't store them locally)
  const pendingRequests = 0;

  return NextResponse.json({
    success: true,
    data: {
      groupCount,
      memberCount,
      activeStaff,
      pendingRequests,
      recentLogs,
      licenseInfo,
      apiUsage,
    },
  });
}
