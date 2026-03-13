import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? ".";
  const searchParams: Record<string, string> = { query };
  const type = request.nextUrl.searchParams.get("type");
  if (type) searchParams.type = type;
  const limit = request.nextUrl.searchParams.get("limit");
  if (limit) searchParams.limit = limit;
  const directory = request.nextUrl.searchParams.get("directory");
  if (directory) searchParams.directory = directory;

  try {
    const paths = await fetchOpenCodeForRequest<string[]>(request, "/find/file", {
      searchParams,
    });
    return NextResponse.json(paths);
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
