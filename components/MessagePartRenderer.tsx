"use client";

import { useState, type ReactNode } from "react";
import type { MessagePart } from "@/lib/web/types";

// ── Path display ──────────────────────────────────────────────────────────────

function FilePath({ path, className = "" }: { path: string; className?: string }) {
  if (!path) return null;
  const norm = path.replace(/\\/g, "/");
  const parts = norm.split("/").filter(Boolean);
  const name = parts.at(-1) ?? path;
  // Show at most 2 parent dir segments, dimmed
  const dirs = parts.slice(0, -1);
  const shortDir = dirs.length > 2 ? `…/${dirs.slice(-2).join("/")}` : dirs.join("/");
  return (
    <span className={`inline-flex max-w-full items-baseline gap-0 overflow-hidden font-mono text-xs ${className}`}>
      {shortDir && (
        <span className="shrink truncate text-[var(--muted)] opacity-70">{shortDir}/</span>
      )}
      <span className="shrink-0 font-semibold text-[var(--foreground)]">{name}</span>
    </span>
  );
}

// ── Output parsing ────────────────────────────────────────────────────────────

/** Parse OpenCode's "N: content" line format from read tool output */
function parseNumberedLines(raw: string): string[] | null {
  const s = raw.replace(/^<content>/, "").replace(/<\/content>$/, "").trim();
  const lines = s.split("\n");
  if (!lines.some((l) => /^\d+: /.test(l))) return null;
  return lines.map((l) => {
    const m = l.match(/^\d+: (.*)$/);
    return m ? m[1] : l;
  });
}

function parseStartLine(raw: string): number {
  const s = raw.replace(/^<content>/, "").trim();
  const m = s.match(/^(\d+): /);
  return m ? parseInt(m[1], 10) : 1;
}

// ── Tool metadata ─────────────────────────────────────────────────────────────

type ToolKind = "bash" | "read" | "edit" | "write" | "glob" | "grep" | "web" | "todo" | "prompt" | "patch" | "list" | "other";

interface ToolMeta {
  kind: ToolKind;
  icon: string;
  label: string;
  borderCls: string;
  badgeCls: string;
}

