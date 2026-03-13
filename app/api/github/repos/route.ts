import { auth } from "@/auth";
import { safeResJson } from "@/lib/safe-json";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch("https://api.github.com/user/repos?per_page=30&sort=updated", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const repos = await safeResJson<{ id: number; name: string; full_name: string; html_url: string; private: boolean }[]>(res, []);
    return NextResponse.json(
      repos.map((r: { id: number; name: string; full_name: string; html_url: string; private: boolean }) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        private: r.private,
      }))
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
