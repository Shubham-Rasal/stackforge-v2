"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PromptComposerProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

const MIN_ROWS = 1;
const MAX_ROWS = 6;
const LINE_HEIGHT = 24;

export function PromptComposer({
  placeholder = "Ask OpenVibe to build something...",
  onSubmit,
  disabled = false,
  compact = false,
  className = "",
}: PromptComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lines = el.value.split("\n").length;
    const rows = Math.min(Math.max(lines, MIN_ROWS), MAX_ROWS);
    el.style.height = `${rows * LINE_HEIGHT}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    resizeTextarea();
  }, [value, disabled, onSubmit, resizeTextarea]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div
      className={`composer-card flex flex-col overflow-hidden transition-all duration-200 ${compact ? "rounded-xl" : "rounded-2xl"} ${className}`}
    >
      <div className={`flex items-end gap-2 ${compact ? "p-2.5" : "p-4"}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={MIN_ROWS}
          className="min-h-[24px] max-h-[144px] flex-1 resize-none border-0 bg-transparent py-1 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0"
          style={{ fontSize: "var(--text-body)", lineHeight: `${LINE_HEIGHT}px` }}
          aria-label="Message"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--accent)]"
          aria-label="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
