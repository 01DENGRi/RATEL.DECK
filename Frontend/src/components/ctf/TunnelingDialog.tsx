import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Route,
  Circle,
  Copy,
  Check,
  Terminal as TerminalIcon,
  Play,
  Square,
  Edit2,
  X,
  Columns,
  Power,
  PowerOff,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { tunnelingTools, TunnelingTool, TunnelingStep } from "@/data/tunnelingSteps";
import { Target } from "@/types/ctf";
import { toast } from "sonner";

interface TunnelingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets?: Target[];
  onStatusChange?: (isActive: boolean) => void;
}

interface TerminalLine {
  id: string;
  content: string;
  type: "input" | "output" | "error" | "success" | "info";
  paneId: number;
}

export interface TunnelingDialogRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
}

type LayoutType = "1" | "2h";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

function getLineColor(type: TerminalLine["type"]) {
  switch (type) {
    case "input":
      return "text-primary";
    case "error":
      return "text-destructive";
    case "success":
      return "text-emerald-400";
    case "info":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

interface TunnelingTerminalPaneProps {
  paneId: number;
  lines: TerminalLine[];
  inputValue: string;
  setInputValue: (v: string) => void;
  inputRefLocal: React.RefObject<HTMLTextAreaElement>;
  scrollRefLocal: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  onActivate: () => void;
  status: ConnectionStatus;
  layout: LayoutType;
  onConnect: (paneId: number) => void;
  onDisconnect: (paneId: number) => void;
  onKeyDown: (e: React.KeyboardEvent, paneId: number) => void;
  onSendInterrupt: (paneId: number) => void;
}

function TunnelingTerminalPane({
  paneId,
  lines,
  inputValue,
  setInputValue,
  inputRefLocal,
  scrollRefLocal,
  isActive,
  onActivate,
  status,
  layout,
  onConnect,
  onDisconnect,
  onKeyDown,
  onSendInterrupt,
}: TunnelingTerminalPaneProps) {
  const isConnected = status === "connected";
  const showSeparateButtons = layout === "2h";

  // NOTE: keep resize and state update separated to avoid selection/cursor glitches.
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setInputValue(next);

    const el = e.target;
    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 11 * 24) + "px";
    });
  };

  return (
    <div
      className={`flex flex-col h-full ${isActive ? "ring-1 ring-primary" : ""}`}
      onClick={onActivate}
    >
      {/* Pane Header with Connect/Disconnect button */}
      {showSeparateButtons && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 bg-secondary/30 rounded-t">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Pane {paneId + 1}</span>
            <Circle
              className={`w-2 h-2 ${isConnected ? "text-emerald-400 fill-emerald-400" : "text-muted-foreground"}`}
            />
          </div>

          {isConnected ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect(paneId);
              }}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <PowerOff className="w-3 h-3" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConnect(paneId);
              }}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              <Power className="w-3 h-3" />
              Connect
            </button>
          )}
        </div>
      )}

      <ScrollArea ref={scrollRefLocal} className="flex-1 border rounded-b bg-black/90">
        <div className="p-3 font-mono text-sm space-y-1">
          {lines.map((line) => (
            <div key={line.id} className={getLineColor(line.type)}>
              {line.content}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-2 flex items-start gap-2 border rounded p-2 bg-secondary/30">
        <span className="font-mono pt-1 text-primary">$</span>
        <textarea
          ref={inputRefLocal}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => onKeyDown(e, paneId)}
          className="flex-1 bg-transparent outline-none font-mono text-foreground placeholder:text-muted-foreground resize-none overflow-y-auto"
          placeholder={isConnected ? "Enter command..." : "Connect first..."}
          disabled={!isConnected}
          rows={1}
          style={{
            maxHeight: "11lh",
            minHeight: "1.5rem",
          }}
        />
        {isConnected && (
          <button
            onClick={() => onSendInterrupt(paneId)}
            className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
            title="Send interrupt (Ctrl+C)"
          >
            <Square className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export const TunnelingDialog = forwardRef<TunnelingDialogRef, TunnelingDialogProps>(
  ({ open, onOpenChange, targets = [], onStatusChange }, ref) => {
    const [selectedTool, setSelectedTool] = useState<TunnelingTool | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [history, setHistory] = useState<TerminalLine[]>([
      { id: "init", content: "# Tunneling Terminal - Pane 1", type: "info", paneId: 0 },
    ]);
    const [input, setInput] = useState("");
    const [input2, setInput2] = useState("");
    const [selectedTarget, setSelectedTarget] = useState("");
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
    const [editingStep, setEditingStep] = useState<string | null>(null);
    const [editedCommands, setEditedCommands] = useState<Record<string, string>>({});
    const [layout, setLayout] = useState<LayoutType>("1");
    const [activePane, setActivePane] = useState(0);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Separate connection states for each pane
    const [pane1Status, setPane1Status] = useState<ConnectionStatus>("disconnected");
    const [pane2Status, setPane2Status] = useState<ConnectionStatus>("disconnected");

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const inputRef2 = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollRef2 = useRef<HTMLDivElement>(null);

    // Separate WebSocket refs for each pane
    const wsRef1 = useRef<WebSocket | null>(null);
    const wsRef2 = useRef<WebSocket | null>(null);

    const target = targets.find((t) => t.id === selectedTarget);

    useImperativeHandle(ref, () => ({
      setInputValue: (value: string) => {
        if (activePane === 0) {
          setInput(value);
          inputRef.current?.focus();
        } else {
          setInput2(value);
          inputRef2.current?.focus();
        }
      },
      focusInput: () => {
        if (activePane === 0) {
          inputRef.current?.focus();
        } else {
          inputRef2.current?.focus();
        }
      },
    }));

    // Auto-scroll terminals
    useEffect(() => {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      scrollRef2.current?.scrollTo(0, scrollRef2.current.scrollHeight);
    }, [history]);

    // Notify parent of connection status changes
    useEffect(() => {
      const isActive = pane1Status === "connected" || pane2Status === "connected";
      onStatusChange?.(isActive);
    }, [pane1Status, pane2Status, onStatusChange]);

    const addLine = useCallback((content: string, type: TerminalLine["type"], paneId: number) => {
      const filteredContent = content.replace(/\^C/g, "");
      if (filteredContent.trim()) {
        setHistory((prev) => [...prev, { id: crypto.randomUUID(), content: filteredContent, type, paneId }]);
      }
    }, []);

    // Connect function for specific pane
    const connectPane = useCallback(
      (paneId: number) => {
        const wsRef = paneId === 0 ? wsRef1 : wsRef2;
        const setStatus = paneId === 0 ? setPane1Status : setPane2Status;

        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setStatus("connecting");
        addLine(`[*] Connecting to tunneling shell...`, "info", paneId);

        const ws = new WebSocket("ws://localhost:8787");
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus("connected");
          addLine(`[+] Connected (Pane ${paneId + 1})`, "success", paneId);
        };

        ws.onmessage = (event) => {
          event.data
            .split("\n")
            .filter(Boolean)
            .forEach((line: string) => {
              const filtered = line.replace(/\^C/g, "");
              if (filtered.trim()) addLine(filtered, "output", paneId);
            });
        };

        ws.onerror = () => {
          setStatus("error");
          addLine("[-] WebSocket error", "error", paneId);
        };

        ws.onclose = () => {
          setStatus("disconnected");
          if (paneId === 0) wsRef1.current = null;
          else wsRef2.current = null;
          addLine("[!] Connection closed", "info", paneId);
        };
      },
      [addLine],
    );

    // Disconnect function for specific pane - ONLY called by Disconnect button
    const disconnectPane = useCallback(
      (paneId: number) => {
        const wsRef = paneId === 0 ? wsRef1 : wsRef2;
        const setStatus = paneId === 0 ? setPane1Status : setPane2Status;

        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        setStatus("disconnected");
        addLine("[!] Disconnected", "info", paneId);
      },
      [addLine],
    );

    // When switching to split layout, add pane 2 init line
    useEffect(() => {
      if (layout === "2h") {
        setHistory((prev) => {
          const hasPane2Init = prev.some((l) => l.paneId === 1 && l.type === "info");
          if (!hasPane2Init) {
            return [
              ...prev,
              { id: crypto.randomUUID(), content: "# Tunneling Terminal - Pane 2", type: "info", paneId: 1 },
            ];
          }
          return prev;
        });
      }
    }, [layout]);

    const injectVariables = (command: string): string => {
      if (!target) return command;
      return command
        .replace(/\{HOST\}/gi, target.ip || target.hostname)
        .replace(/\{IP\}/gi, target.ip)
        .replace(/\{HOSTNAME\}/gi, target.hostname)
        .replace(/\{USERNAME\}/gi, target.credentials[0]?.username || "user")
        .replace(/\{USER\}/gi, target.credentials[0]?.username || "user")
        .replace(/\{PASSWORD\}/gi, target.credentials[0]?.password || "password")
        .replace(/\{PASS\}/gi, target.credentials[0]?.password || "password");
    };

    const handleToolSelect = (toolId: string) => {
      const tool = tunnelingTools.find((t) => t.id === toolId);
      if (!tool) return;

      setSelectedTool(tool);
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      setEditedCommands({});

      addLine(`# Selected tool: ${tool.name}`, "info", activePane);
      addLine(`# ${tool.description}`, "info", activePane);
    };

    const getStepCommand = (step: TunnelingStep): string => {
      const edited = editedCommands[step.id];
      return edited !== undefined ? edited : injectVariables(step.command);
    };

    const handleStepClick = (step: TunnelingStep, index: number) => {
      setCurrentStepIndex(index);
      const command = getStepCommand(step);
      if (activePane === 0) {
        setInput(command.split("\n")[0]);
        inputRef.current?.focus();
      } else {
        setInput2(command.split("\n")[0]);
        inputRef2.current?.focus();
      }
    };

    const handleCopyCommand = (step: TunnelingStep) => {
      const command = getStepCommand(step);
      navigator.clipboard.writeText(command);
      setCopiedCommand(step.id);
      toast.success("Command copied");
      setTimeout(() => setCopiedCommand(null), 2000);
    };

    const handleEditStep = (step: TunnelingStep) => {
      setEditingStep(step.id);
      if (editedCommands[step.id] === undefined) {
        setEditedCommands((prev) => ({ ...prev, [step.id]: injectVariables(step.command) }));
      }
    };

    const handleSaveEdit = (stepId: string) => {
      setEditingStep(null);
      toast.success("Command updated");
    };

    const handleCancelEdit = (stepId: string) => {
      setEditingStep(null);
    };

    // Send interrupt (Ctrl+C) for specific pane
    const sendInterrupt = useCallback(
      (paneId: number) => {
        const wsRef = paneId === 0 ? wsRef1 : wsRef2;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send("\x03");
          addLine("^C", "info", paneId);
        }
      },
      [addLine],
    );

    // Send input to shell for specific pane
    const handleSendCommand = useCallback(
      (paneId: number) => {
        const currentInput = paneId === 0 ? input : input2;
        const wsRef = paneId === 0 ? wsRef1 : wsRef2;

        if (!currentInput.trim()) return;

        addLine(`$ ${currentInput}`, "input", paneId);
        setCommandHistory((prev) => [...prev, currentInput]);
        setHistoryIndex(-1);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(currentInput);
        } else {
          addLine("[-] Not connected", "error", paneId);
        }

        if (paneId === 0) {
          setInput("");
        } else {
          setInput2("");
        }
      },
      [input, input2, addLine],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, paneId: number) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendCommand(paneId);
        } else if (e.key === "ArrowUp" && !e.shiftKey) {
          e.preventDefault();
          if (commandHistory.length > 0) {
            const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            if (paneId === 0) {
              setInput(commandHistory[newIndex]);
            } else {
              setInput2(commandHistory[newIndex]);
            }
          }
        } else if (e.key === "ArrowDown" && !e.shiftKey) {
          e.preventDefault();
          if (historyIndex !== -1) {
            const newIndex = historyIndex + 1;
            if (newIndex >= commandHistory.length) {
              setHistoryIndex(-1);
              if (paneId === 0) setInput("");
              else setInput2("");
            } else {
              setHistoryIndex(newIndex);
              if (paneId === 0) {
                setInput(commandHistory[newIndex]);
              } else {
                setInput2(commandHistory[newIndex]);
              }
            }
          }
        } else if (e.key === "c" && e.ctrlKey) {
          e.preventDefault();
          sendInterrupt(paneId);
        }
      },
      [commandHistory, historyIndex, handleSendCommand, sendInterrupt],
    );

    const pane1Lines = history.filter((l) => l.paneId === 0);
    const pane2Lines = history.filter((l) => l.paneId === 1);

    // Helper to check if any pane is connected (for single pane mode)
    const shellActive = pane1Status === "connected";

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[750px] flex flex-col bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Tunneling Terminal
              {layout === "1" && shellActive && <Circle className="w-3 h-3 ml-2 text-emerald-400 fill-emerald-400" />}
            </DialogTitle>
            <p className="text-sm font-semibold text-neon-red mt-1 drop-shadow-[0_0_10px_hsl(var(--neon-red))] animate-pulse">
              ⚠ Under Development
            </p>
          </DialogHeader>

          {/* Tool & Target Selectors + Controls */}
          <div className="flex items-center gap-2 border-b border-border py-2">
            <Select onValueChange={handleToolSelect}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select tool..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {tunnelingTools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {targets.length > 0 && (
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.hostname || t.ip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
              <button
                onClick={() => setLayout("1")}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${layout === "1" ? "bg-accent" : ""}`}
                title="Single pane"
              >
                <TerminalIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout("2h")}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${layout === "2h" ? "bg-accent" : ""}`}
                title="Split left/right"
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>

            {/* Only show global connect/disconnect in single pane mode */}
            {layout === "1" && (
              <div className="flex items-center gap-2 ml-auto">
                {shellActive ? (
                  <button
                    onClick={() => disconnectPane(0)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connectPane(0)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Connect
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
            {/* Steps Panel - Left Side */}
            <div className="col-span-4 flex flex-col border rounded-lg overflow-hidden">
              <div className="p-3 border-b border-border bg-secondary/30">
                <h3 className="font-semibold text-sm">Steps</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {selectedTool ? (
                    selectedTool.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          index === currentStepIndex
                            ? "border-primary bg-primary/10"
                            : completedSteps.has(step.id)
                              ? "border-emerald-500/50 bg-emerald-500/10"
                              : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handleStepClick(step, index)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{index + 1}</span>
                            <span className="font-medium text-sm">{step.title}</span>
                          </div>
                          {step.side && (
                            <Badge variant="outline" className="text-xs">
                              {step.side === "attacker" ? "Attacker" : step.side === "target" ? "Target" : "Both"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{step.description}</p>

                        {editingStep === step.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editedCommands[step.id] || ""}
                              onChange={(e) =>
                                setEditedCommands((prev) => ({
                                  ...prev,
                                  [step.id]: e.target.value,
                                }))
                              }
                              className="w-full p-2 rounded bg-muted font-mono text-xs resize-none"
                              rows={3}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit(step.id);
                                }}
                                className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit(step.id);
                                }}
                                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Separate horizontal scrollbar for each step's command */}
                            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                              <code className="block text-xs bg-muted p-2 rounded font-mono whitespace-nowrap min-w-max">
                                {getStepCommand(step)}
                              </code>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCommand(step);
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
                                title="Copy command"
                              >
                                {copiedCommand === step.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>Copy</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStep(step);
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
                                title="Edit command"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const command = getStepCommand(step);
                                  const targetPane = step.side === "target" ? 1 : 0;
                                  if (targetPane === 0) {
                                    setInput(command.split("\n")[0]);
                                    inputRef.current?.focus();
                                  } else {
                                    setInput2(command.split("\n")[0]);
                                    inputRef2.current?.focus();
                                  }
                                  setActivePane(targetPane);
                                  toast.success("Command loaded to terminal");
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
                                title="Pass to terminal"
                              >
                                <TerminalIcon className="w-3.5 h-3.5" />
                                <span>Terminal</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Route className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a tunneling tool to begin</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Terminal Panel(s) - Right Side */}
            <div className="col-span-8 flex flex-col min-h-0">
              {layout === "1" ? (
                <div className="flex-1 min-h-0">
                  <TunnelingTerminalPane
                    paneId={0}
                    lines={pane1Lines}
                    inputValue={input}
                    setInputValue={setInput}
                    inputRefLocal={inputRef}
                    scrollRefLocal={scrollRef}
                    isActive={activePane === 0}
                    onActivate={() => setActivePane(0)}
                    status={pane1Status}
                    layout={layout}
                    onConnect={connectPane}
                    onDisconnect={disconnectPane}
                    onKeyDown={handleKeyDown}
                    onSendInterrupt={sendInterrupt}
                  />
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
                  <div className="min-h-0">
                    <TunnelingTerminalPane
                      paneId={0}
                      lines={pane1Lines}
                      inputValue={input}
                      setInputValue={setInput}
                      inputRefLocal={inputRef}
                      scrollRefLocal={scrollRef}
                      isActive={activePane === 0}
                      onActivate={() => setActivePane(0)}
                      status={pane1Status}
                      layout={layout}
                      onConnect={connectPane}
                      onDisconnect={disconnectPane}
                      onKeyDown={handleKeyDown}
                      onSendInterrupt={sendInterrupt}
                    />
                  </div>
                  <div className="min-h-0">
                    <TunnelingTerminalPane
                      paneId={1}
                      lines={pane2Lines}
                      inputValue={input2}
                      setInputValue={setInput2}
                      inputRefLocal={inputRef2}
                      scrollRefLocal={scrollRef2}
                      isActive={activePane === 1}
                      onActivate={() => setActivePane(1)}
                      status={pane2Status}
                      layout={layout}
                      onConnect={connectPane}
                      onDisconnect={disconnectPane}
                      onKeyDown={handleKeyDown}
                      onSendInterrupt={sendInterrupt}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            ↑↓ History • Ctrl+C Interrupt • Enter Execute • Click step to load command
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

TunnelingDialog.displayName = "TunnelingDialog";
