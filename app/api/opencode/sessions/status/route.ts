import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  try {
    const status = await fetchOpenCodeForRequest<Record<string, { status?: string; running?: boolean }>>(request, "/session/status");
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof OpenCodeClientError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 502 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 502 });
  }
}
