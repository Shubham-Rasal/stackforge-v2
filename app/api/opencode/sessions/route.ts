import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";
import type { Session } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  try {
    const sessions = await fetchOpenCodeForRequest<Session[]>(request, "/session");
    return NextResponse.json(sessions);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = await fetchOpenCodeForRequest<Session>(request, "/session", {
      method: "POST",
      body: { parentID: body.parentID, title: body.title },
    });
    return NextResponse.json(session);
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
