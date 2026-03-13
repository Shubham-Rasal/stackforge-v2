import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query");
    if (!query) {
      return NextResponse.json(
        { error: "Missing required query parameter: query" },
        { status: 400 }
      );
    }
    const data = await fetchOpenCodeForRequest<unknown[]>(req, "/find/symbol", {
      searchParams: { query },
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
