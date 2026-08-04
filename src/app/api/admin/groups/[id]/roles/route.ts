import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { robloxClient } from "@/lib/roblox/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const robloxGroupId = searchParams.get("robloxGroupId");

  if (!robloxGroupId) return NextResponse.json({ error: "robloxGroupId required" }, { status: 400 });

  try {
    const data = await robloxClient.getRoles(robloxGroupId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Fetch roles error:", err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
