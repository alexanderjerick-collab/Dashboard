import { auth } from "@/lib/auth";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  return <DashboardClient user={session?.user} />;
}
