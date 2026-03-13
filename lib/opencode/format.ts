/**
 * Helpers for OpenCode API request/response formatting.
 */

/**
 * Normalize model from "providerID/modelID" string to { providerID, modelID } object
 * for OpenCode server API compatibility.
 */
export function parseModel(
  model: string | { providerID: string; modelID: string } | undefined
): { providerID: string; modelID: string } | string | undefined {
  if (model == null) return undefined;
  if (typeof model === "object" && "providerID" in model && "modelID" in model) {
    return model;
  }
  if (typeof model === "string" && model.includes("/")) {
    const [providerID, modelID] = model.split("/", 2);
    return providerID && modelID ? { providerID, modelID } : model;
  }
  return model;
}
