import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  X,
  Columns,
  Grid2X2,
  LayoutPanelLeft,
  Plus,
} from "lucide-react";
import { TerminalPane, TerminalPaneRef } from "./TerminalPane";

type LayoutType = "1" | "2h" | "2v" | "3" | "4";

interface SplitTerminalProps {
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface SplitTerminalRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
}

interface TerminalSession {
  id: string;
  displayId: string;
}

// Get required pane count for each layout
const getRequiredPanesForLayout = (layout: LayoutType): number => {
  switch (layout) {
    case "1":
      return 1;
    case "2h":
    case "2v":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    default:
      return 1;
  }
};

export const SplitTerminal = forwardRef<SplitTerminalRef, SplitTerminalProps>(function SplitTerminal(
  { isMaximized = false, onToggleMaximize, onConnectionChange },
  ref,
) {
  const [layout, setLayout] = useState<LayoutType>("1");
  const [activePane, setActivePane] = useState(0);
  const [sessions, setSessions] = useState<TerminalSession[]>([{ id: crypto.randomUUID(), displayId: "Terminal 1" }]);
  const [connectedPanes, setConnectedPanes] = useState<Set<string>>(new Set());

  // Track pane counter for display names
  const paneCounter = useRef(1);

  // Store refs for each pane
  const paneRefs = useRef<Map<string, React.RefObject<TerminalPaneRef>>>(new Map());

  // Get or create ref for a session
  const getPaneRef = (sessionId: string) => {
    if (!paneRefs.current.has(sessionId)) {
      paneRefs.current.set(sessionId, { current: null } as React.RefObject<TerminalPaneRef>);
    }
    return paneRefs.current.get(sessionId)!;
  };

  // Handle connection changes from individual panes
  const handlePaneConnectionChange = useCallback((paneId: string, connected: boolean) => {
    setConnectedPanes((prev) => {
      const next = new Set(prev);
      if (connected) {
        next.add(paneId);
      } else {
        next.delete(paneId);
      }
      return next;
    });
  }, []);

  // Notify parent when any pane is connected
  useEffect(() => {
    onConnectionChange?.(connectedPanes.size > 0);
  }, [connectedPanes.size, onConnectionChange]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => {
      const activeSession = sessions[activePane];
      if (activeSession) {
        const paneRef = paneRefs.current.get(activeSession.id);
        paneRef?.current?.setInputValue(value);
      }
    },
    focusInput: () => {
      const activeSession = sessions[activePane];
      if (activeSession) {
        const paneRef = paneRefs.current.get(activeSession.id);
        paneRef?.current?.focusInput();
      }
    },
  }));

  // Create a new session
  const createSession = useCallback(() => {
    paneCounter.current += 1;
    return {
      id: crypto.randomUUID(),
      displayId: `Terminal ${paneCounter.current}`,
    };
  }, []);

  // Handle layout change - add sessions as needed WITHOUT disconnecting existing ones
  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    const requiredPanes = getRequiredPanesForLayout(newLayout);

    setSessions((prev) => {
      if (prev.length >= requiredPanes) {
        // We have enough panes, just switch layout - don't touch sessions/connections
        setLayout(newLayout);
        return prev;
      }

      // Need to add more panes - existing ones stay connected
      const newSessions = [...prev];
      while (newSessions.length < requiredPanes) {
        paneCounter.current += 1;
        newSessions.push({
          id: crypto.randomUUID(),
          displayId: `Terminal ${paneCounter.current}`,
        });
      }
      setLayout(newLayout);
      return newSessions;
    });
  }, []);

  // Add a new pane manually
  const addPane = useCallback(() => {
    const currentPanes = sessions.length;
    if (currentPanes >= 4) return; // Max 4 panes

    const newSession = createSession();
    setSessions((prev) => [...prev, newSession]);

    // Auto-adjust layout
    const newCount = currentPanes + 1;
    if (newCount === 2) setLayout("2h");
    else if (newCount === 3) setLayout("3");
    else if (newCount === 4) setLayout("4");
  }, [sessions.length, createSession]);

  // Remove a pane
  const removePane = useCallback((id: string) => {
    setSessions((prev) => {
      if (prev.length <= 1) return prev;

      // Clean up ref
      paneRefs.current.delete(id);

      const newSessions = prev.filter((s) => s.id !== id);
      const newCount = newSessions.length;

      // Auto-adjust layout
      if (newCount === 1) setLayout("1");
      else if (newCount === 2) setLayout("2h");
      else if (newCount === 3) setLayout("3");

      // Adjust active pane if needed
      setActivePane((p) => Math.min(p, newCount - 1));

      return newSessions;
    });

    // Remove from connected set
    setConnectedPanes((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getLayoutClass = () => {
    switch (layout) {
      case "2h":
        return "grid grid-cols-2";
      case "2v":
        return "grid grid-rows-2";
      case "3":
        return "grid grid-cols-2 grid-rows-2";
      case "4":
        return "grid grid-cols-2 grid-rows-2";
      default:
        return "";
    }
  };

  // Count visible sessions for display
  const visibleSessionCount = Math.min(sessions.length, getRequiredPanesForLayout(layout));

  return (
    <div
      className={`flex flex-col border border-border rounded-lg overflow-hidden ${isMaximized ? "fixed inset-4 z-50 bg-background" : "h-full"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-sidebar-foreground tracking-wide uppercase border-b-2 border-primary pb-1">
            {" "}
            Terminal
          </span>
          <span className="text-xs text-muted-foreground">
            ({connectedPanes.size}/{visibleSessionCount} connected)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Layout buttons */}
          <div className="flex items-center gap-0.5 mr-2 border-r border-border pr-2">
            <button
              onClick={() => handleLayoutChange("1")}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${layout === "1" ? "bg-accent text-cyan-400" : ""}`}
              title="1 pane"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleLayoutChange("2h")}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${layout === "2h" ? "bg-accent text-cyan-400" : ""}`}
              title="2 panes horizontal"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleLayoutChange("3")}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${layout === "3" ? "bg-accent text-cyan-400" : ""}`}
              title="3 panes"
            >
              <LayoutPanelLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleLayoutChange("4")}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${layout === "4" ? "bg-accent text-cyan-400" : ""}`}
              title="4 panes"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={addPane}
            disabled={sessions.length >= 4}
            className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
            title="Add new terminal pane"
          >
            <Plus className="w-4 h-4" />
          </button>

          {onToggleMaximize && (
            <button onClick={onToggleMaximize} className="p-1.5 rounded hover:bg-accent transition-colors" title={isMaximized ? "Restore" : "Maximize"}>
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Terminal panes grid - sessions persist across layout changes */}
      <div className={`flex-1 overflow-hidden ${getLayoutClass()}`}>
        {sessions.map((session, index) => {
          // Only show panes needed for current layout, but keep all sessions alive
          const isVisible = index < getRequiredPanesForLayout(layout);
          if (!isVisible) return null;
          
          return (
            <div
              key={session.id}
              className={`relative ${layout !== "1" ? "border border-border/50" : ""} ${
                index === activePane ? "ring-2 ring-cyan-400/50" : ""
              } ${layout === "3" && index === 2 ? "col-span-2" : ""}`}
              onClick={() => setActivePane(index)}
            >
              <TerminalPane
                ref={getPaneRef(session.id)}
                paneId={session.id}
                displayId={session.displayId}
                onConnectionChange={handlePaneConnectionChange}
              />
              {/* Close button for multi-pane layouts */}
              {layout !== "1" && sessions.filter((_, i) => i < getRequiredPanesForLayout(layout)).length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePane(session.id);
                  }}
                  className="absolute top-8 right-1 p-0.5 rounded bg-destructive/80 hover:bg-destructive transition-colors z-10"
                  title="Close pane"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer help */}
      <div className="px-3 py-1 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
        Each pane has its own independent connection • ↑↓ History • Ctrl+C Interrupt • Click pane to focus
      </div>
    </div>
  );
});
