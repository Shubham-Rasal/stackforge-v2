import { NextRequest } from "next/server";
import { streamSSE, getBaseUrlForRequest } from "@/lib/opencode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const baseUrlOverride = getBaseUrlForRequest(request);
  try {
    const stream = await streamSSE("/event", { baseUrlOverride });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response("Stream unavailable", { status: 502 });
  }
}
