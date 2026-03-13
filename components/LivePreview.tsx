"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/web/store";

const DEFAULT_PORTS = [3000, 3001, 4096, 5173, 8080];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

export function LivePreview() {
  const { previewUrl, setPreviewUrl } = useAppStore();
  const [urlInput, setUrlInput] = useState(() => previewUrl ?? "http://localhost:3000");
  const [iframeKey, setIframeKey] = useState(0);

  const effectiveUrl = previewUrl ?? "http://localhost:3000";
  const safeUrl = (() => {
    try {
      const u = new URL(normalizeUrl(effectiveUrl));
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      return u.href;
    } catch {
      return "";
    }
  })();

  const handleGo = useCallback(() => {
    const url = normalizeUrl(urlInput);
    if (url) {
      setPreviewUrl(url);
      setIframeKey((k) => k + 1);
    }
  }, [urlInput, setPreviewUrl]);

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleClose = useCallback(() => {
    setPreviewUrl(null);
  }, [setPreviewUrl]);

  return (
    <div className="flex min-w-[320px] flex-1 flex-col border-l border-[var(--border)] bg-[var(--background)]">
      {/* Browser-like bar */}
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
            title="Refresh"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGo()}
          placeholder="http://localhost:3000"
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 font-mono text-xs text-[var(--foreground)] focus:border-[var(--border-focus)] focus:outline-none"
        />
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleGo}
            className="rounded px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-muted)]"
          >
            Go
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
          >
            Close
          </button>
        </div>
      </header>

      {/* Quick port shortcuts */}
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-[var(--border)] bg-[var(--card)] px-3 py-1.5">
        {DEFAULT_PORTS.map((port) => (
          <button
            key={port}
            type="button"
            onClick={() => {
              const url = `http://localhost:${port}`;
              setUrlInput(url);
              setPreviewUrl(url);
              setIframeKey((k) => k + 1);
            }}
            className={`rounded px-2 py-0.5 text-xs ${
              effectiveUrl.includes(`:${port}`)
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
            }`}
          >
            :{port}
          </button>
        ))}
      </div>

      {/* Iframe */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        {safeUrl ? (
          <iframe
            key={iframeKey}
            src={safeUrl}
            title="Live preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-[var(--muted)]">
            Enter a URL (e.g. http://localhost:3000) and click Go
          </div>
        )}
      </div>
    </div>
  );
}
