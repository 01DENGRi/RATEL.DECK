import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { Circle, Square, Power, PowerOff, Trash2, Server, Monitor } from "lucide-react";
import type { TargetTerminal, TargetTerminalSession, TerminalLine } from "@/types/ctf";

export interface TargetTerminalPaneRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
  sendCommand: (cmd: string) => void;
  sendInterrupt: () => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

interface TargetTerminalPaneProps {
  terminal: TargetTerminal;
  session: TargetTerminalSession;
  wsUrl?: string;
  onAddLine: (terminalId: string, content: string, type: TerminalLine["type"]) => void;
  onAddToHistory: (terminalId: string, command: string) => void;
  onSetConnected: (terminalId: string, connected: boolean) => void;
  onClear: (terminalId: string) => void;
}

export const TargetTerminalPane = forwardRef<TargetTerminalPaneRef, TargetTerminalPaneProps>(
  function TargetTerminalPane(
    { terminal, session, wsUrl = "ws://localhost:8787", onAddLine, onAddToHistory, onSetConnected, onClear },
    ref
  ) {
    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const wsRef = useRef<WebSocket | null>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const addLine = useCallback((content: string, type: TerminalLine["type"]) => {
      onAddLine(terminal.id, content, type);
    }, [terminal.id, onAddLine]);

    const connect = useCallback(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      addLine(`[*] Connecting to ${wsUrl}...`, "system");
      addLine(`[*] Target: ${terminal.targetHostname} (${terminal.targetIp})`, "system");
      if (terminal.listenerContext) {
        addLine(`[*] Context: ${terminal.listenerContext}`, "system");
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        onSetConnected(terminal.id, true);
        addLine("[+] Connected", "system");
      };

      ws.onmessage = (e) => {
        const data = e.data.replace(/\^C/g, "");
        data.split("\n").forEach((line: string) => {
          if (line.trim()) addLine(line, "output");
        });
      };

      ws.onerror = () => {
        addLine("[-] Connection error", "error");
      };

      ws.onclose = () => {
        wsRef.current = null;
        onSetConnected(terminal.id, false);
        addLine("[*] Disconnected", "system");
      };

      wsRef.current = ws;
    }, [wsUrl, terminal, onSetConnected, addLine]);

    const disconnect = useCallback(() => {
      wsRef.current?.close();
      wsRef.current = null;
      onSetConnected(terminal.id, false);
    }, [terminal.id, onSetConnected]);

    useEffect(() => {
      return () => wsRef.current?.close();
    }, []);

    const sendInterrupt = useCallback(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("\x03");
        addLine("^C", "system");
      }
    }, [addLine]);

    const sendCommand = useCallback(
      (cmd: string) => {
        if (!cmd.trim()) return;

        addLine(`$ ${cmd}`, "input");
        onAddToHistory(terminal.id, cmd);
        setHistoryIndex(-1);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(cmd);
        } else {
          addLine("[-] Not connected", "error");
        }

        setInput("");
      },
      [addLine, terminal.id, onAddToHistory]
    );

    useImperativeHandle(ref, () => ({
      setInputValue: (v) => {
        setInput(v);
        inputRef.current?.focus();
      },
      focusInput: () => inputRef.current?.focus(),
      sendCommand,
      sendInterrupt,
      connect,
      disconnect,
      isConnected: () => session.isConnected,
    }));

    useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, [session.lines]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const history = session.commandHistory;
      
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendCommand(input);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const i = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        if (history[i]) {
          setHistoryIndex(i);
          setInput(history[i]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const i = historyIndex + 1;
        if (i >= history.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(i);
          setInput(history[i]);
        }
      } else if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        sendInterrupt();
      }
    };

    return (
      <div className="flex flex-col h-full min-h-0 bg-black/90">
        {/* Target Context Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/30 bg-cyan-950/30">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-cyan-400">{terminal.displayName}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{terminal.targetIp}</span>
            </div>
            {terminal.listenerContext && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {terminal.listenerContext}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection indicator */}
            <div className={`w-2 h-2 rounded-full ${session.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            
            {!session.isConnected ? (
              <button onClick={connect} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-0.5 rounded flex items-center gap-1">
                <Power className="w-3 h-3" /> Connect
              </button>
            ) : (
              <button onClick={disconnect} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded flex items-center gap-1">
                <PowerOff className="w-3 h-3" /> Disconnect
              </button>
            )}
            
            <button 
              onClick={() => onClear(terminal.id)} 
              className="text-xs bg-secondary hover:bg-accent px-2 py-0.5 rounded flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        <div
          ref={terminalRef}
          className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-sm cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {session.lines.map((line) => (
            <div
              key={line.id}
              className={
                line.type === "input"
                  ? "text-cyan-400"
                  : line.type === "error"
                    ? "text-red-400"
                    : line.type === "system"
                      ? "text-yellow-400"
                      : "text-gray-200"
              }
            >
              {line.content}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="flex gap-2 px-3 py-2 border-t border-cyan-500/30 bg-cyan-950/20">
          <span className="text-cyan-400 font-bold">{terminal.targetHostname}$</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!session.isConnected}
            rows={1}
            placeholder={session.isConnected ? "Enter command..." : "Connect to enter commands"}
            className="flex-1 bg-transparent resize-none outline-none text-gray-200 placeholder:text-muted-foreground/50"
          />
          {session.isConnected && (
            <button onClick={sendInterrupt} className="text-red-500 hover:text-red-400" title="Send Ctrl+C">
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
