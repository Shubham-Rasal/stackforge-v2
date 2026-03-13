"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/web/store";
import { getApi } from "@/lib/web/api";

type Tab = "files" | "todo";

type TreeNode = { name: string; children: Record<string, TreeNode>; isFile: boolean };

const IGNORED_DIRS = new Set([
  "node_modules", ".pnpm", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", ".tox", "target", "vendor",
]);

function isIgnoredPath(p: string): boolean {
  return p.split("/").some((seg) => IGNORED_DIRS.has(seg));
}

function buildTree(paths: string[]): Record<string, TreeNode> {
  const root: Record<string, TreeNode> = {};
  for (const p of paths) {
    if (isIgnoredPath(p)) continue;
    const isDir = p.endsWith("/");
    const parts = p.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length === 0) continue;
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isFile = isLast && !isDir;
      if (!current[part]) {
        current[part] = { name: part, children: {}, isFile };
      }
      if (!isLast || isDir) {
        current = current[part].children;
      }
    }
  }
  return root;
}

function FileTree({
  nodes,
  prefix = "",
  level = 0,
  onSelect,
}: {
  nodes: Record<string, TreeNode>;
  prefix?: string;
  level?: number;
  onSelect?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const entries = Object.entries(nodes).sort(([a], [b]) => {
    const aIsDir = !nodes[a].isFile;
    const bIsDir = !nodes[b].isFile;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  return (
    <ul className={level === 0 ? "flex flex-col" : "ml-3 border-l border-[var(--border)] pl-2"}>
      {entries.map(([key, node]) => {
        const hasChildren = Object.keys(node.children).length > 0;
        const isExpanded = expanded[key] ?? (level === 0);
        const fullPath = prefix ? `${prefix}/${key}` : key;
        return (
          <li key={fullPath} className="py-0.5">
            <button
              type="button"
              onClick={() => {
                if (node.isFile && onSelect) {
                  onSelect(fullPath);
                } else {
                  setExpanded((e) => ({ ...e, [key]: !isExpanded }));
                }
              }}
              className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted-bg)]"
            >
              <span className="w-4 shrink-0 text-[var(--muted)]">
                {node.isFile ? " " : isExpanded ? "▾" : "▸"}
              </span>
              <span className="truncate">{node.name}</span>
            </button>
            {!node.isFile && isExpanded && hasChildren && (
              <FileTree
                nodes={node.children}
                prefix={fullPath}
                level={level + 1}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ToolsPanel() {
  const { sessionId, activeInstanceId, setSelectedPath } = useAppStore();
  const [tab, setTab] = useState<Tab>("files");
  const [fileQuery, setFileQuery] = useState("");
  const [fileResults, setFileResults] = useState<string[]>([]);
  const [fileTree, setFileTree] = useState<Record<string, TreeNode>>({});
  const [fileLoading, setFileLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(true);
  const [todoData, setTodoData] = useState<unknown[]>([]);
  const [todoLoading, setTodoLoading] = useState(false);

  useEffect(() => {
    if (tab === "files") {
      setTreeLoading(true);
      const a = getApi(activeInstanceId);
      a.listAllPaths(".")
        .then((paths) => setFileTree(buildTree(paths.filter((p) => !isIgnoredPath(p)))))
        .catch(() =>
          a.findFiles("", { limit: 500 }).then((p) => setFileTree(buildTree(p.filter((p) => !isIgnoredPath(p)))))
        )
        .finally(() => setTreeLoading(false));
    }
  }, [tab, activeInstanceId]);

  useEffect(() => {
    if (tab === "todo" && sessionId) {
      setTodoLoading(true);
      getApi(activeInstanceId)
        .getSessionTodo(sessionId)
        .then(setTodoData)
        .catch(() => setTodoData([]))
        .finally(() => setTodoLoading(false));
    }
  }, [tab, sessionId, activeInstanceId]);

  async function searchFiles() {
    if (!fileQuery.trim()) return;
    setFileLoading(true);
    setFileResults([]);
    try {
      const paths = await getApi(activeInstanceId).findFiles(fileQuery.trim());
      setFileResults(paths.filter((p) => !isIgnoredPath(p)));
    } catch {
      setFileResults([]);
    } finally {
      setFileLoading(false);
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--card)]">
      <div className="flex flex-wrap border-b border-[var(--border)]">
        {(["files", "todo"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "files" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={fileQuery}
                onChange={(e) => setFileQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchFiles()}
                placeholder="Search files..."
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--border-focus)] focus:outline-none"
              />
              <button
                type="button"
                onClick={searchFiles}
                disabled={fileLoading}
                className="btn-secondary shrink-0"
              >
                Search
              </button>
            </div>
            {treeLoading && !fileQuery && <div className="skeleton h-32 w-full" />}
            {!treeLoading && !fileQuery && (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {Object.keys(fileTree).length > 0 ? (
                  <FileTree
                    nodes={fileTree}
                    onSelect={(path) => setSelectedPath(path)}
                  />
                ) : null}
                {!treeLoading && !fileQuery && Object.keys(fileTree).length === 0 ? (
                  <p className="py-4 text-center text-sm text-[var(--muted)]">
                    No files found. Try searching.
                  </p>
                ) : null}
              </div>
            )}
            {fileQuery && (
              <>
                {fileLoading && <div className="skeleton h-20 w-full" />}
                {!fileLoading && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {fileResults.map((path) => (
                      <li key={path}>
                        <button
                          type="button"
                          onClick={() => setSelectedPath(path)}
                          className="w-full truncate rounded px-2 py-1 text-left font-mono text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
                        >
                          {path}
                        </button>
                      </li>
                    ))}
                    {fileResults.length === 0 && (
                      <p className="py-2 text-center text-sm text-[var(--muted)]">
                        No matches
                      </p>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
        {tab === "todo" && (
          <div className="flex flex-col gap-1">
            {!sessionId && (
              <p className="text-sm text-[var(--muted)]">Select a session.</p>
            )}
            {sessionId && todoLoading && <div className="skeleton h-20 w-full" />}
            {sessionId && !todoLoading && todoData.length > 0 && (
              <ul className="max-h-60 space-y-0.5 overflow-y-auto">
                {(todoData as { content?: string; status?: string; description?: string; text?: string; completed?: boolean }[]).map((item, i) => {
                  const raw = item as Record<string, unknown>;
                  const rawText =
                    raw.content ??
                    raw.description ??
                    raw.text ??
                    (typeof item === "string" ? item : raw.title ?? raw.label);
                  const text =
                    typeof rawText === "string" ? rawText : rawText != null ? String(rawText) : "—";
                  const done =
                    item.status === "completed" ||
                    item.completed === true ||
                    item.status === "cancelled";
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-2 py-1.5 text-[13px]"
                    >
                      <span
                        className={`mt-[3px] shrink-0 text-[11px] ${
                          done ? "text-[var(--muted)]" : "text-[var(--foreground)]"
                        }`}
                        aria-hidden
                      >
                        {done ? "✓" : "○"}
                      </span>
                      <span
                        className={`min-w-0 flex-1 break-words ${
                          done
                            ? "text-[var(--muted)] line-through opacity-60"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {text || "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {sessionId && !todoLoading && todoData.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--muted)]">
                No todos yet.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
