import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/utils/api";
import { robloxClient } from "@/lib/roblox/client";

export async function GET(req: NextRequest) {
  const { valid } = await validateApiKey(req);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const userId = searchParams.get("userId");

  if (!groupId || !userId) {
    return NextResponse.json({ error: "groupId and userId are required" }, { status: 400 });
  }

  try {
    const [userInfo, memberRole, avatarUrl] = await Promise.all([
      robloxClient.getUserInfo(userId),
      robloxClient.getMemberRole(groupId, userId),
      robloxClient.getUserAvatar(userId),
    ]);

    const member = memberRole?.data?.[0];

    return NextResponse.json({
      success: true,
      data: {
        user: userInfo,
        role: member?.role || null,
        inGroup: !!member,
        avatarUrl,
      },
    });
  } catch (err) {
    console.error("Get member error:", err);
    return NextResponse.json({ error: "Failed to get member info" }, { status: 500 });
  }
}
