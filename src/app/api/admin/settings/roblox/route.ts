import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { encrypt } from "@/lib/utils/encrypt";
import { robloxClient } from "@/lib/roblox/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cookie } = await req.json();
  if (!cookie) return NextResponse.json({ error: "Cookie required" }, { status: 400 });

  const cleanCookie = cookie.trim().replace(".ROBLOSECURITY=", "");

  // Verify identity via Roblox authenticated endpoint
  try {
    const res = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { Cookie: `.ROBLOSECURITY=${cleanCookie}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid cookie. Please get a fresh .ROBLOSECURITY cookie." }, { status: 401 });
    }

    const userData = await res.json();

    // Get avatar
    let avatarUrl: string | null = null;
    try {
      avatarUrl = await robloxClient.getUserAvatar(userData.id.toString());
    } catch {}

    const encrypted = encrypt(`.ROBLOSECURITY=${cleanCookie}`);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        robloxUserId: userData.id.toString(),
        robloxUsername: userData.name,
        robloxAvatarUrl: avatarUrl,
        robloxCookie: encrypted,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        robloxUserId: userData.id,
        robloxUsername: userData.name,
        avatarUrl,
      },
    });
  } catch (err) {
    console.error("Roblox auth error:", err);
    return NextResponse.json({ error: "Failed to verify Roblox identity" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { robloxCookie: null, robloxUserId: null, robloxUsername: null, robloxAvatarUrl: null },
  });

  return NextResponse.json({ success: true });
}
