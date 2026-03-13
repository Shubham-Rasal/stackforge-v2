import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest } from "@/lib/opencode";
import { handleRouteError } from "@/lib/api-route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await fetchOpenCodeForRequest<boolean>(req, `/session/${id}/summarize`, {
      method: "POST",
      body: { providerID: body.providerID, modelID: body.modelID },
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
