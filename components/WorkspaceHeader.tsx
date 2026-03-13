"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { safeResJson } from "@/lib/safe-json";
import { ProjectContext } from "./ProjectContext";
import { ConnectionStatus } from "./ConnectionStatus";
import { useAppStore } from "@/lib/web/store";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  private: boolean;
}

export function WorkspaceHeader({
  previewUrl,
  setPreviewUrl,
  reviewOpen,
  setReviewOpen,
}: {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  reviewOpen: boolean;
  setReviewOpen: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const {
    activeInstanceId,
    activeInstanceFullName,
    setActiveInstance,
    cloneAndOpen,
  } = useAppStore();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [repoOpen, setRepoOpen] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = (session?.user?.name ?? session?.user?.email ?? "User")
    .split(" ")[0]
    .split("@")[0];

  useEffect(() => {
    fetch("/api/github/repos")
      .then(async (r) => {
        if (!r.ok) return [];
        const data = await safeResJson(r, []);
        return Array.isArray(data) ? data : [];
      })
      .then(setRepos)
      .catch(() => setRepos([]))
      .finally(() => setReposLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRepoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentRepoLabel = activeInstanceFullName ?? "Default";

  async function handleSelectRepo(fullName: string) {
    if (fullName === "default") {
      setActiveInstance(null);
      setRepoOpen(false);
      return;
    }
    const repo = repos.find((r) => r.fullName === fullName);
    if (!repo) return;
    setCloning(repo.fullName);
    const result = await cloneAndOpen(repo.fullName);
    setCloning(null);
    setRepoOpen(false);
    if ("error" in result) {
      alert(result.error);
    }
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ProjectContext />
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setRepoOpen(!repoOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted-bg)]"
          >
            <span className="truncate max-w-[180px]">{currentRepoLabel}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${repoOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {repoOpen && (
            <ul className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectRepo("default")}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)] ${
                    !activeInstanceId ? "bg-[var(--muted-bg)] text-[var(--accent)]" : "text-[var(--foreground)]"
                  }`}
                >
                  Default
                </button>
              </li>
              {reposLoading ? (
                <li className="px-3 py-2 text-sm text-[var(--muted)]">Loading repos…</li>
              ) : (
                repos.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectRepo(r.fullName)}
                      disabled={cloning !== null}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)] disabled:opacity-50 ${
                        activeInstanceFullName === r.fullName
                          ? "bg-[var(--muted-bg)] text-[var(--accent)]"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      <span className="truncate">{r.fullName}</span>
                      {cloning === r.fullName && (
                        <span className="shrink-0 text-xs text-[var(--muted)]">Cloning…</span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setReviewOpen(!reviewOpen)}
          className={`text-sm ${reviewOpen ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
        >
          Review
        </button>
        <button
          type="button"
          onClick={() => setPreviewUrl(previewUrl ? null : "http://localhost:3000")}
          className={`text-sm ${previewUrl ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
        >
          Preview
        </button>
        <ConnectionStatus />
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted)]">{userName}</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
