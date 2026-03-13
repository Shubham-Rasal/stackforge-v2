import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppStoreProvider } from "@/lib/web/store";
import { VibeApp } from "@/components/VibeApp";
import { Providers } from "@/components/Providers";

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ instanceId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/");

  const { instanceId } = await searchParams;

  return (
    <Providers>
      <AppStoreProvider initialInstanceId={instanceId ?? null} initialView="workspace">
        <VibeApp />
      </AppStoreProvider>
    </Providers>
  );
}
