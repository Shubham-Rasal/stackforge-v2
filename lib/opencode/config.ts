/**
 * OpenCode server configuration (server-only).
 * Set OPENCODE_BASE_URL, OPENCODE_SERVER_USERNAME, OPENCODE_SERVER_PASSWORD in env.
 */

function getBaseUrl(): string {
  const url = process.env.OPENCODE_BASE_URL ?? "http://127.0.0.1:4096";
  return url.replace(/\/$/, "");
}

function getAuthHeader(): Record<string, string> | undefined {
  const password = process.env.OPENCODE_SERVER_PASSWORD;
  if (!password) return undefined;

  const username = process.env.OPENCODE_SERVER_USERNAME ?? "opencode";
  const encoded = Buffer.from(`${username}:${password}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

export const opencodeConfig = {
  baseUrl: getBaseUrl(),
  authHeader: getAuthHeader(),
  timeoutMs: Number(process.env.OPENCODE_TIMEOUT_MS) || 120_000,
  requestIdHeader: "x-request-id",
} as const;
