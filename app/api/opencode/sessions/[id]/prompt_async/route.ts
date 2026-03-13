import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError, parseModel } from "@/lib/opencode";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    await fetchOpenCodeForRequest(
      request,
      `/session/${id}/prompt_async`,
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
    return new Response(null, { status: 204 });
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
