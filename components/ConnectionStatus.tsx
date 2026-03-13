"use client";

import { useState, useEffect } from "react";
import { safeResJson } from "@/lib/safe-json";
import { useEventStream } from "@/lib/web/useEventStream";
import { useAppStore } from "@/lib/web/store";
import { getApi } from "@/lib/web/api";

type Status = "checking" | "connected" | "disconnected";

interface HealthResponse {
  healthy?: boolean;
  error?: string;
  expectedUrl?: string;
  version?: string;
}

function parsePort(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}

function shortenPath(p: string): string {
  const parts = p.replace(/\/$/, "").split("/");
  if (parts.length <= 3) return p;
  return "…/" + parts.slice(-2).join("/");
}

export function ConnectionStatus() {
  const { activeInstanceId } = useAppStore();
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string | null>(null);
  const [expectedUrl, setExpectedUrl] = useState<string | null>(null);
  const [workDir, setWorkDir] = useState<string | null>(null);

  const { status: streamStatus } = useEventStream(undefined, activeInstanceId);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const headers: Record<string, string> = {};
        if (activeInstanceId) headers["x-opencode-instance-id"] = activeInstanceId;
        const res = await fetch("/api/opencode/health", { headers });
        const data: HealthResponse = await safeResJson(res, {});
        if (cancelled) return;
        if (res.ok && data.healthy) {
          setStatus("connected");
          setDetail(data.version ? `v${data.version}` : null);
          setExpectedUrl(data.expectedUrl ?? null);
          // Fetch working directory
          try {
            const projectApi = getApi(activeInstanceId);
            const project = await projectApi.getProjectCurrent();
            if (!cancelled) setWorkDir(project.path ?? null);
          } catch {
            if (!cancelled) setWorkDir(null);
          }
        } else {
          setStatus("disconnected");
          setDetail(data.error ?? "Unknown error");
          setExpectedUrl(data.expectedUrl ?? null);
          setWorkDir(null);
        }
      } catch {
        if (!cancelled) {
          setStatus("disconnected");
          setDetail("Network error");
          setExpectedUrl(null);
          setWorkDir(null);
        }
      }
    }
    check();
    return () => { cancelled = true; };
  }, [activeInstanceId]);

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <span>Checking…</span>
      </div>
    );
  }

  if (status === "connected") {
    const port = parsePort(expectedUrl);
    return (
      <div className="flex items-center gap-1.5 text-sm" title={`${expectedUrl ?? ""}${workDir ? `\n${workDir}` : ""}`}>
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" />
        <span className="text-[var(--success)]">Connected</span>
        {streamStatus === "connected" && (
          <span className="text-[var(--muted)]">·</span>
        )}
        {port && (
          <span className="font-mono text-xs text-[var(--muted)]">:{port}</span>
        )}
        {workDir && (
          <>
            <span className="text-[var(--muted)]">·</span>
            <span className="max-w-[180px] truncate font-mono text-xs text-[var(--muted)]" title={workDir}>
              {shortenPath(workDir)}
            </span>
          </>
        )}
        {detail && (
          <span className="text-xs text-[var(--muted)]">({detail})</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <p className="font-medium">Cannot reach OpenCode server</p>
      {detail && <p className="mt-0.5 text-amber-700">{detail}</p>}
      {expectedUrl && (
        <p className="mt-1 font-mono text-xs text-amber-600">
          Expected: {expectedUrl}
        </p>
      )}
      <p className="mt-2 text-amber-700">
        Run <code className="rounded bg-amber-100 px-1">opencode serve</code> in a terminal, then refresh.
      </p>
    </div>
  );
}
