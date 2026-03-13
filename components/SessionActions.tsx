"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getApi } from "@/lib/web/api";
import { useAppStore } from "@/lib/web/store";

interface SessionActionsProps {
  sessionId: string;
  sessionTitle?: string;
  onRename?: (title: string) => void;
  onDelete?: () => void;
  onFork?: (newId: string) => void;
  onShare?: (shared: boolean) => void;
}

export function SessionActions({
  sessionId,
  sessionTitle,
  onRename,
  onDelete,
  onFork,
  onShare,
}: SessionActionsProps) {
  const { activeInstanceId } = useAppStore();
  const api = getApi(activeInstanceId);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renameValue, setRenameValue] = useState("");
  const [showRename, setShowRename] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowRename(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleRename() {
    if (!renameValue.trim()) return;
    setLoading(true);
    try {
      await api.updateSession(sessionId, { title: renameValue.trim() });
      onRename?.(renameValue.trim());
      setShowRename(false);
      setOpen(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this session and all its data?")) return;
    setLoading(true);
    try {
      await api.deleteSession(sessionId);
      onDelete?.();
      setOpen(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleFork() {
    setLoading(true);
    try {
      const session = await api.forkSession(sessionId);
      onFork?.(session.id);
      setOpen(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    setLoading(true);
    try {
      if (shared) {
        await api.unshareSession(sessionId);
        setShared(false);
        onShare?.(false);
      } else {
        await api.shareSession(sessionId);
        setShared(true);
        onShare?.(true);
      }
      setOpen(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (!open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: r.bottom + 4, left: r.left });
          }
          setOpen((o) => !o);
        }}
        className="rounded p-1 text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
        aria-label="Session actions"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-[9999] w-48 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl"
        >
          {showRename ? (
            <div className="flex gap-1 px-2 py-1">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder={sessionTitle ?? "Title"}
                className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={handleRename}
                disabled={loading || !renameValue.trim()}
                className="btn-primary text-sm"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setRenameValue(sessionTitle ?? ""); setShowRename(true); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)]"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={handleFork}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)]"
              >
                Fork
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)]"
              >
                {shared ? "Unshare" : "Share"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm text-[var(--error)] hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
