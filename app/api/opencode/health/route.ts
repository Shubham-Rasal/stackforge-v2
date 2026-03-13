import { NextRequest, NextResponse } from "next/server";
import { healthCheck, OpenCodeClientError, opencodeConfig, getBaseUrlForRequest } from "@/lib/opencode";

export async function GET(request: NextRequest) {
  const baseUrlOverride = getBaseUrlForRequest(request);
  try {
    const health = await healthCheck(baseUrlOverride);
    const expected = baseUrlOverride ?? opencodeConfig.baseUrl;
    return NextResponse.json({ ...health, expectedUrl: expected });
  } catch (err) {
    const expected = baseUrlOverride ?? opencodeConfig.baseUrl;
    if (err instanceof OpenCodeClientError) {
      return NextResponse.json(
        { healthy: false, error: err.message, expectedUrl: expected },
        { status: err.status ?? 502 }
      );
    }
    return NextResponse.json(
      { healthy: false, error: "Server error", expectedUrl: expected },
      { status: 502 }
    );
  }
}
