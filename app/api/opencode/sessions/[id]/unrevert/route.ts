import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await fetchOpenCodeForRequest<boolean>(request, `/session/${id}/unrevert`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
