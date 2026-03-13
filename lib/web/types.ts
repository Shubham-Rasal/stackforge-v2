/**
 * Shared types for the OpenVibe web client.
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

export interface MessagePart {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

export interface MessageWithParts {
  info: MessageInfo;
  parts: MessagePart[];
}

export interface HealthResponse {
  healthy: boolean;
  version?: string;
  error?: string;
  expectedUrl?: string;
}

export interface ApiError {
  error: string;
}
