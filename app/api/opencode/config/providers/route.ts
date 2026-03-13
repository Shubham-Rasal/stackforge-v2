import { NextRequest, NextResponse } from "next/server";
import { fetchOpenCodeForRequest, OpenCodeClientError } from "@/lib/opencode";

export interface ProviderModel {
  id: string;
  name?: string;
}

export interface Provider {
  id: string;
  name?: string;
  models?: ProviderModel[];
}

export async function GET(request: NextRequest) {
  try {
    const data = await fetchOpenCodeForRequest<{
      providers?: Provider[];
      default?: Record<string, string>;
    }>(request, "/config/providers");
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof OpenCodeClientError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 502 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 502 });
  }
}
