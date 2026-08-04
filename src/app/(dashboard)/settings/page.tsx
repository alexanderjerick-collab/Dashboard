import SettingsClient from "@/components/settings/SettingsClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function SettingsPage() {
  const session = await auth();

  const [user, license] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        robloxUserId: true,
        robloxUsername: true,
        robloxAvatarUrl: true,
        twoFactorEnabled: true,
      },
    }),
    prisma.license.findFirst(),
  ]);

  return <SettingsClient user={user} license={license} />;
}
