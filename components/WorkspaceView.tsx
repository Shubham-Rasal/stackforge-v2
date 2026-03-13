"use client";

import { useState } from "react";
import { SessionSidebar } from "./SessionSidebar";
import { ChatPanel } from "./ChatPanel";
import { FileViewer } from "./FileViewer";
import { LivePreview } from "./LivePreview";
import { ReviewPanel } from "./ReviewPanel";
import { ToolsPanel } from "./ToolsPanel";
import { PermissionPrompt } from "./PermissionPrompt";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ResizeDivider } from "./ResizeDivider";
import { useEventStream } from "@/lib/web/useEventStream";
import { useAppStore } from "@/lib/web/store";

const MIN = 160;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

interface WorkspaceViewProps {
  sessionId: string | null;
  initialPrompt?: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}

export function WorkspaceView({
  sessionId,
  initialPrompt,
  onSelectSession,
  onCreateSession,
}: WorkspaceViewProps) {
  const { pendingPermission, setPendingPermission, handleStreamEvent, activeInstanceId, selectedPath, setSelectedPath, previewUrl, setPreviewUrl, reviewOpen, setReviewOpen } = useAppStore();

  const [sidebarWidth, setSidebarWidth] = useState(224);
  const [fileViewerWidth, setFileViewerWidth] = useState(380);
  const [reviewWidth, setReviewWidth] = useState(320);
  const [toolsWidth, setToolsWidth] = useState(288);

  useEventStream(
    (evt) => {
      const t = evt.type as string;
      const props = (evt as { properties?: Record<string, unknown> }).properties ?? evt;
      if (t === "permission.request" || (t && t.includes("permission"))) {
        const sid = (props.sessionID ?? props.sessionId ?? sessionId) as string;
        const pid = (props.permissionID ?? props.permissionId) as string;
        const msg = (props.message ?? props.description) as string | undefined;
        if (sid && pid) setPendingPermission({ sessionId: sid, permissionID: pid, message: msg });
      }
      handleStreamEvent(evt);
    },
    activeInstanceId
  );

  return (
    <div className="view-enter flex h-screen w-full flex-col overflow-hidden">
      <WorkspaceHeader previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} reviewOpen={reviewOpen} setReviewOpen={setReviewOpen} />
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: sidebarWidth, minWidth: MIN, flexShrink: 0 }} className="flex flex-col overflow-hidden">
          <SessionSidebar
            currentSessionId={sessionId}
            onSelectSession={onSelectSession}
            onCreateSession={onCreateSession}
          />
        </div>
        <ResizeDivider onDelta={(d) => setSidebarWidth((w) => clamp(w + d, MIN, 480))} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ChatPanel sessionId={sessionId} initialPrompt={initialPrompt} />
        </div>

        {selectedPath && (
          <>
            <ResizeDivider onDelta={(d) => setFileViewerWidth((w) => clamp(w - d, MIN, 800))} />
            <div style={{ width: fileViewerWidth, minWidth: MIN, flexShrink: 0 }} className="flex flex-col overflow-hidden">
              <FileViewer
                path={selectedPath}
                onClose={() => setSelectedPath(null)}
              />
            </div>
          </>
        )}
        {previewUrl && <LivePreview />}
        {reviewOpen && (
          <>
            <ResizeDivider onDelta={(d) => setReviewWidth((w) => clamp(w - d, MIN, 800))} />
            <div style={{ width: reviewWidth, minWidth: MIN, flexShrink: 0 }} className="flex flex-col overflow-hidden">
              <ReviewPanel />
            </div>
          </>
        )}
        <ResizeDivider onDelta={(d) => setToolsWidth((w) => clamp(w - d, MIN, 600))} />
        <div style={{ width: toolsWidth, minWidth: MIN, flexShrink: 0 }} className="flex flex-col overflow-hidden">
          <ToolsPanel />
        </div>
      </div>
      {pendingPermission && (
        <PermissionPrompt
          sessionId={pendingPermission.sessionId}
          permissionID={pendingPermission.permissionID}
          message={pendingPermission.message}
          onClose={() => setPendingPermission(null)}
        />
      )}
    </div>
  );
}
