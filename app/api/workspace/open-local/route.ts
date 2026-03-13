import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { spawnLocal } from "@/lib/workspace/instance";
import { handleRouteError } from "@/lib/api-route";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const localPath = body.localPath as string | undefined;

    if (!localPath) {
      return NextResponse.json({ error: "localPath required" }, { status: 400 });
    }

    const info = await spawnLocal(localPath);

    return NextResponse.json({
      instanceId: info.instanceId,
      baseUrl: info.baseUrl,
      name: path.basename(info.repoPath),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
