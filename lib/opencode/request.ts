import { getInstanceUrlFromRequest, fetchOpenCode } from "./client";
import { getInstanceUrlById, isAllowedInstanceUrl } from "@/lib/workspace/instance";

/**
 * Resolves the OpenCode base URL for a request.
 * Uses instance ID (looked up) or instance URL from headers/query.
 * Returns null to use default; otherwise returns the resolved URL if allowed.
 */
export function getBaseUrlForRequest(request: Request): string | null {
  const raw = getInstanceUrlFromRequest(request, getInstanceUrlById);
  if (!raw) return null;
  if (isAllowedInstanceUrl(raw)) return raw;
  return null;
}

/** Fetch from OpenCode using the instance URL from the request (if any). */
export function fetchOpenCodeForRequest<T = unknown>(
  request: Request,
  path: string,
  options: Parameters<typeof fetchOpenCode>[1] = {}
): Promise<T> {
  const baseUrlOverride = getBaseUrlForRequest(request);
  return fetchOpenCode<T>(path, { ...options, baseUrlOverride });
}
