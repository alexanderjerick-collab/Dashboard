import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import axios from "axios";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const webhook = await prisma.webhook.update({
    where: { id },
    data: { isActive: body.isActive, name: body.name, url: body.url, events: body.events },
  });

  return NextResponse.json({ success: true, data: webhook });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await axios.post(webhook.url, {
      event: "TEST",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook from RankFlow" },
    }, {
      headers: {
        "Content-Type": "application/json",
        "X-RankFlow-Event": "TEST",
        ...(webhook.secret ? { "X-RankFlow-Signature": `sha256=${webhook.secret}` } : {}),
      },
      timeout: 5000,
    });

    await prisma.webhook.update({ where: { id }, data: { lastSentAt: new Date() } });
    return NextResponse.json({ success: true, message: "Test webhook sent" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send test webhook" }, { status: 500 });
  }
}
