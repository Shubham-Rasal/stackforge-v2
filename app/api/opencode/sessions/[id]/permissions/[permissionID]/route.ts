import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; permissionID: string }> }
) {
  try {
    const { id, permissionID } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await fetchOpenCodeForRequest<boolean>(
      req,
      `/session/${id}/permissions/${permissionID}`,
      {
        method: "POST",
        body: { response: body.response, remember: body.remember },
      }
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
