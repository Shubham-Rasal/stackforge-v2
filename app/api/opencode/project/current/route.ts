import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  try {
    const project = await fetchOpenCodeForRequest<{ name?: string; path?: string }>(
      request,
      "/project/current"
    );
    return NextResponse.json(project);
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
