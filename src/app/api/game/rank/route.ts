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
    const data = await robloxClient.getMemberRole(groupId, userId);
    const member = data?.data?.[0];
    return NextResponse.json({
      success: true,
      data: {
        userId,
        groupId,
        role: member?.role || null,
        inGroup: !!member,
      },
    });
  } catch (err) {
    console.error("Get rank error:", err);
    return NextResponse.json({ error: "Failed to get rank" }, { status: 500 });
  }
}
