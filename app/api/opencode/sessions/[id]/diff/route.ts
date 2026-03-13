import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messageID = req.nextUrl.searchParams.get("messageID");
    const searchParams = messageID ? { messageID } : undefined;
    const data = await fetchOpenCodeForRequest<unknown[]>(req, `/session/${id}/diff`, {
      searchParams,
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
