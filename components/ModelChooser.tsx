"use client";

import { useState, useEffect, useRef } from "react";
import { getApi } from "@/lib/web/api";
import { useAppStore } from "@/lib/web/store";

export function ModelChooser() {
  const { selectedModel, dispatch, activeInstanceId } = useAppStore();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<
    { id: string; name?: string; models?: { id: string; name?: string }[] }[]
  >([]);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const defaultSetRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getApi(activeInstanceId).getConfigProviders();
        if (!cancelled) {
          setProviders(data.providers ?? []);
          setDefaults(data.default ?? {});
          if (!defaultSetRef.current && data.default) {
            defaultSetRef.current = true;
            const first = Object.entries(data.default)[0];
            if (first) {
              dispatch({ type: "SET_SELECTED_MODEL", model: `${first[0]}/${first[1]}` });
            }
          }
        }
      } catch {
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dispatch, activeInstanceId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const models: { id: string; label: string }[] = [];
  for (const p of providers) {
    const def = defaults[p.id];
    if (Array.isArray(p.models)) {
      for (const m of p.models) {
        models.push({
          id: `${p.id}/${m.id}`,
          label: m.name ?? m.id,
        });
      }
    } else if (def) {
      models.push({ id: `${p.id}/${def}`, label: def });
    }
  }

  if (loading || models.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-secondary flex items-center gap-1 text-sm"
      >
        {selectedModel ?? "Default"}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 max-h-48 w-48 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "SET_SELECTED_MODEL", model: null });
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)] ${
              !selectedModel ? "bg-[var(--accent-muted)] text-[var(--accent)]" : ""
            }`}
          >
            Default
          </button>
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                dispatch({ type: "SET_SELECTED_MODEL", model: m.id });
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted-bg)] ${
                selectedModel === m.id ? "bg-[var(--accent-muted)] text-[var(--accent)]" : ""
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
