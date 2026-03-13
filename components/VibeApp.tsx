"use client";

import { useAppStore } from "@/lib/web/store";
import { DashboardView } from "./DashboardView";
import { WorkspaceView } from "./WorkspaceView";

export function VibeApp() {
  const {
    view,
    sessionId,
    initialPrompt,
    sessionsLoading,
    createSession,
    selectSession,
  } = useAppStore();

  if (sessionsLoading) {
    return (
      <div className="hero-gradient flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
          Loading...
        </div>
      </div>
    );
  }

  if (view === "hero") {
    return <DashboardView />;
  }

  return (
    <WorkspaceView
      sessionId={sessionId}
      initialPrompt={initialPrompt}
      onSelectSession={selectSession}
      onCreateSession={async () => {
        const { session, error } = await createSession();
        if (!session && error) alert(error);
      }}
    />
  );
}
