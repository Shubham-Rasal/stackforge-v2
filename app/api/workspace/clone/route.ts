import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { cloneAndSpawn } from "@/lib/workspace/instance";
import { handleRouteError } from "@/lib/api-route";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;

    const body = await request.json().catch(() => ({}));
    const fullName = body.fullName as string | undefined;
    const repoUrl = (body.repoUrl as string | undefined) ?? (fullName ? `https://github.com/${fullName}.git` : undefined);

    if (!fullName || !repoUrl) {
      return NextResponse.json(
        { error: "fullName or repoUrl required" },
        { status: 400 }
      );
    }

    const info = await cloneAndSpawn(repoUrl, fullName, accessToken);

    return NextResponse.json({
      instanceId: info.instanceId,
      port: info.port,
      baseUrl: info.baseUrl,
      fullName: info.fullName,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
