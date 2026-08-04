import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { permission: true },
        });

        if (!user || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            action: "LOGIN",
            actorId: user.id,
            details: { email: user.email },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          permissionId: user.permissionId,
          robloxUserId: user.robloxUserId,
          robloxUsername: user.robloxUsername,
          robloxAvatarUrl: user.robloxAvatarUrl,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.permissionId = (user as { permissionId?: string }).permissionId;
        token.robloxUserId = (user as { robloxUserId?: string }).robloxUserId;
        token.robloxUsername = (user as { robloxUsername?: string }).robloxUsername;
        token.robloxAvatarUrl = (user as { robloxAvatarUrl?: string }).robloxAvatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { permissionId?: string }).permissionId = token.permissionId as string;
        (session.user as { robloxUserId?: string }).robloxUserId = token.robloxUserId as string;
        (session.user as { robloxUsername?: string }).robloxUsername = token.robloxUsername as string;
        (session.user as { robloxAvatarUrl?: string }).robloxAvatarUrl = token.robloxAvatarUrl as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
