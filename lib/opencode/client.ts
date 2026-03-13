/**
 * OpenCode HTTP client (server-only).
 * Provides fetch wrappers with auth, timeout, and error handling.
 */

import { opencodeConfig } from "./config";
import { safeResJson } from "../safe-json";
import type { HealthResponse } from "./types";

const { baseUrl, authHeader, timeoutMs, requestIdHeader } = opencodeConfig;

const INSTANCE_HEADER = "x-opencode-instance-url";
const INSTANCE_ID_HEADER = "x-opencode-instance-id";

export function getInstanceUrlFromRequest(
  request: Request,
  getUrlById?: (id: string) => string | null
): string | null {
  try {
    const u = new URL(request.url);
    const instanceId = u.searchParams.get("instanceId") ?? request.headers.get(INSTANCE_ID_HEADER);
    if (instanceId && getUrlById) {
      const url = getUrlById(instanceId);
      if (url) return url;
    }
    const instanceUrl = u.searchParams.get("instanceUrl") ?? request.headers.get(INSTANCE_HEADER);
    if (instanceUrl) return decodeURIComponent(instanceUrl);
    return null;
  } catch {
    return null;
  }
}

export function getBaseUrl(instanceUrl: string | null): string {
  if (instanceUrl && instanceUrl.startsWith("http")) return instanceUrl.replace(/\/$/, "");
  return baseUrl;
}

function buildHeaders(requestId?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeader,
  };
  if (requestId) headers[requestIdHeader] = requestId;
  return headers;
}

export class OpenCodeClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "OpenCodeClientError";
  }
}

export async function fetchOpenCode<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
    body?: unknown;
    searchParams?: Record<string, string>;
    requestId?: string;
    baseUrlOverride?: string | null;
  } = {}
): Promise<T> {
  const { method = "GET", body, searchParams, requestId, baseUrlOverride } = options;
  const targetBase = getBaseUrl(baseUrlOverride ?? null);
  const url = new URL(path.startsWith("/") ? path : `/${path}`, targetBase);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }
  const headers = buildHeaders(requestId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const reqId = res.headers.get(requestIdHeader) ?? requestId;
    if (!res.ok) {
      const errBody = await safeResJson<{ message?: string }>(res, {});
      const detail = errBody.message ?? res.statusText;
      throw new OpenCodeClientError(
        `OpenCode ${res.status}: ${detail}`,
        res.status,
        reqId ?? undefined
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await safeResJson(res, undefined)) as T;
    }
    return undefined as T;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof OpenCodeClientError) throw err;
    if (err instanceof Error) {
      throw new OpenCodeClientError(
        err.name === "AbortError" ? "Request timed out" : err.message,
        undefined,
        requestId
      );
    }
    throw new OpenCodeClientError("Unknown error", undefined, requestId);
  }
}

export async function healthCheck(baseUrlOverride?: string | null): Promise<HealthResponse> {
  return fetchOpenCode<HealthResponse>("/global/health", { baseUrlOverride });
}

/**
 * Stream SSE from OpenCode endpoint. Yields raw event data strings.
 * Caller is responsible for parsing SSE format.
 */
export async function streamSSE(
  path: string,
  options: {
    searchParams?: Record<string, string>;
    requestId?: string;
    onChunk?: (chunk: string) => void;
    baseUrlOverride?: string | null;
  } = {}
): Promise<ReadableStream<Uint8Array>> {
  const { searchParams, requestId, baseUrlOverride } = options;
  const targetBase = getBaseUrl(baseUrlOverride ?? null);
  const url = new URL(path.startsWith("/") ? path : `/${path}`, targetBase);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }
  const headers = buildHeaders(requestId);

  const res = await fetch(url, {
    method: "GET",
    headers: { ...headers, Accept: "text/event-stream" },
    // No timeout for SSE - connection stays open
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new OpenCodeClientError(
      `OpenCode ${res.status}: ${detail}`,
      res.status,
      requestId
    );
  }

  const body = res.body;
  if (!body) throw new OpenCodeClientError("No response body");

  return body;
}
