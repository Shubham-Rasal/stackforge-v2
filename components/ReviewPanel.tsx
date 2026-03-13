"use client";

import { useState, useEffect } from "react";
import { getApi } from "@/lib/web/api";
import { useAppStore } from "@/lib/web/store";

interface FileDiffItem {
  path?: string;
  file_path?: string;
  filePath?: string;
  input?: { path?: string; file_path?: string; filePath?: string };
  file?: { path?: string; file_path?: string };
  name?: string;
  filename?: string;
  from?: string;
  to?: string;
  additions?: number;
  deletions?: number;
  added?: number;
  removed?: number;
  hunks?: unknown[];
  old_string?: string;
  new_string?: string;
  diff?: string;
  raw?: string;
  [key: string]: unknown;
}

/** Extract file path from unified diff header (diff --git a/path b/path, --- a/path, or +++ b/path). */
function pathFromDiffContent(str: unknown): string | undefined {
  if (typeof str !== "string") return undefined;
  const lines = str.split("\n");
  const first = lines[0];
  if (!first) return undefined;
  const gitMatch = first.match(/^diff --git\s+a\/(.+?)\s+b\//);
  if (gitMatch) return gitMatch[1].trim();
  const headerMatch = first.match(/^(?:---|\+\+\+)\s+(?:a|b)\/(.+)$/);
  if (headerMatch) return headerMatch[1].trim();
  const second = lines[1];
  if (second) {
    const secondMatch = second.match(/^(?:---|\+\+\+)\s+(?:a|b)\/(.+)$/);
    if (secondMatch) return secondMatch[1].trim();
  }
  return undefined;
}

function getPath(item: FileDiffItem): string {
  const path =
    (item.path as string | undefined) ??
    (item.file_path as string | undefined) ??
    (item.filePath as string | undefined) ??
    (item.input && typeof item.input === "object"
      ? ((item.input as { path?: string; file_path?: string; filePath?: string }).path ??
        (item.input as { path?: string; file_path?: string; filePath?: string }).file_path ??
        (item.input as { path?: string; file_path?: string; filePath?: string }).filePath)
      : undefined) ??
    (item.file && typeof item.file === "object"
      ? ((item.file as { path?: string; file_path?: string }).path ??
        (item.file as { path?: string; file_path?: string }).file_path)
      : undefined) ??
    (typeof item.file === "string" ? item.file : undefined) ??
    (item.name as string | undefined) ??
    (item.filename as string | undefined) ??
    (item.from as string | undefined) ??
    (item.to as string | undefined) ??
    (Array.isArray(item.hunks) && item.hunks.length > 0 && item.hunks[0] && typeof item.hunks[0] === "object"
      ? ((item.hunks[0] as { path?: string; file_path?: string; filePath?: string }).path ??
        (item.hunks[0] as { path?: string; file_path?: string; filePath?: string }).file_path ??
        (item.hunks[0] as { path?: string; file_path?: string; filePath?: string }).filePath)
      : undefined) ??
    pathFromDiffContent(item.old_string) ??
    pathFromDiffContent(item.new_string) ??
    pathFromDiffContent(item.diff) ??
    pathFromDiffContent(item.raw);
  return path ?? "";
}

function getAdditions(item: FileDiffItem): number {
  return (item.additions ?? item.added ?? 0) as number;
}

function getDeletions(item: FileDiffItem): number {
  return (item.deletions ?? item.removed ?? 0) as number;
}

/** Compute a line-level diff using LCS and return unified-diff-style lines. */
function computeLineDiff(before: string, after: string): string {
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];
  const m = a.length, n = b.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack
  const ops: { type: "keep" | "del" | "add"; line: string }[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: "keep", line: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "add", line: b[j - 1] });
      j--;
    } else {
      ops.unshift({ type: "del", line: a[i - 1] });
      i--;
    }
  }

  return ops.map((op) => (op.type === "del" ? `-${op.line}` : op.type === "add" ? `+${op.line}` : ` ${op.line}`)).join("\n");
}

