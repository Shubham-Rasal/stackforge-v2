import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";
import type { FileMatch } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  const pattern = request.nextUrl.searchParams.get("pattern");
  if (!pattern) {
    return NextResponse.json(
      { error: "Missing required query parameter: pattern" },
      { status: 400 }
    );
  }
  try {
    const results = await fetchOpenCodeForRequest<FileMatch[]>(request, "/find", {
      searchParams: { pattern },
    });
    return NextResponse.json(results);
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
