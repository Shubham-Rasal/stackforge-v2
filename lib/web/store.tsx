"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { api, getApi, cloneAndOpenRepo } from "./api";
import type { Session, MessageWithParts } from "./types";

type View = "hero" | "workspace";

interface AppState {
  view: View;
  sessionId: string | null;
  initialPrompt: string | undefined;
  sessions: Session[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  messages: MessageWithParts[];
  messagesLoading: boolean;
  messagesError: string | null;
  sending: boolean;
  running: boolean;
  connecting: boolean;
  selectedModel: string | null;
  pendingPermission: { sessionId: string; permissionID: string; message?: string } | null;
  /** In-progress assistant message built from event stream */
  streamingMessage: MessageWithParts | null;
  /** True when model is thinking (step started, no output yet) */
  thinking: boolean;
  /** Active OpenCode instance ID (from cloned repo); null = default instance */
  activeInstanceId: string | null;
  /** Full name of active repo (e.g. owner/repo) when using cloned instance */
  activeInstanceFullName: string | null;
  /** Path of file currently shown in the file viewer pane */
  selectedPath: string | null;
  /** Live preview: when set, show iframe at this URL (e.g. http://localhost:3000) */
  previewUrl: string | null;
  /** Review panel: show session changes (diff) */
  reviewOpen: boolean;
}

type Action =
  | { type: "SET_VIEW"; view: View }
  | { type: "SET_SESSION"; id: string | null }
  | { type: "SET_INITIAL_PROMPT"; prompt: string | undefined }
  | { type: "SET_SESSIONS"; sessions: Session[] }
  | { type: "SET_SESSIONS_LOADING"; loading: boolean }
  | { type: "SET_SESSIONS_ERROR"; error: string | null }
  | { type: "SET_MESSAGES"; messages: MessageWithParts[] }
  | { type: "APPEND_MESSAGE"; message: MessageWithParts }
  | { type: "SET_MESSAGES_LOADING"; loading: boolean }
  | { type: "SET_MESSAGES_ERROR"; error: string | null }
  | { type: "SET_SENDING"; sending: boolean }
  | { type: "SET_RUNNING"; running: boolean }
  | { type: "SET_CONNECTING"; connecting: boolean }
  | { type: "SET_SELECTED_MODEL"; model: string | null }
  | { type: "REFRESH_SESSIONS" }
  | { type: "SET_PENDING_PERMISSION"; value: { sessionId: string; permissionID: string; message?: string } | null }
  | { type: "SET_STREAMING_MESSAGE"; message: MessageWithParts | null }
  | { type: "APPEND_STREAMING_PART"; part: MessageWithParts["parts"][0] }
  | { type: "UPDATE_STREAMING_PART"; index: number; part: Partial<MessageWithParts["parts"][0]> }
  | { type: "SET_THINKING"; thinking: boolean }
  | { type: "SET_ACTIVE_INSTANCE"; instanceId: string | null; fullName?: string | null }
  | { type: "SET_SELECTED_PATH"; path: string | null }
  | { type: "SET_PREVIEW_URL"; url: string | null }
  | { type: "SET_REVIEW_OPEN"; open: boolean };

const initialState: AppState = {
  view: "hero",
  sessionId: null,
  initialPrompt: undefined,
  sessions: [],
  sessionsLoading: true,
  sessionsError: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  sending: false,
  running: false,
  connecting: false,
  selectedModel: null,
  pendingPermission: null,
  streamingMessage: null,
  thinking: false,
  activeInstanceId: null,
  activeInstanceFullName: null,
  selectedPath: null,
  previewUrl: null,
  reviewOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_SESSION":
      return { ...state, sessionId: action.id, messages: [], messagesError: null };
    case "SET_INITIAL_PROMPT":
      return { ...state, initialPrompt: action.prompt };
    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };
    case "SET_SESSIONS_LOADING":
      return { ...state, sessionsLoading: action.loading };
    case "SET_SESSIONS_ERROR":
      return { ...state, sessionsError: action.error };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "APPEND_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_MESSAGES_LOADING":
      return { ...state, messagesLoading: action.loading };
    case "SET_MESSAGES_ERROR":
      return { ...state, messagesError: action.error };
    case "SET_SENDING":
      return { ...state, sending: action.sending };
    case "SET_RUNNING":
      return { ...state, running: action.running };
    case "SET_CONNECTING":
      return { ...state, connecting: action.connecting };
    case "SET_SELECTED_MODEL":
      return { ...state, selectedModel: action.model };
    case "REFRESH_SESSIONS":
      return { ...state, sessionsLoading: true };
    case "SET_PENDING_PERMISSION":
      return { ...state, pendingPermission: action.value };
    case "SET_STREAMING_MESSAGE":
      return { ...state, streamingMessage: action.message };
    case "APPEND_STREAMING_PART": {
      const msg = state.streamingMessage;
      if (!msg) return state;
      return {
        ...state,
        streamingMessage: {
          ...msg,
          parts: [...msg.parts, action.part],
        },
      };
    }
    case "UPDATE_STREAMING_PART": {
      const msg = state.streamingMessage;
      if (!msg || action.index < 0 || action.index >= msg.parts.length) return state;
      const parts = [...msg.parts];
      parts[action.index] = { ...parts[action.index], ...action.part };
      return { ...state, streamingMessage: { ...msg, parts } };
    }
    case "SET_THINKING":
      return { ...state, thinking: action.thinking };
    case "SET_ACTIVE_INSTANCE":
      return {
        ...state,
        activeInstanceId: action.instanceId,
        activeInstanceFullName: action.instanceId ? (action.fullName ?? state.activeInstanceFullName) : null,
      };
    case "SET_SELECTED_PATH":
      return { ...state, selectedPath: action.path };
    case "SET_PREVIEW_URL":
      return { ...state, previewUrl: action.url };
    case "SET_REVIEW_OPEN":
      return { ...state, reviewOpen: action.open };
    default:
      return state;
  }
}