/** Build unified diff text from item. */
function getDiffContent(item: FileDiffItem): string {
  const raw = (item.diff ?? item.raw) as string | undefined;
  if (typeof raw === "string" && raw.trim()) return raw;

  // OpenCode API returns before/after as full file contents
  const before = item.before != null ? String(item.before) : null;
  const after = item.after != null ? String(item.after) : null;
  if (before !== null || after !== null) {
    return computeLineDiff(before ?? "", after ?? "");
  }

  const oldStr = item.old_string != null ? String(item.old_string) : "";
  const newStr = item.new_string != null ? String(item.new_string) : "";
  if (!oldStr && !newStr) {
    const hunks = item.hunks as { lines?: string[] }[] | undefined;
    if (Array.isArray(hunks) && hunks.length > 0) {
      return hunks.flatMap((h) => h.lines ?? []).join("\n");
    }
    return "";
  }
  return computeLineDiff(oldStr, newStr);
}

export function ReviewPanel() {
  const { sessionId, activeInstanceId, setReviewOpen } = useAppStore();
  const [diffs, setDiffs] = useState<FileDiffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setDiffs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getApi(activeInstanceId)
      .getSessionDiff(sessionId)
      .then((data) => {
        const arr = Array.isArray(data)
          ? (data as FileDiffItem[])
          : (data && typeof data === "object" && "files" in data && Array.isArray((data as { files: unknown }).files))
            ? ((data as { files: FileDiffItem[] }).files)
            : (data && typeof data === "object" && "diffs" in data && Array.isArray((data as { diffs: unknown }).diffs))
              ? ((data as { diffs: FileDiffItem[] }).diffs)
              : [];
        setDiffs(arr);
        if (arr.length === 1) setExpandedPath(getPath(arr[0]));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load changes");
        setDiffs([]);
      })
      .finally(() => setLoading(false));
  }, [sessionId, activeInstanceId]);

  const totalAdditions = diffs.reduce((s, d) => s + getAdditions(d), 0);
  const totalDeletions = diffs.reduce((s, d) => s + getDeletions(d), 0);

  return (
    <div className="flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--background)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-[var(--foreground)]">Session changes</h2>
          {diffs.length > 0 && (
            <span className="rounded-full bg-[var(--muted-bg)] px-2 py-0.5 text-xs text-[var(--muted)]">
              {diffs.length} file{diffs.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setReviewOpen(false)}
          className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
        >
          Close
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            Loading changes...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}
        {!loading && !error && diffs.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--muted)]">
            {sessionId ? "No changes in this session yet." : "Select a session to view changes."}
          </p>
        )}
        {!loading && !error && diffs.length > 0 && (
          <div className="space-y-1">
            <div className="mb-2 flex gap-2 text-xs text-[var(--muted)]">
              <span className="text-[var(--success)]">+{totalAdditions}</span>
              <span className="text-[var(--error)]">−{totalDeletions}</span>
            </div>
            {diffs.map((item) => {
              const path = getPath(item);
              const adds = getAdditions(item);
              const dels = getDeletions(item);
              const isNew = adds > 0 && dels === 0;
              const isExpanded = expandedPath === path;
              const diffContent = getDiffContent(item);
              const hasContent = diffContent.length > 0;

              return (
                <div
                  key={path || Math.random()}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedPath(isExpanded ? null : path)}
                    onKeyDown={(e) => e.key === "Enter" && setExpandedPath(isExpanded ? null : path)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)]"
                  >
                    <span className="min-w-0 truncate font-mono text-[var(--foreground)]" title={path}>
                      {path || "Unknown file"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {isNew && (
                        <span className="text-[10px] font-medium uppercase text-[var(--success)]">Added</span>
                      )}
                      <span className="text-xs text-[var(--muted)]">
                        +{adds} −{dels}
                      </span>
                      <span className="text-[var(--muted)]">{isExpanded ? "▾" : "▸"}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] bg-[var(--background)] p-3">
                      {!hasContent && <p className="text-xs text-[var(--muted)]">No diff content available.</p>}
                      <pre className="max-h-96 overflow-auto font-mono text-xs">
                        {diffContent.split("\n").map((line, i) => {
                          const isDel = line.startsWith("-") && !line.startsWith("---");
                          const isAdd = line.startsWith("+") && !line.startsWith("+++");
                          return (
                            <div
                              key={i}
                              className={
                                isDel
                                  ? "text-[var(--error)]"
                                  : isAdd
                                    ? "text-[var(--success)]"
                                    : "text-[var(--muted)]"
                              }
                            >
                              {line || " "}
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
