"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getApi } from "@/lib/web/api";
import { useAppStore } from "@/lib/web/store";

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "rb", "go", "rs", "java", "kt", "scala",
  "c", "cpp", "h", "hpp", "cs", "php",
  "swift", "m", "mm",
  "sql", "graphql", "gql",
  "html", "htm", "css", "scss", "sass", "less",
  "json", "yaml", "yml", "toml", "xml", "md", "markdown",
  "sh", "bash", "zsh", "fish",
  "vue", "svelte", "astro",
]);

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (CODE_EXTENSIONS.has(ext)) {
    const map: Record<string, string> = {
      mjs: "javascript", cjs: "javascript",
      md: "markdown", markdown: "markdown",
      h: "c", hpp: "cpp", mm: "objectivec",
    };
    return map[ext] ?? ext;
  }
  return "text";
}

interface FileViewerProps {
  path: string;
  onClose: () => void;
}

export function FileViewer({ path, onClose }: FileViewerProps) {
  const { activeInstanceId } = useAppStore();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getApi(activeInstanceId)
      .getFileContent(path)
      .then((res) => {
        setContent(res.content ?? "");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load file");
      })
      .finally(() => setLoading(false));
  }, [path, activeInstanceId]);

  const language = getLanguage(path);
  const isCode = CODE_EXTENSIONS.has(path.split(".").pop()?.toLowerCase() ?? "");

  return (
    <div className="flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--background)]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <span className="truncate font-mono text-sm text-[var(--foreground)]" title={path}>
            {path}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
        >
          Close
        </button>
      </header>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            Loading...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-[var(--error)] bg-red-50 px-4 py-3 text-sm text-[var(--error)] dark:bg-red-950/30">
            {error}
          </div>
        )}
        {!loading && !error && content !== null && (
          <div className="overflow-hidden rounded border border-[var(--border)] bg-[var(--card)]">
            {isCode ? (
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: "0.75rem 1rem",
                  fontSize: "12px",
                  background: "var(--card)",
                  minHeight: "120px",
                }}
                codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
                lineNumberStyle={{ minWidth: "2em", opacity: 0.5 }}
              >
                {content}
              </SyntaxHighlighter>
            ) : (
              <pre className="overflow-auto p-3 font-mono text-xs text-[var(--foreground)] whitespace-pre-wrap">
                {content}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
