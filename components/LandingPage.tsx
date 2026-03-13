"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export function LandingPage() {
  const { data: session, status } = useSession();

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        background: "radial-gradient(ellipse 80% 80% at 100% 100%, #7c3aed22 0%, #a855f711 40%, transparent 70%), #ffffff",
      }}
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-white/70 px-6 py-3 backdrop-blur-sm">
        <Link href="/" className="text-lg font-semibold text-[var(--foreground)]">
          OpenVibe
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/projects"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Go to Projects
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
              >
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
          <div className="animate-fade-in-up flex flex-col gap-4">
            <h1
              className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Ready to ship something amazing?
            </h1>
            <p className="text-lg text-[var(--muted)]">
              Vibe coding with OpenCode. Build apps and websites by chatting with
              AI—with full access to your GitHub repos.
            </p>
          </div>

          <div className="animate-fade-in-up animate-delay-1 flex flex-col items-center gap-4">
            {status === "loading" ? (
              <div className="flex items-center justify-center gap-2 py-4 text-[var(--muted)]">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                Loading...
              </div>
            ) : session ? (
              <Link
                href="/projects"
                className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-base"
              >
                Open Projects
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => signIn("github", { callbackUrl: "/projects" })}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-base"
                >
                  <GitHubIcon className="h-5 w-5" />
                  Sign in with GitHub
                </button>
                <p className="text-sm text-[var(--muted)]">
                  Sign in to access your repositories and start building
                </p>
              </>
            )}
          </div>

          <div className="animate-fade-in-up animate-delay-2 flex flex-wrap justify-center gap-4 text-sm text-[var(--muted)]">
            <span>Chat with AI</span>
            <span>•</span>
            <span>Edit code</span>
            <span>•</span>
            <span>Run shell commands</span>
            <span>•</span>
            <span>GitHub integration</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
