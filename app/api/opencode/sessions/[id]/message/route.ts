import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError, parseModel } from "@/lib/opencode";
import type { MessageWithParts } from "@/lib/opencode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const limit = request.nextUrl.searchParams.get("limit");
  try {
    const data = await fetchOpenCodeForRequest<{ info: unknown; parts: unknown[] }[]>(
      request,
      `/session/${id}/message`,
      { searchParams: limit ? { limit } : undefined }
    );
    return NextResponse.json(data);
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await fetchOpenCodeForRequest<MessageWithParts>(
      request,
      `/session/${id}/message`,
      {
        method: "POST",
        body: {
          messageID: body.messageID,
          model: parseModel(body.model),
          agent: body.agent,
          noReply: body.noReply,
          system: body.system,
          tools: body.tools,
          parts: body.parts ?? [],
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
