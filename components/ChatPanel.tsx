"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/lib/web/store";
import { PromptComposer } from "./PromptComposer";
import { ModelChooser } from "./ModelChooser";
import { MessagePartRenderer } from "./MessagePartRenderer";
import type { MessageWithParts } from "@/lib/web/types";

/** Extract all plain text from a message for copying */
function extractText(msg: MessageWithParts): string {
  return msg.parts
    .map((p) => {
      if (p.text) return String(p.text);
      const state = p.state as Record<string, unknown> | undefined;
      const out = state?.output ?? p.output;
      if (out) return String(out);
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [getText]);
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy message"
      className="rounded p-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

type InputMode = "chat" | "shell";

interface ChatPanelProps {
  sessionId: string | null;
  initialPrompt?: string;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const {
    messages,
    sending,
    messagesError,
    running,
    streamingMessage,
    thinking,
    sendMessage,
    abortSession,
    runShell,
    setToast,
  } = useAppStore();
  const [inputMode, setInputMode] = useState<InputMode>("chat");
  const [shellLoading, setShellLoading] = useState(false);
  const [lastShellResult, setLastShellResult] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleShellSubmit = async (cmd: string) => {
    setShellLoading(true);
    setLastShellResult(null);
    try {
      const result = await runShell(cmd);
      setLastShellResult(result ?? "Command executed.");
      setToast(result ?? "Command executed.");
    } finally {
      setShellLoading(false);
    }
  };

  const pendingQuestion = (() => {
    if (!streamingMessage?.parts?.length) return null;
    const last = streamingMessage.parts[streamingMessage.parts.length - 1];
    const p = last as Record<string, unknown>;
    const type = p?.type as string | undefined;
    const tool = p?.tool ?? p?.type;
    if (type === "confirmation" || type === "agent_question") {
      return (
        (p.question ?? p.description ?? p.message ?? p.prompt ?? p.content ?? p.text) as string
      ) || null;
    }
    if ((tool === "question" || tool === "confirmation") && (type === "tool" || !type)) {
      const state = p.state as Record<string, unknown> | undefined;
      const inputObj = (state?.input ?? p.input) as Record<string, unknown> | undefined;
      const args = (state?.args ?? p.args) as Record<string, unknown> | undefined;
      return (
        (p.question ?? p.description ?? p.text ?? p.output ??
          (typeof inputObj === "object" && inputObj
            ? inputObj.question ?? inputObj.description ?? inputObj.message
            : undefined) ??
          args?.question
      ) as string | undefined) || null;
    }
    if (type === "text" && p.text) {
      const t = String(p.text);
      const askMatch = t.match(/(?:I should ask them?|I need to ask|Let me ask)\s+([\s\S]+?)(?:\.|$)/i);
      if (askMatch?.[1]) {
        const q = askMatch[1].trim().replace(/\bthey\b/gi, "you").replace(/\btheir\b/gi, "your");
        if (q.length > 5) return q;
      }
      if (t.includes("ask them") || t.includes("ask you")) {
        const afterAsk = t.replace(/^[\s\S]*?(?:ask them|ask you)\s+([\s\S]+?)(?:\.|$)/i, "$1").trim();
        if (afterAsk && afterAsk.length > 10) return afterAsk.replace(/\bthey\b/gi, "you");
      }
    }
    return null;
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  if (!sessionId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-[var(--muted)]">
        <p>Select or create a session to start chatting.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => {
          const isUser = msg.info.role === "user";
          const textParts = msg.parts.filter((p) => p.type === "text" && p.text);
          return (
            <div
              key={msg.info.id + String(i)}
              className={`group mb-4 flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-left ${
                  isUser
                    ? "rounded-tr-sm bg-[var(--accent)] text-white"
                    : "rounded-tl-sm bg-[var(--muted-bg)] text-[var(--foreground)]"
                }`}
              >
                {isUser ? (
                  msg.parts.map((p, j) =>
                    p.text ? (
                      <p key={j} className="whitespace-pre-wrap text-sm leading-relaxed">
                        {String(p.text)}
                      </p>
                    ) : null
                  )
                ) : (
                  <div className="space-y-1">
                    {msg.parts.map((p, j) => {
                      if (p.type === "text" && p.text) {
                        return (
                          <ReactMarkdown
                            key={j}
                            components={{
                              p: ({ children }) => <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold">{children}</h1>,
                              h2: ({ children }) => <h2 className="mb-1.5 mt-3 text-sm font-bold">{children}</h2>,
                              h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>,
                              code: ({ children, className }) => {
                                const isBlock = className?.includes("language-");
                                return isBlock ? (
                                  <code className="block overflow-x-auto rounded-lg bg-[var(--background)] px-3 py-2 font-mono text-xs leading-5">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="rounded bg-[var(--background)] px-1 py-0.5 font-mono text-xs">
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg bg-[var(--background)] text-xs">{children}</pre>,
                              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 text-sm">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-sm">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--muted)]">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100">{children}</a>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              hr: () => <hr className="my-3 border-[var(--border)]" />,
                            }}
                          >
                            {String(p.text)}
                          </ReactMarkdown>
                        );
                      }
                      return <MessagePartRenderer key={j} part={p} index={j} />;
                    })}
                  </div>
                )}
              </div>
              {/* Copy button row */}
              <div className={`mt-1 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100 ${isUser ? "flex-row-reverse" : ""}`}>
                <CopyButton getText={() => extractText(msg)} />
                {!isUser && textParts.length > 0 && (
                  <span className="text-[10px] text-[var(--muted)]">AI</span>
                )}
              </div>
            </div>
          );
        })}
        {streamingMessage && (
          <div className="group mb-4 flex flex-col items-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[var(--muted-bg)] px-4 py-3 text-left text-[var(--foreground)]">
              <div className="space-y-1">
                {streamingMessage.parts.map((p, j) => {
                  if (p.type === "text" && p.text) {
                    return (
                      <ReactMarkdown
                        key={j}
                        components={{
                          p: ({ children }) => <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>,
                          code: ({ children, className }) => {
                            const isBlock = className?.includes("language-");
                            return isBlock ? (
                              <code className="block overflow-x-auto rounded-lg bg-[var(--background)] px-3 py-2 font-mono text-xs leading-5">{children}</code>
                            ) : (
                              <code className="rounded bg-[var(--background)] px-1 py-0.5 font-mono text-xs">{children}</code>
                            );
                          },
                          pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg bg-[var(--background)] text-xs">{children}</pre>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 text-sm">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-sm">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {String(p.text)}
                      </ReactMarkdown>
                    );
                  }
                  return <MessagePartRenderer key={j} part={p} index={j} />;
                })}
              </div>
              {thinking && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                  Thinking…
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100">
              <CopyButton getText={() => extractText(streamingMessage)} />
            </div>
          </div>
        )}
        {messagesError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-[var(--error)]">
            {messagesError}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-0.5">
              <button
                type="button"
                onClick={() => { setInputMode("chat"); setLastShellResult(null); }}
                className={`flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors ${
                  inputMode === "chat"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-label="Chat mode"
                title="Chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => { setInputMode("shell"); setLastShellResult(null); }}
                className={`flex items-center justify-center rounded-md px-2.5 py-1.5 font-mono text-sm transition-colors ${
                  inputMode === "shell"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                aria-label="Shell mode"
                title="Run shell command"
              >
                <span className="font-mono">&gt;_</span>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <PromptComposer
                onSubmit={
                  inputMode === "chat" ? sendMessage : handleShellSubmit
                }
                disabled={
                  inputMode === "chat" ? sending : shellLoading
                }
                compact
                placeholder={
                  inputMode === "chat"
                    ? (pendingQuestion || "Ask anything...")
                    : "Run shell command..."
                }
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ModelChooser />
              {running && (
                <button
                  type="button"
                  onClick={() => abortSession()}
                  className="rounded-md border border-[var(--border)] bg-[var(--muted-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
                >
                  Abort
                </button>
              )}
            </div>
            <span className="text-xs text-[var(--muted)]">
              {sending ? "Sending…" : thinking ? "Thinking…" : shellLoading ? "Running…" : inputMode === "shell" ? "Run command in session" : "Shift+Enter for new line"}
            </span>
          </div>
          {inputMode === "shell" && lastShellResult && (
            <pre className="mt-2 max-h-24 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-3 py-2 font-mono text-xs text-[var(--foreground)]">
              {lastShellResult}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
