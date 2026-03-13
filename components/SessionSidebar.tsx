"use client";

import { useAppStore } from "@/lib/web/store";
import { SessionActions } from "./SessionActions";

interface SessionSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}

export function SessionSidebar({
  currentSessionId,
  onSelectSession,
  onCreateSession,
}: SessionSidebarProps) {
  const { sessions, sessionsLoading, sessionsError, loadSessions, selectSession } = useAppStore();

  if (sessionsLoading) {
    return (
      <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--card)] p-3">
        <div className="skeleton mb-2 h-10 w-full" />
        <div className="skeleton mb-2 h-8 w-3/4" />
        <div className="skeleton mb-2 h-8 w-full" />
        <div className="skeleton h-8 w-2/3" />
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--card)] p-3">
      <button
        type="button"
        onClick={onCreateSession}
        className="btn-primary mb-4 w-full"
      >
        + New session
      </button>
      {sessionsError && (
        <p className="mb-2 text-sm text-[var(--error)]">{sessionsError}</p>
      )}
      <nav className="flex flex-col gap-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-1 rounded-lg px-3 py-2 transition-colors ${
              currentSessionId === s.id
                ? "bg-[var(--accent-muted)]"
                : "hover:bg-[var(--muted-bg)]"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectSession(s.id)}
              className={`flex-1 text-left text-sm ${
                currentSessionId === s.id ? "text-[var(--accent)] font-medium" : "text-[var(--foreground)]"
              }`}
            >
              {s.title || "Untitled session"}
            </button>
            <SessionActions
              sessionId={s.id}
              sessionTitle={s.title}
              onRename={() => loadSessions()}
              onDelete={() => {
                if (currentSessionId === s.id) {
                  const next = sessions.find((x) => x.id !== s.id);
                  selectSession(next?.id ?? null);
                }
                loadSessions();
              }}
              onFork={(newId) => {
                selectSession(newId);
                loadSessions();
              }}
            />
          </div>
        ))}
      </nav>
    </aside>
  );
}
