import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";

export interface FileNode {
  name?: string;
  path?: string;
  type?: "file" | "directory";
  children?: FileNode[];
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? ".";
  try {
    const nodes = await fetchOpenCodeForRequest<FileNode[]>(request, "/file", {
      searchParams: { path },
    });
    return NextResponse.json(Array.isArray(nodes) ? nodes : []);
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
