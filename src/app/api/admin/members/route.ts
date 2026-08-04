import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { robloxClient } from "@/lib/roblox/client";
import { decrypt } from "@/lib/utils/encrypt";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const cursor = searchParams.get("cursor") || undefined;

  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

  try {
    const data = await robloxClient.getGroupMembers(groupId, cursor);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Fetch members error:", err);
    return NextResponse.json({ error: "Failed to fetch members from Roblox" }, { status: 500 });
  }
}

const actionSchema = z.object({
  action: z.enum(["promote", "demote", "exile", "setRank"]),
  groupId: z.string(),
  robloxGroupId: z.string(),
  userId: z.string(),
  targetRankId: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { action, groupId, robloxGroupId, userId, targetRankId } = parsed.data;

  // Get cookie from the current user
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { robloxCookie: true } });
  if (!dbUser?.robloxCookie) {
    return NextResponse.json({ error: "No Roblox cookie configured. Go to Settings > Roblox." }, { status: 400 });
  }

  const cookie = decrypt(dbUser.robloxCookie);

  try {
    if (action === "exile") {
      await robloxClient.exile(robloxGroupId, userId, cookie);
      await prisma.auditLog.create({
        data: {
          action: "EXILE",
          actorId: session.user.id,
          groupId,
          targetUserId: userId,
          details: { robloxGroupId },
        },
      });
    } else if ((action === "setRank" || action === "promote" || action === "demote") && targetRankId) {
      await robloxClient.setRank(robloxGroupId, userId, targetRankId, cookie);
      await prisma.auditLog.create({
        data: {
          action: action === "promote" ? "PROMOTE" : action === "demote" ? "DEMOTE" : "PROMOTE",
          actorId: session.user.id,
          groupId,
          targetUserId: userId,
          details: { targetRankId, robloxGroupId },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Member action error:", err);
    return NextResponse.json({ error: "Failed to perform action. Check your Roblox cookie." }, { status: 500 });
  }
}
