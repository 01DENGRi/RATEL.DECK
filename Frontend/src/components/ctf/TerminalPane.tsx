import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { Circle, Square, Power, PowerOff } from "lucide-react";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface TerminalLine {
  id: string;
  content: string;
  type: "input" | "output" | "error" | "system";
}

export interface TerminalPaneRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
  sendCommand: (cmd: string) => void;
  sendInterrupt: () => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

interface TerminalPaneProps {
  paneId: string;
  displayId?: string;
  wsUrl?: string;
  onConnectionChange?: (paneId: string, connected: boolean) => void;
}

export const TerminalPane = forwardRef<TerminalPaneRef, TerminalPaneProps>(function TerminalPane(
  { paneId, displayId, wsUrl = "ws://localhost:8787", onConnectionChange },
  ref,
) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addLine = useCallback((content: string, type: TerminalLine["type"]) => {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), content, type }]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    addLine(`[*] Connecting to ${wsUrl}...`, "system");

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus("connected");
      onConnectionChange?.(paneId, true);
      addLine("[+] Connected", "system");
    };

    ws.onmessage = (e) => {
      const data = e.data.replace(/\^C/g, "");
      data.split("\n").forEach((line) => {
        if (line.trim()) addLine(line, "output");
      });
    };

    ws.onerror = () => {
      setStatus("error");
      addLine("[-] Connection error", "error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      onConnectionChange?.(paneId, false);
      addLine("[*] Disconnected", "system");
    };

    wsRef.current = ws;
  }, [wsUrl, paneId, onConnectionChange, addLine]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
    onConnectionChange?.(paneId, false);
  }, [paneId, onConnectionChange]);

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
      setCommandHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(cmd);
      } else {
        addLine("[-] Not connected", "error");
      }

      setInput("");
    },
    [addLine],
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
    isConnected: () => status === "connected",
  }));

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      if (commandHistory[i]) {
        setHistoryIndex(i);
        setInput(commandHistory[i]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = historyIndex + 1;
      if (i >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(i);
        setInput(commandHistory[i]);
      }
    } else if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      sendInterrupt();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 bg-secondary/30">
        <span className="text-xs font-mono text-cyan-400">{displayId || `Pane ${paneId.slice(0, 4)}`}</span>

        {status !== "connected" ? (
          <button onClick={connect} className="text-xs bg-green-600 px-2 py-0.5 rounded">
            <Power className="w-3 h-3 inline" /> Connect
          </button>
        ) : (
          <button onClick={disconnect} className="text-xs bg-red-600 px-2 py-0.5 rounded">
            <PowerOff className="w-3 h-3 inline" /> Disconnect
          </button>
        )}
      </div>

      {/* OUTPUT */}
      <div
        ref={terminalRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-sm cursor-text select-text"
        onClick={(e) => {
          // Only focus input if no text is selected (allow copy)
          if (window.getSelection()?.toString() === '') {
            inputRef.current?.focus();
          }
        }}
      >
        {lines.map((line) => (
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
      <div className="flex gap-2 px-3 py-2 border-t border-border/50 bg-secondary/30">
        <span className="text-cyan-400">$</span>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status !== "connected"}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-gray-200"
        />
        {status === "connected" && (
          <button onClick={sendInterrupt} className="text-red-500">
            <Square className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});
