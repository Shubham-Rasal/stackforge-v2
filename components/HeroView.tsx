"use client";

import { PromptComposer } from "./PromptComposer";
import { ConnectionStatus } from "./ConnectionStatus";

const SUGGESTIONS = [
  "Add a dark mode toggle to my app",
  "Create a REST API for user authentication",
  "Refactor this component to use hooks",
  "Write tests for the checkout flow",
];

interface HeroViewProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function HeroView({ onSubmit, disabled }: HeroViewProps) {
  return (
    <div className={`hero-gradient flex min-h-screen flex-col items-center justify-center px-4 py-12 ${disabled ? "connecting-pulse" : ""}`}>
      <div className="absolute right-4 top-4">
        <ConnectionStatus />
      </div>
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="animate-fade-in-up flex flex-col gap-3">
          <h1
            className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Build something lovely
          </h1>
          <p
            className="text-lg text-[var(--muted)]"
            style={{ fontSize: "var(--text-subhero)" }}
          >
            Create apps and websites by chatting with AI
          </p>
        </div>

        <div className="animate-fade-in-up animate-delay-1 w-full max-w-xl">
          <PromptComposer
            onSubmit={onSubmit}
            disabled={disabled}
            placeholder="Ask OpenVibe to create a prototype..."
          />
        </div>

        <div className="animate-fade-in-up animate-delay-2 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSubmit(s)}
              disabled={disabled}
              className="pill hover:scale-[1.02] transition-transform"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