interface StoreContextValue extends AppState {
  dispatch: React.Dispatch<Action>;
  loadSessions: () => Promise<void>;
  loadLatestSession: () => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  createSession: (title?: string) => Promise<{ session: Session | null; error?: string }>;
  createSessionFromHero: (prompt: string) => Promise<{ session: Session | null; error?: string }>;
  selectSession: (id: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  abortSession: () => Promise<void>;
  runShell: (command: string) => Promise<string | null>;
  setToast: (message: string) => void;
  setPendingPermission: (value: { sessionId: string; permissionID: string; message?: string } | null) => void;
  handleStreamEvent: (evt: { type?: string; [key: string]: unknown }) => void;
  setActiveInstance: (instanceId: string | null, fullName?: string | null) => void;
  cloneAndOpen: (fullName: string, repoUrl?: string) => Promise<{ instanceId: string; baseUrl: string; fullName: string } | { error: string }>;
  setSelectedPath: (path: string | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setReviewOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function AppStoreProvider({
  children,
  initialInstanceId,
  initialView,
}: {
  children: ReactNode;
  initialInstanceId?: string | null;
  initialView?: "hero" | "workspace";
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    view: initialView ?? "hero",
    activeInstanceId: initialInstanceId ?? null,
  });

  const loadSessions = useCallback(async () => {
    dispatch({ type: "SET_SESSIONS_LOADING", loading: true });
    dispatch({ type: "SET_SESSIONS_ERROR", error: null });
    try {
      const a = getApi(state.activeInstanceId);
      const sessions = await a.listSessions();
      dispatch({ type: "SET_SESSIONS", sessions });
    } catch (e) {
      dispatch({
        type: "SET_SESSIONS_ERROR",
        error: e instanceof Error ? e.message : "Failed to load sessions",
      });
    } finally {
      dispatch({ type: "SET_SESSIONS_LOADING", loading: false });
    }
  }, [state.activeInstanceId]);

  const loadLatestSession = useCallback(async () => {
    try {
      const a = getApi(state.activeInstanceId);
      const sessions = await a.listSessions();
      dispatch({ type: "SET_SESSIONS", sessions });
      if (Array.isArray(sessions) && sessions.length > 0) {
        const latest = [...sessions].sort((a, b) => {
          const aTime = a.updatedAt ?? a.createdAt ?? "";
          const bTime = b.updatedAt ?? b.createdAt ?? "";
          return bTime.localeCompare(aTime);
        })[0];
        if (latest) {
          dispatch({ type: "SET_SESSION", id: latest.id });
          dispatch({ type: "SET_VIEW", view: "workspace" });
        }
      }
    } catch {
      // ignore
    } finally {
      dispatch({ type: "SET_SESSIONS_LOADING", loading: false });
    }
  }, [state.activeInstanceId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    dispatch({ type: "SET_MESSAGES_LOADING", loading: true });
    dispatch({ type: "SET_MESSAGES_ERROR", error: null });
    try {
      const a = getApi(state.activeInstanceId);
      const messages = await a.listMessages(sessionId);
      dispatch({ type: "SET_MESSAGES", messages });
    } catch (e) {
      dispatch({
        type: "SET_MESSAGES_ERROR",
        error: e instanceof Error ? e.message : "Failed to load messages",
      });
    } finally {
      dispatch({ type: "SET_MESSAGES_LOADING", loading: false });
    }
  }, [state.activeInstanceId]);

  const createSession = useCallback(async (title?: string): Promise<{ session: Session | null; error?: string }> => {
    dispatch({ type: "SET_CONNECTING", connecting: true });
    try {
      const a = getApi(state.activeInstanceId);
      const session = await a.createSession({
        title: title?.slice(0, 50) || "New session",
      });
      dispatch({ type: "SET_SESSION", id: session.id });
      dispatch({ type: "SET_INITIAL_PROMPT", prompt: undefined });
      dispatch({ type: "SET_VIEW", view: "workspace" });
      await loadSessions();
      return { session };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create session";
      dispatch({ type: "SET_SESSIONS_ERROR", error: msg });
      return { session: null, error: msg };
    } finally {
      dispatch({ type: "SET_CONNECTING", connecting: false });
    }
  }, [loadSessions, state.activeInstanceId]);

  const createSessionFromHero = useCallback(async (prompt: string): Promise<{ session: Session | null; error?: string }> => {
    dispatch({ type: "SET_CONNECTING", connecting: true });
    try {
      const a = getApi(state.activeInstanceId);
      const session = await a.createSession({
        title: prompt.slice(0, 50) || "New session",
      });
      dispatch({ type: "SET_SESSION", id: session.id });
      dispatch({ type: "SET_INITIAL_PROMPT", prompt });
      dispatch({ type: "SET_VIEW", view: "workspace" });
      await loadSessions();
      return { session };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create session";
      dispatch({ type: "SET_SESSIONS_ERROR", error: msg });
      return { session: null, error: msg };
    } finally {
      dispatch({ type: "SET_CONNECTING", connecting: false });
    }
  }, [loadSessions, state.activeInstanceId]);

  const selectSession = useCallback((id: string | null) => {
    dispatch({ type: "SET_SESSION", id });
    dispatch({ type: "SET_INITIAL_PROMPT", prompt: undefined });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const { sessionId, selectedModel } = state;
    if (!sessionId) return;
    dispatch({ type: "SET_SENDING", sending: true });
    dispatch({ type: "SET_SESSIONS_ERROR", error: null });
    dispatch({ type: "SET_MESSAGES_ERROR", error: null });
    dispatch({ type: "SET_RUNNING", running: true });
    dispatch({ type: "SET_THINKING", thinking: true });

    const userMsg: MessageWithParts = {
      info: { id: "temp-user", role: "user" },
      parts: [{ type: "text", text }],
    };
    dispatch({ type: "APPEND_MESSAGE", message: userMsg });

    dispatch({
      type: "SET_STREAMING_MESSAGE",
      message: {
        info: { id: "streaming-assistant", role: "assistant" },
        parts: [],
      },
    });

    try {
      const a = getApi(state.activeInstanceId);
      await a.sendMessageAsync(sessionId, {
        parts: [{ type: "text", text }],
        model: selectedModel ?? undefined,
      });
    } catch (e) {
      dispatch({
        type: "SET_MESSAGES_ERROR",
        error: e instanceof Error ? e.message : "Error sending message",
      });
      dispatch({ type: "SET_STREAMING_MESSAGE", message: null });
      dispatch({ type: "SET_THINKING", thinking: false });
      dispatch({ type: "SET_SENDING", sending: false });
      dispatch({ type: "SET_RUNNING", running: false });
    }
    // Note: streaming completion (session.idle) clears streaming state via handleStreamEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state read at call time, stable callback identity
  }, [state.sessionId, state.selectedModel]);

  const abortSession = useCallback(async () => {
    const { sessionId } = state;
    if (!sessionId) return;
    try {
      const a = getApi(state.activeInstanceId);
      await a.abortSession(sessionId);
      dispatch({ type: "SET_RUNNING", running: false });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state read at call time, stable callback identity
  }, [state.sessionId]);

  const runShell = useCallback(async (command: string): Promise<string | null> => {
    const { sessionId, selectedModel } = state;
    if (!sessionId) return "No session selected. Create or select a session first.";
    try {
      const a = getApi(state.activeInstanceId);
      const result = await a.runShell(sessionId, {
        command,
        model: selectedModel ?? undefined,
      });
      const text = result.parts?.find((p) => p.text)?.text ?? "Command executed.";
      return text;
    } catch (e) {
      return e instanceof Error ? e.message : "Error";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state read at call time, stable callback identity
  }, [state.sessionId, state.selectedModel]);

  const setToast = useCallback((message: string) => {
    void message; // Placeholder for toast; can wire to a toast context later
  }, []);

  const setPendingPermission = useCallback((value: { sessionId: string; permissionID: string; message?: string } | null) => {
    dispatch({ type: "SET_PENDING_PERMISSION", value });
  }, []);

  const setActiveInstance = useCallback((instanceId: string | null, fullName?: string | null) => {
    dispatch({ type: "SET_ACTIVE_INSTANCE", instanceId, fullName });
  }, []);

  const setSelectedPath = useCallback((path: string | null) => {
    dispatch({ type: "SET_SELECTED_PATH", path });
  }, []);

  const setPreviewUrl = useCallback((url: string | null) => {
    dispatch({ type: "SET_PREVIEW_URL", url });
  }, []);

  const setReviewOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_REVIEW_OPEN", open });
  }, []);

  const cloneAndOpen = useCallback(
    async (fullName: string, repoUrl?: string): Promise<{ instanceId: string; baseUrl: string; fullName: string } | { error: string }> => {
      try {
        const result = await cloneAndOpenRepo(fullName, repoUrl);
        dispatch({ type: "SET_ACTIVE_INSTANCE", instanceId: result.instanceId, fullName: result.fullName });
        return { instanceId: result.instanceId, baseUrl: result.baseUrl, fullName: result.fullName };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Clone failed" };
      }
    },
    []
  );

  const handleStreamEvent = useCallback(
    (evt: { type?: string; [key: string]: unknown }) => {
      const props = (evt as { properties?: Record<string, unknown> }).properties ?? evt;
      const sid = (props.sessionID ?? props.sessionId ?? evt.sessionID ?? evt.sessionId) as string | undefined;
      if (sid && sid !== state.sessionId) return;

      const t = (props.type ?? evt.type) as string;
      const inner = t === "message.part.updated" ? (props.part ?? props) as Record<string, unknown> : null;
      const innerType = inner?.type as string | undefined;

      if (t === "step_start" || t === "step-start" || innerType === "step-start") {
        dispatch({ type: "SET_THINKING", thinking: true });
        return;
      }
      if (t === "tool_use" || t === "tool" || innerType === "tool") {
        dispatch({ type: "SET_THINKING", thinking: false });
        const part = (props.part ?? inner ?? props) as Record<string, unknown> | undefined;
        const stateObj = (part?.state ?? {}) as Record<string, unknown>;
        const tool = (part?.tool ?? part?.type) as string;
        const inputObj = (stateObj?.input ?? part?.input) as Record<string, unknown> | undefined;
        const argsObj = (stateObj?.args ?? part?.args) as Record<string, unknown> | undefined;
        const isQuestionTool = tool === "question" || tool === "confirmation";
        const questionFromInput =
          (typeof inputObj === "object" && inputObj
            ? (inputObj.question ?? inputObj.description ?? inputObj.message ?? inputObj.prompt) as string | undefined
            : undefined) ??
          (typeof argsObj?.question === "string" ? argsObj.question : undefined);
        if (isQuestionTool && questionFromInput && (!stateObj?.status || stateObj.status !== "completed")) {
          dispatch({
            type: "APPEND_STREAMING_PART",
            part: {
              type: "tool",
              tool,
              title: "Question",
              text: questionFromInput,
              output: questionFromInput,
              input: inputObj,
              state: { ...stateObj, output: questionFromInput },
            },
          });
          return;
        }
        if (stateObj && (stateObj.status === "completed" || Object.keys(stateObj).length > 0)) {
          const meta = stateObj.metadata as Record<string, unknown> | undefined;
          const output = String(
            stateObj.output ?? meta?.output ?? part?.output ?? part?.text ?? ""
          );
          const title = String(
            stateObj.title ?? inputObj?.description ?? argsObj?.description ?? tool
          );
          const command =
            (typeof inputObj === "string" ? inputObj : null) ??
            (typeof inputObj === "object" && inputObj && typeof inputObj.command === "string"
              ? inputObj.command
              : null) ??
            (typeof argsObj?.command === "string" ? argsObj.command : null) ??
            (typeof stateObj.input === "string" ? stateObj.input : null) ??
            (typeof stateObj.command === "string" ? stateObj.command : null) ??
            "";
          dispatch({
            type: "APPEND_STREAMING_PART",
            part: {
              type: "tool",
              tool,
              text: output,
              title,
              input: command || inputObj || argsObj,
              state: stateObj,
            },
          });
        }
        return;
      }
      if (t === "text" || innerType === "text") {
        dispatch({ type: "SET_THINKING", thinking: false });
        const part = (props.part ?? inner ?? props) as Record<string, unknown> | undefined;
        const text = (part?.text ?? part?.delta ?? "") as string;
        if (text) {
          dispatch({
            type: "APPEND_STREAMING_PART",
            part: { type: "text", text },
          });
        }
        return;
      }
      if (t === "message.part.updated" && inner) {
        dispatch({ type: "SET_THINKING", thinking: false });
        const part = inner as Record<string, unknown>;
        const partType = part.type as string | undefined;
        if (partType && partType !== "tool" && partType !== "text") {
          dispatch({
            type: "APPEND_STREAMING_PART",
            part: { ...part, type: partType },
          });
        }
        return;
      }
      if (t === "step_finish" || t === "step-finish" || innerType === "step-finish") {
        const partObj = (props.part ?? inner ?? props) as Record<string, unknown> | undefined;
        const reason = partObj?.reason as string | undefined;
        if (reason === "stop") dispatch({ type: "SET_THINKING", thinking: false });
        return;
      }
      if (t === "error" || t === "session.error") {
        dispatch({ type: "SET_THINKING", thinking: false });
        const err = (props.error ?? evt.error) as Record<string, unknown> | undefined;
        const msg = (err?.data as Record<string, unknown>)?.message ?? err?.message ?? "Session error";
        dispatch({ type: "SET_MESSAGES_ERROR", error: String(msg) });
        dispatch({ type: "SET_STREAMING_MESSAGE", message: null });
        dispatch({ type: "SET_SENDING", sending: false });
        dispatch({ type: "SET_RUNNING", running: false });
        if (state.sessionId) loadMessages(state.sessionId);
        return;
      }
      if (t === "session.idle" || t === "session_idle") {
        dispatch({ type: "SET_THINKING", thinking: false });
        dispatch({ type: "SET_STREAMING_MESSAGE", message: null });
        dispatch({ type: "SET_SENDING", sending: false });
        dispatch({ type: "SET_RUNNING", running: false });
        if (state.sessionId) loadMessages(state.sessionId);
      }
    },
    [state.sessionId, loadMessages]
  );

  useEffect(() => {
    loadLatestSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (state.sessionId && !state.initialPrompt) {
      loadMessages(state.sessionId);
    }
  }, [state.sessionId, state.initialPrompt, loadMessages]);

  const prevInstanceRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevInstanceRef.current !== state.activeInstanceId) {
      prevInstanceRef.current = state.activeInstanceId;
      dispatch({ type: "SET_SESSION", id: null });
      loadSessions();
    }
  }, [state.activeInstanceId, loadSessions]);

  const initialPromptSentRef = useRef(false);
  useEffect(() => {
    if (state.sessionId && state.initialPrompt && !initialPromptSentRef.current) {
      initialPromptSentRef.current = true;
      const prompt = state.initialPrompt;
      dispatch({ type: "SET_INITIAL_PROMPT", prompt: undefined });
      sendMessage(prompt);
    }
  }, [state.sessionId, state.initialPrompt, sendMessage]);

  const value: StoreContextValue = {
    ...state,
    dispatch,
    loadSessions,
    loadLatestSession,
    loadMessages,
    createSession,
    createSessionFromHero,
    selectSession,
    sendMessage,
    abortSession,
    runShell,
    setToast,
    setPendingPermission,
    handleStreamEvent,
    setActiveInstance,
    cloneAndOpen,
    setSelectedPath,
    setPreviewUrl,
    setReviewOpen,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
