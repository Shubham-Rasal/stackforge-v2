import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppStoreProvider } from "@/lib/web/store";
import { DashboardView } from "@/components/DashboardView";
import { Providers } from "@/components/Providers";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <Providers>
      <AppStoreProvider>
        <DashboardView />
      </AppStoreProvider>
    </Providers>
  );
}
