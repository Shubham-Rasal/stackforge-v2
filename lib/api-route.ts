import { NextResponse } from "next/server";
import { OpenCodeClientError } from "@/lib/opencode";

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof OpenCodeClientError) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 502 }
    );
  }
  return NextResponse.json({ error: "Server error" }, { status: 502 });
}
