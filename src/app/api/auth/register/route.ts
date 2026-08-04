import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 409 }
      );
    }

    // First user is owner
    const userCount = await prisma.user.count();
    const isFirst = userCount === 0;
    const role = isFirst ? "OWNER" : "STAFF";

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create default permissions if first user
    let ownerPermissionId: string | undefined;
    if (isFirst) {
      // Create default license
      await prisma.license.create({
        data: {
          tier: "STARTER",
          status: "ACTIVE",
          maxGroups: 1,
          maxStaff: 5,
          hasAnalytics: false,
          hasWebhooks: false,
        },
      });

      // Create owner permission
      const ownerPerm = await prisma.permission.create({
        data: {
          name: "Owner",
          description: "Full access to all features",
          level: 100,
          canPromote: true,
          canDemote: true,
          canExile: true,
          canAcceptReqs: true,
          canRejectReqs: true,
          canEditPerms: true,
          canCreateUsers: true,
          canDeleteUsers: true,
          canCreateApiKeys: true,
          canViewLogs: true,
          canViewAnalytics: true,
          canManageLicenses: true,
          canManageBilling: true,
        },
      });

      // Create staff permission
      await prisma.permission.create({
        data: {
          name: "Staff",
          description: "Basic staff access",
          level: 10,
          canPromote: true,
          canDemote: false,
          canExile: false,
          canAcceptReqs: true,
          canRejectReqs: true,
          canEditPerms: false,
          canCreateUsers: false,
          canDeleteUsers: false,
          canCreateApiKeys: false,
          canViewLogs: false,
          canViewAnalytics: false,
          canManageLicenses: false,
          canManageBilling: false,
        },
      });

      ownerPermissionId = ownerPerm.id;
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        permissionId: ownerPermissionId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "USER_CREATED",
        actorId: user.id,
        details: { username, email, role },
      },
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
