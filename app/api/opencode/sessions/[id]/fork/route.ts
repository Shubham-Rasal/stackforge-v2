import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";
import type { Session } from "@/lib/opencode";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await fetchOpenCodeForRequest<Session>(req, `/session/${id}/fork`, {
      method: "POST",
      body: { messageID: body.messageID },
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
