import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { robloxClient } from "@/lib/roblox/client";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: groups });
}

const linkSchema = z.object({
  groupId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });

  const { groupId } = parsed.data;

  // Check if already linked
  const existing = await prisma.group.findUnique({ where: { robloxGroupId: groupId } });
  if (existing) return NextResponse.json({ error: "Group already linked" }, { status: 409 });

  try {
    const groupData = await robloxClient.getGroup(groupId);

    // Fetch thumbnail
    let thumbnailUrl: string | undefined;
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png`
      );
      const thumbData = await thumbRes.json();
      thumbnailUrl = thumbData?.data?.[0]?.imageUrl;
    } catch {}

    const group = await prisma.group.create({
      data: {
        robloxGroupId: groupId,
        name: groupData.name,
        description: groupData.description,
        memberCount: groupData.memberCount || 0,
        ownerRobloxId: groupData.owner?.userId?.toString(),
        thumbnailUrl,
        isVerified: false,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "GROUP_LINKED",
        actorId: session.user.id,
        groupId: group.id,
        details: { groupId, name: group.name },
      },
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (err) {
    console.error("Link group error:", err);
    return NextResponse.json({ error: "Failed to fetch group from Roblox. Check the group ID." }, { status: 422 });
  }
}