const TOOLS: Record<string, ToolMeta> = {
  bash:                     { kind: "bash",   icon: "$_", label: "Shell",       borderCls: "border-neutral-600/60",   badgeCls: "bg-neutral-700 text-neutral-200" },
  shell:                    { kind: "bash",   icon: "$_", label: "Shell",       borderCls: "border-neutral-600/60",   badgeCls: "bg-neutral-700 text-neutral-200" },
  read:                     { kind: "read",   icon: "≡",  label: "Read",        borderCls: "border-blue-500/40",      badgeCls: "bg-blue-500/15 text-blue-400" },
  file_read:                { kind: "read",   icon: "≡",  label: "Read",        borderCls: "border-blue-500/40",      badgeCls: "bg-blue-500/15 text-blue-400" },
  edit:                     { kind: "edit",   icon: "±",  label: "Edit",        borderCls: "border-amber-500/40",     badgeCls: "bg-amber-500/15 text-amber-400" },
  str_replace:              { kind: "edit",   icon: "±",  label: "Edit",        borderCls: "border-amber-500/40",     badgeCls: "bg-amber-500/15 text-amber-400" },
  str_replace_based_edit_tool: { kind: "edit", icon: "±", label: "Edit",       borderCls: "border-amber-500/40",     badgeCls: "bg-amber-500/15 text-amber-400" },
  multiedit:                { kind: "edit",   icon: "±",  label: "Multi-Edit",  borderCls: "border-amber-500/40",     badgeCls: "bg-amber-500/15 text-amber-400" },
  write:                    { kind: "write",  icon: "+",  label: "Write",       borderCls: "border-green-500/40",     badgeCls: "bg-green-500/15 text-green-400" },
  file_write:               { kind: "write",  icon: "+",  label: "Write",       borderCls: "border-green-500/40",     badgeCls: "bg-green-500/15 text-green-400" },
  glob:                     { kind: "glob",   icon: "◈",  label: "Glob",        borderCls: "border-purple-500/40",    badgeCls: "bg-purple-500/15 text-purple-400" },
  grep:                     { kind: "grep",   icon: "⌕",  label: "Grep",        borderCls: "border-purple-500/40",    badgeCls: "bg-purple-500/15 text-purple-400" },
  codesearch:               { kind: "grep",   icon: "⌕",  label: "Search",      borderCls: "border-purple-500/40",    badgeCls: "bg-purple-500/15 text-purple-400" },
  web_search:               { kind: "web",    icon: "↗",  label: "Web Search",  borderCls: "border-cyan-500/40",      badgeCls: "bg-cyan-500/15 text-cyan-400" },
  websearch:                { kind: "web",    icon: "↗",  label: "Web Search",  borderCls: "border-cyan-500/40",      badgeCls: "bg-cyan-500/15 text-cyan-400" },
  web_fetch:                { kind: "web",    icon: "↗",  label: "Fetch",       borderCls: "border-cyan-500/40",      badgeCls: "bg-cyan-500/15 text-cyan-400" },
  webfetch:                 { kind: "web",    icon: "↗",  label: "Fetch",       borderCls: "border-cyan-500/40",      badgeCls: "bg-cyan-500/15 text-cyan-400" },
  todo:                     { kind: "todo",   icon: "☐",  label: "Todo",        borderCls: "border-yellow-500/40",    badgeCls: "bg-yellow-500/15 text-yellow-400" },
  todowrite:                { kind: "todo",   icon: "☐",  label: "Todo",        borderCls: "border-yellow-500/40",    badgeCls: "bg-yellow-500/15 text-yellow-400" },
  question:                 { kind: "prompt", icon: "?",  label: "Question",    borderCls: "border-indigo-500/40",    badgeCls: "bg-indigo-500/15 text-indigo-400" },
  confirmation:             { kind: "prompt", icon: "!",  label: "Confirm",     borderCls: "border-indigo-500/40",    badgeCls: "bg-indigo-500/15 text-indigo-400" },
  apply_patch:              { kind: "patch",  icon: "⊕",  label: "Patch",       borderCls: "border-green-500/40",     badgeCls: "bg-green-500/15 text-green-400" },
  list_directory:           { kind: "list",   icon: "⊞",  label: "List Dir",    borderCls: "border-purple-500/40",    badgeCls: "bg-purple-500/15 text-purple-400" },
};

function getMeta(tool: string | undefined): ToolMeta {
  const key = (tool ?? "").toLowerCase().replace(/[^a-z_]/g, "");
  return TOOLS[key] ?? { kind: "other", icon: "◆", label: tool ?? "Tool", borderCls: "border-[var(--border)]", badgeCls: "bg-[var(--muted-bg)] text-[var(--muted)]" };
}

// ── Sub-renderers ─────────────────────────────────────────────────────────────

const MAX_LINES = 30;

