/**
 * Spawns and manages OpenCode server instances for cloned repos.
 */

import { spawn } from "child_process";
import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const REPOS_BASE = process.env.OPENVIBE_REPOS_DIR ?? join(tmpdir(), "openvibe-repos");

function randomPort(): number {
  return 4100 + Math.floor(Math.random() * 6000);
}

export interface InstanceInfo {
  instanceId: string;
  port: number;
  baseUrl: string;
  repoPath: string;
  fullName: string;
}

const activeInstances = new Map<string, { process: ReturnType<typeof spawn>; info: InstanceInfo }>();

export async function cloneAndSpawn(
  repoUrl: string,
  fullName: string,
  accessToken?: string
): Promise<InstanceInfo> {
  const repoDir = join(REPOS_BASE, fullName.replace("/", "__"));
  await mkdir(REPOS_BASE, { recursive: true });

  // Reuse existing active instance for this repo
  for (const [, { info }] of activeInstances) {
    if (info.repoPath === repoDir) {
      try {
        const res = await fetch(`${info.baseUrl}/global/health`);
        if (res.ok) return info;
      } catch { /* stale, fall through to re-clone */ }
      activeInstances.delete(info.instanceId);
    }
  }

  // If already cloned, do a git pull instead of re-cloning
  if (existsSync(repoDir)) {
    const authUrl =
      accessToken && repoUrl.startsWith("https://github.com")
        ? repoUrl.replace("https://github.com/", `https://x-access-token:${accessToken}@github.com/`)
        : repoUrl;
    await new Promise<void>((resolve) => {
      const proc = spawn("git", ["pull", "--ff-only", authUrl], {
        cwd: repoDir, stdio: "pipe", shell: true,
      });
      proc.on("close", () => resolve()); // non-fatal if pull fails
    });
  } else {
    const authUrl =
      accessToken && repoUrl.startsWith("https://github.com")
        ? repoUrl.replace("https://github.com/", `https://x-access-token:${accessToken}@github.com/`)
        : repoUrl;
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("git", ["clone", "--depth", "1", authUrl, repoDir], {
        stdio: "pipe", shell: true,
      });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`git clone failed with code ${code}`));
      });
      proc.on("error", reject);
    });
  }

  const instanceId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  let port = randomPort();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const proc = spawn("opencode", ["serve", "--port", String(port)], {
      cwd: repoDir,
      stdio: "ignore",
      detached: true,
      shell: true,
      env: { ...process.env, PATH: process.env.PATH ?? "" },
    });
    proc.unref();

    const baseUrl = `http://127.0.0.1:${port}`;
    const info: InstanceInfo = { instanceId, port, baseUrl, repoPath: repoDir, fullName };

    activeInstances.set(instanceId, { process: proc, info });

    await new Promise((r) => setTimeout(r, 1500));

    try {
      const res = await fetch(`${baseUrl}/global/health`);
      if (res.ok) return info;
    } catch {
      // Port might be in use, try another
    }
    activeInstances.delete(instanceId);
    proc.kill("SIGTERM");
    port = randomPort();
    attempts++;
  }

  throw new Error("Failed to start OpenCode instance after multiple attempts");
}

export function getInstance(instanceId: string): InstanceInfo | undefined {
  return activeInstances.get(instanceId)?.info;
}

export function isAllowedInstanceUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.hostname === "127.0.0.1" || u.hostname === "localhost") &&
      u.protocol === "http:"
    );
  } catch {
    return false;
  }
}

export function getInstanceUrlById(instanceId: string): string | null {
  const info = activeInstances.get(instanceId)?.info;
  return info?.baseUrl ?? null;
}

export async function spawnLocal(localPath: string): Promise<InstanceInfo> {
  // Reuse existing instance for the same directory
  for (const [, { info }] of activeInstances) {
    if (info.repoPath === localPath) return info;
  }

  if (!existsSync(localPath)) {
    throw new Error(`Path does not exist: ${localPath}`);
  }

  const instanceId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const fullName = join(localPath).split("/").at(-1) ?? "project";
  let port = randomPort();
  let attempts = 0;

  while (attempts < 10) {
    const proc = spawn("opencode", ["serve", "--port", String(port)], {
      cwd: localPath,
      stdio: "ignore",
      detached: true,
      shell: true,
      env: { ...process.env, PATH: process.env.PATH ?? "" },
    });
    proc.unref();

    const baseUrl = `http://127.0.0.1:${port}`;
    const info: InstanceInfo = { instanceId, port, baseUrl, repoPath: localPath, fullName };
    activeInstances.set(instanceId, { process: proc, info });

    await new Promise((r) => setTimeout(r, 1500));

    try {
      const res = await fetch(`${baseUrl}/global/health`);
      if (res.ok) return info;
    } catch { /* try next port */ }

    activeInstances.delete(instanceId);
    proc.kill("SIGTERM");
    port = randomPort();
    attempts++;
  }

  throw new Error("Failed to start OpenCode instance for local path");
}
