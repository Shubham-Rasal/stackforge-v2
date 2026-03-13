"use client";

import { useAppStore } from "@/lib/web/store";
import { getApi } from "@/lib/web/api";

interface PermissionPromptProps {
  sessionId: string;
  permissionID: string;
  message?: string;
  onClose: () => void;
}

export function PermissionPrompt({
  sessionId,
  permissionID,
  message = "This action requires your permission.",
  onClose,
}: PermissionPromptProps) {
  const { loadMessages, activeInstanceId } = useAppStore();

  async function respond(allowed: boolean, remember?: boolean) {
    try {
      const api = getApi(activeInstanceId);
      await api.respondToPermission(sessionId, permissionID, allowed, remember);
      await loadMessages(sessionId);
    } catch {
      // ignore
    } finally {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg">
        <h3 className="mb-2 font-semibold">Permission required</h3>
        <p className="mb-4 text-sm text-[var(--muted)]">{message}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => respond(true)}
            className="btn-primary"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => respond(false)}
            className="btn-secondary"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => respond(true, true)}
            className="btn-secondary text-sm"
          >
            Allow & remember
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
