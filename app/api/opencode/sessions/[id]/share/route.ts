import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";
import type { Session } from "@/lib/opencode";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await fetchOpenCodeForRequest<Session>(request, `/session/${id}/share`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await fetchOpenCodeForRequest<Session>(request, `/session/${id}/share`, {
      method: "DELETE",
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
