import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await fetchOpenCodeForRequest<boolean>(request, `/session/${id}/abort`, {
      method: "POST",
    });
    return NextResponse.json(result);
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
