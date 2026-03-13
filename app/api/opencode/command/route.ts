import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchOpenCodeForRequest<unknown[]>(request, "/command");
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
