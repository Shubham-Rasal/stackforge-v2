/**
 * Minimal types for OpenCode API responses used by the proxy.
 */

export interface Session {
  id: string;
  title?: string;
  parentID?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionStatus {
  status?: string;
  running?: boolean;
}

export interface MessageInfo {
  id: string;
  role?: string;
  createdAt?: string;
}

export interface Part {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

export interface MessageWithParts {
  info: MessageInfo;
  parts: Part[];
}

export interface HealthResponse {
  healthy: boolean;
  version?: string;
}

export interface FileMatch {
  path: string;
  lines?: string[];
  line_number?: number;
  absolute_offset?: number;
  submatches?: unknown[];
}

export interface FileContent {
  path?: string;
  content?: string;
}