function CodeBlock({ content, startLine = 1, lang = "" }: { content: string; startLine?: number; lang?: string }) {
  const [showAll, setShowAll] = useState(false);
  const lines = content.split("\n");
  const visible = showAll ? lines : lines.slice(0, MAX_LINES);
  const hidden = lines.length - MAX_LINES;
  void lang;
  return (
    <div className="relative">
      <pre className="overflow-x-auto px-0 py-0 text-xs font-mono leading-5 text-[var(--foreground)]">
        <table className="w-full border-collapse">
          <tbody>
            {visible.map((line, i) => (
              <tr key={i} className="hover:bg-[var(--muted-bg)]/40">
                <td className="w-10 select-none pr-3 text-right text-[10px] text-[var(--muted)] opacity-50" style={{ userSelect: "none" }}>
                  {startLine + i}
                </td>
                <td className="whitespace-pre-wrap break-all">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </pre>
      {!showAll && hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-1 w-full rounded py-1 text-center text-xs text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
        >
          Show {hidden} more line{hidden !== 1 ? "s" : ""} ▾
        </button>
      )}
    </div>
  );
}

function DiffBlock({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  return (
    <div className="overflow-x-auto text-xs font-mono leading-5">
      {oldStr.split("\n").map((line, i) => (
        <div key={`d${i}`} className="flex gap-2 bg-red-500/10 px-3 py-px text-[var(--error)]">
          <span className="w-4 shrink-0 select-none opacity-60">−</span>
          <span className="whitespace-pre-wrap break-all">{line || " "}</span>
        </div>
      ))}
      {newStr.split("\n").map((line, i) => (
        <div key={`a${i}`} className="flex gap-2 bg-green-500/10 px-3 py-px text-[var(--success)]">
          <span className="w-4 shrink-0 select-none opacity-60">+</span>
          <span className="whitespace-pre-wrap break-all">{line || " "}</span>
        </div>
      ))}
    </div>
  );
}

function OutputBlock({ text }: { text: string }) {
  const [showAll, setShowAll] = useState(false);
  if (!text.trim()) return null;
  const lines = text.split("\n");
  const visible = showAll ? lines : lines.slice(0, MAX_LINES);
  const hidden = lines.length - MAX_LINES;
  return (
    <div className="px-3 py-2">
      <pre className="overflow-x-auto text-xs font-mono leading-5 text-[var(--muted)] whitespace-pre-wrap">
        {visible.join("\n")}
      </pre>
      {!showAll && hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Show {hidden} more line{hidden !== 1 ? "s" : ""} ▾
        </button>
      )}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function ToolCard({
  meta,
  path,
  subtitle,
  children,
  defaultExpanded = false,
}: {
  meta: ToolMeta;
  path?: string;
  subtitle?: string;
  children?: ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasBody = !!children;
  return (
    <div className={`mb-2 overflow-hidden rounded-lg border ${meta.borderCls} bg-[var(--card)]`}>
      {/* Header */}
      <button
        type="button"
        disabled={!hasBody}
        onClick={() => hasBody && setExpanded((e) => !e)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left ${hasBody ? "cursor-pointer hover:bg-[var(--muted-bg)]/60" : "cursor-default"}`}
      >
        {/* Badge */}
        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${meta.badgeCls}`}>
          {meta.icon} {meta.label.toUpperCase()}
        </span>

        {/* Path */}
        {path && <FilePath path={path} className="flex-1 min-w-0" />}

        {/* Subtitle (e.g. command preview) */}
        {subtitle && !path && (
          <span className="flex-1 min-w-0 truncate font-mono text-xs text-[var(--muted)]">{subtitle}</span>
        )}

        {/* Expand arrow */}
        {hasBody && (
          <span className={`ml-auto shrink-0 text-xs text-[var(--muted)] transition-transform ${expanded ? "rotate-90" : ""}`} aria-hidden>
            ▶
          </span>
        )}
      </button>

      {/* Body */}
      {expanded && hasBody && (
        <div className="border-t border-[var(--border)]">{children}</div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MessagePartRendererProps {
  part: MessagePart;
  index: number;
}

export function MessagePartRenderer({ part, index }: MessagePartRendererProps) {
  const type = part.type ?? "text";
  const text = part.text as string | undefined;

  // ── Question / confirmation (non-tool top-level) ──────────────────────────
  if (type === "confirmation" || type === "agent_question") {
    const question =
      (part.question as string | undefined) ??
      (part.description as string | undefined) ??
      (part.message as string | undefined) ??
      (part.prompt as string | undefined) ??
      (part.content as string | undefined) ??
      (part.text as string | undefined) ??
      "";
    const label = (part.label ?? part.buttonLabel ?? part.title ?? "Respond below") as string;
    return (
      <div key={index} className="mb-2 rounded-lg border border-indigo-500/40 bg-indigo-500/5 px-3 py-2">
        {question && <p className="mb-1 text-sm font-medium text-[var(--foreground)]">{question}</p>}
        <p className="text-xs text-[var(--muted)]">{label}</p>
      </div>
    );
  }

  // ── Tool parts ────────────────────────────────────────────────────────────
  if (type === "tool") {
    const toolName = (part.tool ?? part.type) as string | undefined;
    const state = part.state as Record<string, unknown> | undefined;
    const inputObj = (state?.input ?? part.input) as Record<string, unknown> | string | undefined;
    const argsObj = (state?.args ?? part.args) as Record<string, unknown> | undefined;
    const output = String(part.text ?? part.output ?? (state?.output as string | undefined) ?? "");

    const meta = getMeta(toolName);

    // Extract common fields
    const path =
      (typeof inputObj === "object" && inputObj
        ? String(inputObj.file_path ?? inputObj.path ?? inputObj.filePath ?? "")
        : "") ||
      String(argsObj?.file_path ?? argsObj?.path ?? "");

    const command =
      (typeof inputObj === "string" ? inputObj : null) ??
      (typeof inputObj === "object" && inputObj && typeof inputObj.command === "string" ? inputObj.command : null) ??
      (typeof argsObj?.command === "string" ? argsObj.command : null) ??
      (typeof state?.command === "string" ? (state.command as string) : null) ??
      "";

    const oldStr =
      (typeof inputObj === "object" && inputObj
        ? String(inputObj.old_string ?? inputObj.oldString ?? "")
        : "") ||
      String(argsObj?.old_string ?? "");

    const newStr =
      (typeof inputObj === "object" && inputObj
        ? String(inputObj.new_string ?? inputObj.newString ?? "")
        : "") ||
      String(argsObj?.new_string ?? "");

    const contents =
      (typeof inputObj === "object" && inputObj
        ? String(inputObj.contents ?? inputObj.content ?? "")
        : "") ||
      String(argsObj?.contents ?? "");

    const url =
      (typeof inputObj === "object" && inputObj ? String(inputObj.url ?? "") : "") ||
      String(argsObj?.url ?? "");

    const pattern =
      (typeof inputObj === "object" && inputObj
        ? String(inputObj.pattern ?? inputObj.glob ?? inputObj.query ?? "")
        : "") ||
      String(argsObj?.pattern ?? argsObj?.glob ?? argsObj?.query ?? "");

    // ── Question / Confirmation tool ────────────────────────────────────────
    if (meta.kind === "prompt") {
      const question =
        (typeof inputObj === "object" && inputObj
          ? String(inputObj.question ?? inputObj.message ?? inputObj.description ?? "")
          : output) || output;
      return (
        <div key={index} className="mb-2 rounded-lg border border-indigo-500/40 bg-indigo-500/5 px-3 py-2">
          <p className="text-sm font-medium text-[var(--foreground)]">{question || "Respond in the input below"}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Respond in the input below</p>
        </div>
      );
    }

    // ── Bash / Shell ────────────────────────────────────────────────────────
    if (meta.kind === "bash") {
      return (
        <ToolCard key={index} meta={meta} subtitle={command || undefined} defaultExpanded={false}>
          {command && (
            <div className="border-b border-[var(--border)] bg-[#0d1117] px-3 py-2">
              <pre className="font-mono text-xs text-[#7ee787]">
                <span className="mr-2 opacity-60">$</span>{command}
              </pre>
            </div>
          )}
          {output && <OutputBlock text={output} />}
        </ToolCard>
      );
    }

    // ── Read ────────────────────────────────────────────────────────────────
    if (meta.kind === "read") {
      const parsed = output ? parseNumberedLines(output) : null;
      const startLine = output ? parseStartLine(output) : 1;
      const ext = path.split(".").pop()?.toLowerCase() ?? "";
      return (
        <ToolCard key={index} meta={meta} path={path || undefined}>
          {parsed ? (
            <CodeBlock content={parsed.join("\n")} startLine={startLine} lang={ext} />
          ) : output ? (
            <OutputBlock text={output} />
          ) : null}
        </ToolCard>
      );
    }

    // ── Edit / str_replace ──────────────────────────────────────────────────
    if (meta.kind === "edit") {
      const hasEdits = oldStr || newStr || contents;
      return (
        <ToolCard key={index} meta={meta} path={path || undefined} defaultExpanded={false}>
          {hasEdits && (
            <>
              {(oldStr || newStr) && <DiffBlock oldStr={oldStr} newStr={newStr} />}
              {contents && !oldStr && !newStr && (
                <CodeBlock content={contents} lang={path.split(".").pop()?.toLowerCase()} />
              )}
            </>
          )}
          {output && !hasEdits && <OutputBlock text={output} />}
        </ToolCard>
      );
    }

    // ── Write ───────────────────────────────────────────────────────────────
    if (meta.kind === "write") {
      const body = contents || output;
      return (
        <ToolCard key={index} meta={meta} path={path || undefined}>
          {body && <CodeBlock content={body} lang={path.split(".").pop()?.toLowerCase()} />}
        </ToolCard>
      );
    }

    // ── Glob / Grep / Search ────────────────────────────────────────────────
    if (meta.kind === "glob" || meta.kind === "grep") {
      const subtitle = pattern ? `"${pattern}"` : undefined;
      return (
        <ToolCard key={index} meta={meta} subtitle={subtitle}>
          {output && (
            <div className="px-3 py-2">
              {output.split("\n").filter(Boolean).map((line, i) => {
                // Grep results: "path:lineNum:content" — bold the path
                const grepMatch = line.match(/^([^:]+):(\d+):(.*)$/);
                if (grepMatch) {
                  return (
                    <div key={i} className="mb-0.5 flex items-baseline gap-2 text-xs font-mono">
                      <FilePath path={grepMatch[1]} className="shrink-0" />
                      <span className="shrink-0 text-[var(--muted)] opacity-60">{grepMatch[2]}</span>
                      <span className="min-w-0 truncate text-[var(--foreground)] opacity-80">{grepMatch[3]}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} className="mb-0.5">
                    <FilePath path={line} />
                  </div>
                );
              })}
            </div>
          )}
        </ToolCard>
      );
    }

    // ── Web Search / Fetch ──────────────────────────────────────────────────
    if (meta.kind === "web") {
      return (
        <ToolCard key={index} meta={meta} subtitle={url || pattern || undefined}>
          {output && <OutputBlock text={output} />}
        </ToolCard>
      );
    }

    // ── Todo ────────────────────────────────────────────────────────────────
    if (meta.kind === "todo") {
      return (
        <ToolCard key={index} meta={meta}>
          {output && (
            <div className="px-3 py-2 text-xs text-[var(--foreground)]">
              {output.split("\n").filter(Boolean).map((line, i) => {
                const done = /\[x\]|\[X\]|✓|✔/.test(line);
                const clean = line.replace(/^\s*[-*•]\s*/, "").replace(/\[[ xX]\]\s*/, "");
                return (
                  <div key={i} className={`mb-0.5 flex items-start gap-2 ${done ? "opacity-50" : ""}`}>
                    <span className="mt-0.5 shrink-0 font-mono text-[var(--muted)]">{done ? "✓" : "○"}</span>
                    <span className={done ? "line-through" : ""}>{clean}</span>
                  </div>
                );
              })}
            </div>
          )}
        </ToolCard>
      );
    }

    // ── List Directory ──────────────────────────────────────────────────────
    if (meta.kind === "list") {
      return (
        <ToolCard key={index} meta={meta} path={path || undefined}>
          {output && (
            <div className="px-3 py-2 text-xs font-mono text-[var(--foreground)]">
              {output.split("\n").filter(Boolean).slice(0, 60).map((line, i) => (
                <div key={i} className="mb-0.5 truncate text-[var(--muted)]">{line}</div>
              ))}
            </div>
          )}
        </ToolCard>
      );
    }

    // ── Patch ───────────────────────────────────────────────────────────────
    if (meta.kind === "patch") {
      return (
        <ToolCard key={index} meta={meta} path={path || undefined}>
          {output && <OutputBlock text={output} />}
        </ToolCard>
      );
    }

    // ── Generic fallback ────────────────────────────────────────────────────
    return (
      <ToolCard key={index} meta={meta} path={path || undefined} subtitle={command || undefined}>
        {command && (
          <div className="border-b border-[var(--border)] bg-[#0d1117] px-3 py-2">
            <pre className="font-mono text-xs text-[#7ee787]"><span className="mr-2 opacity-60">$</span>{command}</pre>
          </div>
        )}
        {output && <OutputBlock text={output} />}
      </ToolCard>
    );
  }

  // ── Plain text ────────────────────────────────────────────────────────────
  if (text) {
    return (
      <div key={index} className="mb-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">{text}</p>
      </div>
    );
  }

  return null;
}
