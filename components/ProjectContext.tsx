"use client";

import { useState, useEffect } from "react";
import { getApi } from "@/lib/web/api";
import { useAppStore } from "@/lib/web/store";

export function ProjectContext() {
  const { activeInstanceId } = useAppStore();
  const [project, setProject] = useState<{ name?: string; path?: string } | null>(null);

  useEffect(() => {
    getApi(activeInstanceId)
      .getProjectCurrent()
      .then(setProject)
      .catch(() => setProject(null));
  }, [activeInstanceId]);

  if (!project?.name && !project?.path) return null;

  const label = project.name ?? project.path ?? "";
  const fullPath = project.path ?? project.name ?? "";

  return (
    <div
      className="flex min-w-0 max-w-[50%] items-center gap-1.5 truncate text-[13px]"
      title={fullPath}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0 text-[var(--muted)]"
        aria-hidden
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      <span className="truncate text-[var(--foreground)]">{label}</span>
    </div>
  );
}
