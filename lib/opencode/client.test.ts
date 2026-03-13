import { describe, it, expect } from "vitest";
import { OpenCodeClientError } from "./client";

describe("OpenCodeClientError", () => {
  it("extends Error with status and requestId", () => {
    const err = new OpenCodeClientError("test", 404, "req-1");
    expect(err.message).toBe("test");
    expect(err.status).toBe(404);
    expect(err.requestId).toBe("req-1");
    expect(err.name).toBe("OpenCodeClientError");
  });

  it("allows optional status and requestId", () => {
    const err = new OpenCodeClientError("generic");
    expect(err.status).toBeUndefined();
    expect(err.requestId).toBeUndefined();
  });
});
