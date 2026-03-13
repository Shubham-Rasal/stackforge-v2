"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const DAPP_IDEAS = [
  "Build a Bitcoin-backed DeFi lending protocol on Stacks...",
  "Create an NFT marketplace secured by Bitcoin...",
  "Deploy a DAO governance contract in Clarity...",
  "Build a decentralized stacking pool with STX rewards...",
  "Create a Bitcoin yield farming protocol...",
  "Build a cross-chain DEX bridging STX and BTC...",
  "Deploy a prediction market secured by Bitcoin...",
  "Create a decentralized crowdfunding platform on Stacks...",
  "Build a Bitcoin-native identity and reputation system...",
  "Create a trustless escrow protocol using Clarity...",
];

const TYPING_SPEED = 40;
const ERASING_SPEED = 18;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_ERASE = 400;

function useTypewriter(items: string[]) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "erasing" | "waiting">("typing");

  useEffect(() => {
    const current = items[index];

    if (phase === "typing") {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), TYPING_SPEED);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("erasing"), PAUSE_AFTER_TYPE);
        return () => clearTimeout(t);
      }
    }

    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), ERASING_SPEED);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          setIndex((i) => (i + 1) % items.length);
          setPhase("typing");
        }, PAUSE_AFTER_ERASE);
        return () => clearTimeout(t);
      }
    }
  }, [displayed, phase, index, items]);

  return displayed;
}

export function LandingPage() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const placeholder = useTypewriter(DAPP_IDEAS);

  function handleSubmit() {
    if (!session) {
      signIn("github", { callbackUrl: "/projects" });
    } else {
      window.location.href = "/projects";
    }
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 0% 0%, #fdf4ee 0%, #fde8d8 30%, #f5b89a 60%, #e8875a 85%, #d4623a 100%)",
      }}
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2">
          <StacksIcon className="h-6 w-6" />
          <span
            className="text-base font-semibold"
            style={{ color: "#1a1a2e", fontFamily: "var(--font-sans)" }}
          >
            stackforge
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/projects"
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.35)",
                  color: "#1a1a2e",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                Projects
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#1a1a2e",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/projects" })}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.35)",
                color: "#1a1a2e",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          {/* Heading */}
          <div className="flex flex-col gap-3 animate-fade-in-up">
            <h1
              className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl"
              style={{
                color: "#1a1a2e",
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.02em",
              }}
            >
              What do you want to
              <br />
              build on <span style={{ color: "#ffffff", fontWeight: 800 }}>Stacks</span>?
            </h1>
            <p
              className="text-lg"
              style={{ color: "#4a4a6a", fontFamily: "var(--font-sans)" }}
            >
              Build Bitcoin-powered apps with AI agents
            </p>
          </div>

          {/* Composer Card */}
          <div
            className="animate-fade-in-up animate-delay-1 w-full rounded-2xl p-4 shadow-xl"
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
            }}
          >
            {/* Text area */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder || "Describe what you want the AI agent to do..."}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              className="w-full resize-none bg-transparent text-base outline-none placeholder:text-gray-400"
              style={{
                color: "#1a1a2e",
                fontFamily: "var(--font-sans)",
                lineHeight: "1.6",
              }}
            />

            {/* Bottom bar */}
            <div className="mt-2 flex items-center justify-between">
              {/* Left — provider badges */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <OpenCodeIcon className="h-4 w-4" />
                  OpenCode
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                  style={{
                    background: "#f3f4f6",
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  Claude Sonnet
                </div>
              </div>

              {/* Right — action icons + submit */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  style={{ color: "#6b7280" }}
                  title="GitHub repos"
                >
                  <GitHubIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  style={{ color: "#6b7280" }}
                  title="Settings"
                >
                  <SettingsIcon className="h-4 w-4" />
                </button>

                {/* Submit button */}
                {status === "loading" ? (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: "#d1d5db" }}
                  >
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: session
                        ? "#1a1a2e"
                        : prompt.length > 0
                        ? "#1a1a2e"
                        : "#9ca3af",
                      color: "white",
                    }}
                    title={session ? "Go to Projects" : "Sign in with GitHub"}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sign in note when not authenticated */}
            {!session && status !== "loading" && (
              <p
                className="mt-3 border-t pt-3 text-center text-xs"
                style={{
                  color: "#9ca3af",
                  borderColor: "#f3f4f6",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Sign in with GitHub to start building
              </p>
            )}
          </div>

          {/* Feature pills */}
          <div className="animate-fade-in-up animate-delay-2 flex flex-wrap justify-center gap-2">
            {["Smart contracts", "Bitcoin DeFi", "NFT platforms", "DAO tooling"].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-sm"
                style={{
                  background: "rgba(255,255,255,0.3)",
                  color: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.5)",
                  backdropFilter: "blur(8px)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 justify-center px-8 py-4">
        <p
          className="text-xs"
          style={{ color: "rgba(26,26,46,0.5)", fontFamily: "var(--font-sans)" }}
        >
          Powered by{" "}
          <a
            href="https://stacks.co"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: "rgba(26,26,46,0.7)" }}
          >
            Stacks
          </a>{" "}
          &amp;{" "}
          <a
            href="https://opencode.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: "rgba(26,26,46,0.7)" }}
          >
            OpenCode
          </a>
        </p>
      </footer>
    </div>
  );
}

function StacksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#1a1a2e" />
      <path d="M6 8h12M6 12h12M6 16h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function OpenCodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 8l4-4 4 4-4 4-4-4z" fill="#6366f1" />
      <path d="M8 4l4 4-4 4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  );
}
