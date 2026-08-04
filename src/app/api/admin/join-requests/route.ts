import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { robloxClient } from "@/lib/roblox/client";
import { decrypt } from "@/lib/utils/encrypt";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

  try {
    const data = await robloxClient.getJoinRequests(groupId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Join requests error:", err);
    return NextResponse.json({ error: "Failed to fetch join requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, groupId, robloxGroupId, userId } = body;

  if (!action || !groupId || !robloxGroupId || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { robloxCookie: true },
  });

  if (!dbUser?.robloxCookie) {
    return NextResponse.json({ error: "No Roblox cookie configured." }, { status: 400 });
  }

  const cookie = decrypt(dbUser.robloxCookie);

  try {
    if (action === "accept") {
      await robloxClient.acceptJoinRequest(robloxGroupId, userId, cookie);
      await prisma.auditLog.create({
        data: {
          action: "ACCEPT_REQUEST",
          actorId: session.user.id,
          groupId,
          targetUserId: userId,
          details: { robloxGroupId },
        },
      });
    } else if (action === "decline") {
      await robloxClient.declineJoinRequest(robloxGroupId, userId, cookie);
      await prisma.auditLog.create({
        data: {
          action: "REJECT_REQUEST",
          actorId: session.user.id,
          groupId,
          targetUserId: userId,
          details: { robloxGroupId },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Join request action error:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
