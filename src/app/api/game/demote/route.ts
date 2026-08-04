import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/utils/api";
import { prisma } from "@/lib/db/prisma";
import { robloxClient } from "@/lib/roblox/client";
import { decrypt } from "@/lib/utils/encrypt";

export async function POST(req: NextRequest) {
  const { valid, userId, permissions } = await validateApiKey(req);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!permissions?.demote) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const { groupId, userId: targetUserId, targetRankId } = await req.json();
  if (!groupId || !targetUserId || !targetRankId) {
    return NextResponse.json({ error: "groupId, userId, and targetRankId are required" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { robloxGroupId: groupId } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId! }, select: { robloxCookie: true } });
  if (!user?.robloxCookie) return NextResponse.json({ error: "No Roblox cookie configured" }, { status: 400 });

  try {
    const cookie = decrypt(user.robloxCookie);
    await robloxClient.setRank(groupId, targetUserId, targetRankId, cookie);

    await prisma.auditLog.create({
      data: {
        action: "DEMOTE",
        actorId: userId,
        groupId: group.id,
        targetUserId,
        details: { targetRankId, source: "api" },
      },
    });

    return NextResponse.json({ success: true, message: "Member demoted" });
  } catch (err) {
    console.error("Demote error:", err);
    return NextResponse.json({ error: "Failed to demote member" }, { status: 500 });
  }
}
