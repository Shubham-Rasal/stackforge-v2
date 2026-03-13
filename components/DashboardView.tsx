"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { safeResJson } from "@/lib/safe-json";
import { openLocalPath, cloneAndOpenRepo } from "@/lib/web/api";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  private: boolean;
}

export function DashboardView() {
  const router = useRouter();
  const { data: session } = useSession();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [localPath, setLocalPath] = useState("");
  const [localError, setLocalError] = useState("");

  const userName = (session?.user?.name ?? session?.user?.email ?? "there").split(" ")[0];

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

  async function handleClone(repo: Repo) {
    setBusy(repo.fullName);
    try {
      const result = await cloneAndOpenRepo(repo.fullName);
      router.push(`/project/${repo.name}?instanceId=${result.instanceId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to open repo");
      setBusy(null);
    }
  }

  async function handleBrowse() {
    try {
      const res = await fetch("/api/workspace/pick-directory");
      const data = await res.json();
      if (data.path) setLocalPath(data.path);
    } catch {
      // ignore — user cancelled or not supported
    }
  }

  async function handleOpenLocal(e: React.FormEvent) {
    e.preventDefault();
    const path = localPath.trim();
    if (!path) return;
    setLocalError("");
    setBusy("local");
    try {
      const result = await openLocalPath(path);
      router.push(`/project/${encodeURIComponent(result.name)}?instanceId=${result.instanceId}`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to open path");
      setBusy(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-[var(--gray-800)] text-white">
        <div className="flex flex-col gap-6 p-4">
          <div className="mt-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">
              OpenVibe
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--gray-400)]">
              Navigation
            </p>
            <nav className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 rounded-lg bg-[var(--gray-700)] px-3 py-2 text-sm">
                <GridIcon className="h-4 w-4 text-[var(--gray-400)]" />
                Projects
              </div>
            </nav>
          </div>
        </div>

        <div className="mt-auto border-t border-[var(--gray-700)] p-4">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--gray-400)] hover:text-white"
          >
            <SettingsIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6 py-3">
          <span className="text-lg font-semibold text-[var(--foreground)]">Projects</span>
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-muted)] text-sm font-medium text-[var(--accent)]">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <h1 className="mb-8 text-2xl font-semibold text-[var(--foreground)]">
            Welcome back, <span className="text-[var(--accent)]">{userName}</span>
          </h1>

          {/* Open local directory */}
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Open local project</h2>
            <form onSubmit={handleOpenLocal} className="flex gap-2">
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/Users/you/projects/my-app"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleBrowse}
                title="Browse for folder"
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
              >
                Browse…
              </button>
              <button
                type="submit"
                disabled={busy === "local" || !localPath.trim()}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {busy === "local" ? "Opening…" : "Open"}
              </button>
            </form>
            {localError && (
              <p className="mt-2 text-xs text-[var(--error)]">{localError}</p>
            )}
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Enter the absolute path to any local directory. OpenCode will start in that directory.
            </p>
          </section>

          {/* GitHub repos */}
          <section>
            <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
              GitHub repositories
              {repos.length > 0 && (
                <span className="ml-2 rounded-full bg-[var(--muted-bg)] px-2 py-0.5 text-xs font-normal text-[var(--muted)]">
                  {repos.length}
                </span>
              )}
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reposLoading ? (
                <>
                  <div className="skeleton h-28 rounded-lg" />
                  <div className="skeleton h-28 rounded-lg" />
                  <div className="skeleton h-28 rounded-lg" />
                </>
              ) : repos.length === 0 ? (
                <p className="col-span-3 text-sm text-[var(--muted)]">No repositories found.</p>
              ) : (
                repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="group relative rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
                  >
                    <h3 className="mb-1 font-medium text-[var(--foreground)]">{repo.name}</h3>
                    <p className="mb-3 text-xs text-[var(--muted)]">
                      {repo.private ? "Private" : "Public"} · {repo.fullName}
                    </p>
                    <div className="flex items-center justify-between">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                      >
                        GitHub <ExternalIcon className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleClone(repo)}
                        disabled={busy !== null}
                        className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        {busy === repo.fullName ? "Cloning…" : "Clone & Open"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}


function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
