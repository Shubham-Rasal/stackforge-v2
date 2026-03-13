import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listSessions returns empty array on non-array response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "bad" }),
    });
    const { api } = await import("./api");
    const sessions = await api.listSessions();
    expect(sessions).toEqual([]);
  });

  it("listSessions returns sessions on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "1", title: "Test" }],
    });
    const { api } = await import("./api");
    const sessions = await api.listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual({ id: "1", title: "Test" });
  });

  it("health returns data without throwing on non-ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ healthy: false, error: "down" }),
    });
    const { api } = await import("./api");
    const health = await api.health();
    expect(health.healthy).toBe(false);
    expect(health.error).toBe("down");
  });
});
