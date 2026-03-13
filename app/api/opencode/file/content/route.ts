import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";
import type { FileContent } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json(
      { error: "Missing required query parameter: path" },
      { status: 400 }
    );
  }
  try {
    const content = await fetchOpenCodeForRequest<FileContent>(request, "/file/content", {
      searchParams: { path },
    });
    return NextResponse.json(content);
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
