/**
 * Typed browser API client for OpenCode proxy endpoints.
 */

import { safeResJson } from "@/lib/safe-json";
import type { Session, MessageWithParts, HealthResponse } from "./types";

const BASE = "/api/opencode";
const INSTANCE_HEADER = "x-opencode-instance-id";

function instanceHeaders(instanceId?: string | null): Record<string, string> {
  if (!instanceId) return {};
  return { [INSTANCE_HEADER]: instanceId };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await safeResJson<Record<string, unknown>>(res, {});
  if (!res.ok) {
    const msg = (data.error as string) ?? res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

function createApi(instanceId?: string | null) {
  const headers = instanceHeaders(instanceId);
  const mergeHeaders = (init?: HeadersInit) => ({
    ...headers,
    ...(init && typeof init === "object" && !(init instanceof Headers)
      ? (init as Record<string, string>)
      : {}),
  });

  return {
    async health(): Promise<HealthResponse> {
      const res = await fetch(`${BASE}/health`, { headers: mergeHeaders() });
      const data = await safeResJson<HealthResponse>(res, { healthy: false });
      return data as HealthResponse;
    },

    async listSessions(): Promise<Session[]> {
      const res = await fetch(`${BASE}/sessions`, { headers: mergeHeaders() });
    const data = await handleResponse<Session[] | { error: string }>(res);
      return Array.isArray(data) ? data : [];
    },

    async createSession(body?: { title?: string; parentID?: string }): Promise<Session> {
      const res = await fetch(`${BASE}/sessions`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body ?? {}),
      });
      return handleResponse<Session>(res);
    },

    async getSession(id: string): Promise<Session> {
      const res = await fetch(`${BASE}/sessions/${id}`, { headers: mergeHeaders() });
      return handleResponse<Session>(res);
    },

    async updateSession(id: string, body: { title?: string }): Promise<Session> {
      const res = await fetch(`${BASE}/sessions/${id}`, {
        method: "PATCH",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      return handleResponse<Session>(res);
    },

    async deleteSession(id: string): Promise<boolean> {
      const res = await fetch(`${BASE}/sessions/${id}`, {
        method: "DELETE",
        headers: mergeHeaders(),
      });
      return handleResponse<boolean>(res);
    },

    async getSessionStatus(): Promise<Record<string, { status?: string; running?: boolean }>> {
      const res = await fetch(`${BASE}/sessions/status`, { headers: mergeHeaders() });
      return handleResponse(res);
    },

    async abortSession(id: string): Promise<boolean> {
      const res = await fetch(`${BASE}/sessions/${id}/abort`, {
        method: "POST",
        headers: mergeHeaders(),
      });
      return handleResponse<boolean>(res);
    },

    async listMessages(sessionId: string, limit?: number): Promise<MessageWithParts[]> {
      const url =
        limit != null
          ? `${BASE}/sessions/${sessionId}/message?limit=${limit}`
          : `${BASE}/sessions/${sessionId}/message`;
      const res = await fetch(url, { headers: mergeHeaders() });
    const data = await handleResponse<MessageWithParts[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async sendMessage(
      sessionId: string,
      body: { parts: MessageWithParts["parts"]; model?: string; agent?: string }
    ): Promise<MessageWithParts> {
      const res = await fetch(`${BASE}/sessions/${sessionId}/message`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      return handleResponse<MessageWithParts>(res);
    },

    async sendMessageAsync(
      sessionId: string,
      body: { parts: MessageWithParts["parts"]; model?: string; agent?: string }
    ): Promise<void> {
      const res = await fetch(`${BASE}/sessions/${sessionId}/prompt_async`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
    if (!res.ok) {
      const data = await safeResJson<{ error?: string }>(res, {});
      const msg = data.error ?? res.statusText;
      throw new Error(msg);
    }
    },

    async runShell(
      sessionId: string,
      body: { command: string; agent?: string; model?: string }
    ): Promise<MessageWithParts> {
      const res = await fetch(`${BASE}/sessions/${sessionId}/shell`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ agent: "default", ...body }),
      });
      return handleResponse<MessageWithParts>(res);
    },

    async findFiles(query: string, opts?: { type?: string; limit?: number }): Promise<string[]> {
      const params = new URLSearchParams({ query });
      if (opts?.type) params.set("type", opts.type);
      if (opts?.limit) params.set("limit", String(opts.limit));
      const res = await fetch(`${BASE}/find/file?${params}`, { headers: mergeHeaders() });
    const data = await handleResponse<string[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async listDirectory(path = "."): Promise<{ name?: string; path?: string; type?: string }[]> {
      const res = await fetch(`${BASE}/file?path=${encodeURIComponent(path)}`, {
        headers: mergeHeaders(),
      });
    const data = await handleResponse<{ name?: string; path?: string; type?: string }[]>(res);
    return Array.isArray(data) ? data : [];
  },

  /** Recursively list all files and directories in the project, respecting .gitignore. */
  async listAllPaths(rootPath = "."): Promise<string[]> {
    const paths: string[] = [];
    const visited = new Set<string>();
    const listDir = this.listDirectory.bind(this);
    const getContent = this.getFileContent.bind(this);

    // Always-ignored directory names (safety net even without .gitignore)
    const ALWAYS_IGNORE = new Set([
      "node_modules", ".pnpm", ".git", ".next", "dist", "build",
      "__pycache__", ".venv", "venv", ".tox", "target", "vendor",
      ".cache", ".turbo", ".vercel", "out", "coverage", ".nyc_output",
    ]);

    // Parse .gitignore patterns into a Set of ignored segment names
    const gitignoreIgnored = new Set<string>();
    try {
      const gi = await getContent(".gitignore");
      if (gi.content) {
        for (const raw of gi.content.split("\n")) {
          const line = raw.trim();
          if (!line || line.startsWith("#") || line.startsWith("!")) continue;
          // Extract the top-level name: strip leading slash, trailing slash, and wildcards
          const name = line.replace(/^\//, "").replace(/\/$/, "").split("/")[0];
          if (name && !name.includes("*") && !name.includes("?")) {
            gitignoreIgnored.add(name);
          }
        }
      }
    } catch { /* no .gitignore — fine */ }

    function shouldSkip(name: string): boolean {
      return ALWAYS_IGNORE.has(name) || gitignoreIgnored.has(name);
    }

    async function walk(dir: string) {
      const key = dir === "." ? "/" : `/${dir}`;
      if (visited.has(key)) return;
      visited.add(key);

      try {
        const nodes = await listDir(dir);
        for (const n of nodes) {
          const name = n.name ?? "";
          const fullPath = (n.path ?? (dir === "." ? name : `${dir}/${name}`)).replace(/^\.\//, "");
          const isDir = n.type === "directory";

          if (isDir) {
            if (shouldSkip(name)) continue; // skip without pushing or recursing
            paths.push(`${fullPath}/`);
            await walk(fullPath);
          } else {
            paths.push(fullPath);
          }
        }
      } catch {
        // ignore failed directories
      }
    }

    await walk(rootPath);
    return paths;
  },

    async getFileContent(path: string): Promise<{ path?: string; content?: string }> {
      const res = await fetch(`${BASE}/file/content?path=${encodeURIComponent(path)}`, {
        headers: mergeHeaders(),
      });
      return handleResponse(res);
    },

    async getSessionChildren(id: string): Promise<Session[]> {
      const res = await fetch(`${BASE}/sessions/${id}/children`, { headers: mergeHeaders() });
    const data = await handleResponse<Session[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async getSessionTodo(id: string): Promise<unknown[]> {
      const res = await fetch(`${BASE}/sessions/${id}/todo`, { headers: mergeHeaders() });
    const data = await handleResponse<unknown[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async forkSession(id: string, messageID?: string): Promise<Session> {
      const res = await fetch(`${BASE}/sessions/${id}/fork`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ messageID }),
      });
      return handleResponse<Session>(res);
    },

    async shareSession(id: string): Promise<Session> {
      const res = await fetch(`${BASE}/sessions/${id}/share`, {
        method: "POST",
        headers: mergeHeaders(),
      });
      return handleResponse<Session>(res);
    },

    async unshareSession(id: string): Promise<Session> {
      const res = await fetch(`${BASE}/sessions/${id}/share`, {
        method: "DELETE",
        headers: mergeHeaders(),
      });
      return handleResponse<Session>(res);
    },

    async getSessionDiff(id: string, messageID?: string): Promise<unknown[]> {
      const params = messageID ? `?messageID=${encodeURIComponent(messageID)}` : "";
      const res = await fetch(`${BASE}/sessions/${id}/diff${params}`, {
        headers: mergeHeaders(),
      });
    const data = await handleResponse<unknown[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async summarizeSession(id: string, providerID: string, modelID: string): Promise<boolean> {
      const res = await fetch(`${BASE}/sessions/${id}/summarize`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ providerID, modelID }),
      });
      return handleResponse<boolean>(res);
    },

    async revertMessage(id: string, messageID: string, partID?: string): Promise<boolean> {
      const res = await fetch(`${BASE}/sessions/${id}/revert`, {
        method: "POST",
        headers: mergeHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ messageID, partID }),
      });
      return handleResponse<boolean>(res);
    },

    async unrevertSession(id: string): Promise<boolean> {
      const res = await fetch(`${BASE}/sessions/${id}/unrevert`, {
        method: "POST",
        headers: mergeHeaders(),
      });
      return handleResponse<boolean>(res);
    },

    async respondToPermission(
      sessionId: string,
      permissionID: string,
      response: boolean,
      remember?: boolean
    ): Promise<boolean> {
      const res = await fetch(
        `${BASE}/sessions/${sessionId}/permissions/${permissionID}`,
        {
          method: "POST",
          headers: mergeHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ response, remember }),
        }
      );
      return handleResponse<boolean>(res);
    },

    async listCommands(): Promise<unknown[]> {
      const res = await fetch(`${BASE}/command`, { headers: mergeHeaders() });
    const data = await handleResponse<unknown[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async findSymbols(query: string): Promise<unknown[]> {
      const res = await fetch(
        `${BASE}/find/symbol?query=${encodeURIComponent(query)}`,
        { headers: mergeHeaders() }
      );
    const data = await handleResponse<unknown[]>(res);
      return Array.isArray(data) ? data : [];
    },

    async getProviders(): Promise<{
    all: unknown[];
    default: Record<string, string>;
      connected: string[];
    }> {
      const res = await fetch(`${BASE}/provider`, { headers: mergeHeaders() });
      return handleResponse(res);
    },

    async getProviderAuth(): Promise<Record<string, unknown[]>> {
      const res = await fetch(`${BASE}/provider/auth`, { headers: mergeHeaders() });
      return handleResponse(res);
    },

    async getConfigProviders(): Promise<{
    providers?: { id: string; name?: string; models?: { id: string; name?: string }[] }[];
      default?: Record<string, string>;
    }> {
      const res = await fetch(`${BASE}/config/providers`, { headers: mergeHeaders() });
      return handleResponse(res);
    },

    async getProjectCurrent(): Promise<{ name?: string; path?: string }> {
      const res = await fetch(`${BASE}/project/current`, { headers: mergeHeaders() });
      return handleResponse(res);
    },
  };
}

export const api = createApi(null);

export function getApi(instanceId?: string | null) {
  return createApi(instanceId);
}

export interface CloneResult {
  instanceId: string;
  port: number;
  baseUrl: string;
  fullName: string;
}

export async function cloneAndOpenRepo(
  fullName: string,
  repoUrl?: string
): Promise<CloneResult> {
  const res = await fetch("/api/workspace/clone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName,
      repoUrl: repoUrl ?? `https://github.com/${fullName}.git`,
    }),
  });
  const data = await safeResJson<CloneResult & { error?: string }>(res, {} as CloneResult & { error?: string });
  if (!res.ok) {
    throw new Error(data.error ?? "Clone failed");
  }
  if (!(data as CloneResult).instanceId) {
    throw new Error("Invalid response from clone API");
  }
  return data as CloneResult;
}

export interface OpenLocalResult {
  instanceId: string;
  baseUrl: string;
  name: string;
}

export async function openLocalPath(localPath: string): Promise<OpenLocalResult> {
  const res = await fetch("/api/workspace/open-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ localPath }),
  });
  const data = await safeResJson<OpenLocalResult & { error?: string }>(res, {} as OpenLocalResult & { error?: string });
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Failed to open local path");
  }
  return data as OpenLocalResult;
}
