import { useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { 
  Terminal, 
  X, 
  Plus, 
  Maximize2, 
  Minimize2, 
  Server,
  ChevronLeft,
  ChevronRight,
  Layers
} from "lucide-react";
import { TargetTerminalPane, TargetTerminalPaneRef } from "./TargetTerminalPane";
import { useTargetTerminals } from "@/hooks/useTargetTerminals";
import type { Target } from "@/types/ctf";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface TargetTerminalManagerProps {
  targets: Target[];
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export interface TargetTerminalManagerRef {
  /**
   * Open a terminal for a target.
   * - If listenerContext is provided, always create a new terminal.
   * - Otherwise, switch to the most recent terminal for that target if it exists.
   */
  openForTarget: (target: Target, listenerContext?: string) => void;
}

export const TargetTerminalManager = forwardRef<TargetTerminalManagerRef, TargetTerminalManagerProps>(
  function TargetTerminalManager(
    { targets, isMaximized = false, onToggleMaximize }: TargetTerminalManagerProps,
    ref,
  ) {
  const {
    terminals,
    activeTerminalId,
    activeTerminal,
    activeSession,
    sessions,
    createTargetTerminal,
    closeTerminal,
    switchToTerminal,
    addLine,
    addToHistory,
    setConnected,
    clearTerminal,
  } = useTargetTerminals();

  const [showNewTerminalMenu, setShowNewTerminalMenu] = useState(false);
  const paneRefs = useRef<Map<string, React.RefObject<TargetTerminalPaneRef>>>(new Map());
  const tabsRef = useRef<HTMLDivElement>(null);

  const openForTarget = useCallback(
    (target: Target, listenerContext?: string) => {
      if (listenerContext) {
        createTargetTerminal(target, listenerContext);
        return;
      }

      const existing = terminals.filter((t) => t.targetId === target.id);
      if (existing.length > 0) {
        // Prefer the most recently created one.
        switchToTerminal(existing[existing.length - 1].id);
        return;
      }

      createTargetTerminal(target);
    },
    [createTargetTerminal, switchToTerminal, terminals],
  );

  useImperativeHandle(ref, () => ({ openForTarget }), [openForTarget]);

  // Get or create ref for a terminal
  const getPaneRef = (terminalId: string) => {
    if (!paneRefs.current.has(terminalId)) {
      paneRefs.current.set(terminalId, { current: null } as React.RefObject<TargetTerminalPaneRef>);
    }
    return paneRefs.current.get(terminalId)!;
  };

  const handleCreateTerminal = useCallback((target: Target, listenerContext?: string) => {
    openForTarget(target, listenerContext);
    setShowNewTerminalMenu(false);
  }, [openForTarget]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 150;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Group terminals by target
  const terminalsByTarget = terminals.reduce((acc, terminal) => {
    if (!acc[terminal.targetId]) {
      acc[terminal.targetId] = [];
    }
    acc[terminal.targetId].push(terminal);
    return acc;
  }, {} as Record<string, typeof terminals>);

  const connectedCount = Array.from(sessions.values()).filter(s => s.isConnected).length;

  if (terminals.length === 0) {
    // Empty state
    return (
      <div className={`flex flex-col border border-red-500/30 rounded-lg overflow-hidden bg-red-950/10 ${isMaximized ? "fixed inset-4 z-50 bg-background" : "h-full"}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/30 bg-red-950/30">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 tracking-wide uppercase">
              Target Terminals
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded hover:bg-accent transition-colors text-red-400" title="Add target terminal">
                  <Plus className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Select Target Host
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {targets.length === 0 ? (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    No targets available. Add targets first.
                  </DropdownMenuItem>
                ) : (
                  targets.map(target => (
                    <DropdownMenuItem
                      key={target.id}
                      onClick={() => handleCreateTerminal(target)}
                      className="flex items-center gap-2"
                    >
                      <Server className="w-3 h-3 text-cyan-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{target.hostname}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{target.ip}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {onToggleMaximize && (
              <button onClick={onToggleMaximize} className="p-1.5 rounded hover:bg-accent transition-colors">
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Layers className="w-12 h-12 text-red-400/30 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-foreground mb-4">No Target Terminals</h3>
            <button 
              onClick={() => {
                if (targets.length > 0) {
                  handleCreateTerminal(targets[0]);
                }
              }}
              disabled={targets.length === 0}
              className="text-sm px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Target Terminal
            </button>
            {targets.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Add targets first to create terminals</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col border border-red-500/30 rounded-lg overflow-hidden bg-red-950/10 ${isMaximized ? "fixed inset-4 z-50 bg-background" : "h-full"}`}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-red-500/30 bg-red-950/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Layers className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs font-bold text-red-400 tracking-wide uppercase flex-shrink-0">
            Targets
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            ({connectedCount}/{terminals.length})
          </span>
          
          {/* Tab scroll buttons */}
          {terminals.length > 3 && (
            <button 
              onClick={() => scrollTabs("left")} 
              className="p-0.5 rounded hover:bg-accent flex-shrink-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          
          {/* Tabs */}
          <div 
            ref={tabsRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {terminals.map(terminal => {
              const session = sessions.get(terminal.id);
              const isActive = terminal.id === activeTerminalId;
              
              return (
                <div
                  key={terminal.id}
                  onClick={() => switchToTerminal(terminal.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer flex-shrink-0 group transition-colors ${
                    isActive 
                      ? 'bg-red-500/20 border border-red-500/50' 
                      : 'hover:bg-secondary border border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    session?.isConnected ? 'bg-green-500' : 'bg-red-500/50'
                  }`} />
                  <span className={`text-xs truncate max-w-[80px] ${isActive ? 'text-red-400' : ''}`}>
                    {terminal.displayName}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTerminal(terminal.id);
                    }}
                    className="p-0.5 rounded hover:bg-destructive/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
          
          {terminals.length > 3 && (
            <button 
              onClick={() => scrollTabs("right")} 
              className="p-0.5 rounded hover:bg-accent flex-shrink-0"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded hover:bg-accent transition-colors text-red-400" title="Add target terminal">
                <Plus className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Select Target Host
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {targets.map(target => (
                <DropdownMenuItem
                  key={target.id}
                  onClick={() => handleCreateTerminal(target)}
                  className="flex items-center gap-2"
                >
                  <Server className="w-3 h-3 text-cyan-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{target.hostname}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{target.ip}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onToggleMaximize && (
            <button onClick={onToggleMaximize} className="p-1.5 rounded hover:bg-accent transition-colors">
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* All terminal panes - render all but show only active to preserve connections */}
      <div className="flex-1 min-h-0 relative">
        {terminals.map(terminal => {
          const session = sessions.get(terminal.id);
          if (!session) return null;
          
          const isActive = terminal.id === activeTerminalId;
          
          return (
            <div
              key={terminal.id}
              className={`absolute inset-0 ${isActive ? 'visible' : 'invisible pointer-events-none'}`}
            >
              <TargetTerminalPane
                ref={getPaneRef(terminal.id)}
                terminal={terminal}
                session={session}
                onAddLine={addLine}
                onAddToHistory={addToHistory}
                onSetConnected={setConnected}
                onClear={clearTerminal}
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1 border-t border-red-500/20 bg-red-950/20 text-xs text-muted-foreground">
        Context-aware terminals • Each tab = separate target session • History persists across switches
      </div>
    </div>
  );
});

TargetTerminalManager.displayName = "TargetTerminalManager";
