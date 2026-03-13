/**
 * Safe JSON parsing to avoid "Unexpected end of JSON input" and similar errors.
 */

export function safeParseJson<T = unknown>(input: string, fallback: T): T {
  if (typeof input !== "string" || !input.trim()) return fallback;
  try {
    const parsed = JSON.parse(input) as T;
    return parsed;
  } catch {
    return fallback;
  }
}

export async function safeResJson<T = unknown>(res: Response, fallback: T): Promise<T> {
  const text = await res.text();
  return safeParseJson(text, fallback) as T;
}
