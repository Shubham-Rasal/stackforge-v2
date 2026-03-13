import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError, parseModel } from "@/lib/opencode";
import type { MessageWithParts } from "@/lib/opencode";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await fetchOpenCodeForRequest<MessageWithParts>(
      request,
      `/session/${id}/shell`,
      {
        method: "POST",
        body: {
          agent: body.agent ?? "default",
          model: parseModel(body.model),
          command: body.command ?? "",
        },
      }
    );
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
