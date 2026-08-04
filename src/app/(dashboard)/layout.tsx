import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Sidebar from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const license = await prisma.license.findFirst();
  const tier = license?.tier || "STARTER";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: (session.user as { role?: string }).role,
        }}
        licenseTier={tier}
      />
      <main className="flex-1 overflow-y-auto bg-[#05020f] purple-grid">
        <div className="min-h-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
