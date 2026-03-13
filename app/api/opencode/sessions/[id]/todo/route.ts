import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await fetchOpenCodeForRequest<unknown[]>(request, `/session/${id}/todo`);
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
