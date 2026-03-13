import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // macOS: open native folder picker via osascript
    const { stdout } = await execAsync(
      `osascript -e 'POSIX path of (choose folder with prompt "Select project directory")'`
    );
    const path = stdout.trim().replace(/\/$/, ""); // strip trailing slash
    return NextResponse.json({ path });
  } catch {
    // User cancelled or not on macOS
    return NextResponse.json({ path: null });
  }
}
