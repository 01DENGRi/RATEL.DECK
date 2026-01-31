import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Circle, FolderOpen, Play, Square, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OpenVPNDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (connected: boolean, connecting: boolean, ip: string | null) => void;
}

interface TerminalLine {
  id: string;
  content: string;
  type: "input" | "output" | "error" | "success" | "info";
}

export interface OpenVPNDialogRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
}

export const OpenVPNDialog = forwardRef<OpenVPNDialogRef, OpenVPNDialogProps>(
  ({ open, onOpenChange, onStatusChange }, ref) => {
  const [history, setHistory] = useState<TerminalLine[]>([{ id: "1", content: "# OpenVPN Terminal", type: "info" }]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [vpnFilePath, setVpnFilePath] = useState<string>("");
  const [vpnIp, setVpnIp] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    setInputValue: setInput,
    focusInput: () => inputRef.current?.focus(),
  }));

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8787");
    wsRef.current = ws;

    ws.onopen = () => addLine("[+] Connected to OpenVPN shell", "success");

    ws.onmessage = (event) => {
      // Filter out ^C from output
      const data = event.data.replace(/\^C/g, '');
      if (data.trim()) {
        addLine(data, "output");
      }
      
      if (event.data.includes("Initialization Sequence Completed")) {
        setIsConnected(true);
        setIsConnecting(false);
        onStatusChange?.(true, false, vpnIp);
      }
      
      // Extract VPN IP
      const ipMatch = event.data.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        setVpnIp(ipMatch[1]);
        onStatusChange?.(isConnected, isConnecting, ipMatch[1]);
      }
    };

    ws.onerror = () => addLine("[-] WebSocket error", "error");

    ws.onclose = () => {
      addLine("[-] WebSocket closed", "error");
      setIsConnected(false);
      setIsConnecting(false);
      onStatusChange?.(false, false, null);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const addLine = (content: string, type: TerminalLine["type"]) => {
    // Filter ^C from content
    const filtered = content.replace(/\^C/g, '');
    if (filtered.trim()) {
      setHistory((prev) => [...prev, { id: Date.now().toString(), content: filtered, type }]);
    }
  };

  // Send interrupt
  const sendInterrupt = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("\x03");
      addLine("ctrl+c", "info");
    }
  };

  // File picker
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fullPath = (file as any).path || `/home/kali/Desktop/vpn/${file.name}`;
    setVpnFilePath(fullPath);
    addLine(`[+] Selected config: ${fullPath}`, "info");
  };

  // Start VPN
  const handleConnect = () => {
    if (!vpnFilePath) {
      addLine("Error: select a VPN config first", "error");
      return;
    }

    setIsConnecting(true);
    onStatusChange?.(false, true, null);
    const cmd = `sudo openvpn --config "${vpnFilePath}"`;
    addLine(`$ ${cmd}`, "input");
    wsRef.current?.send(`OPENVPN:${vpnFilePath}`);
  };

  // Stop VPN
  const handleDisconnect = () => {
    if (!wsRef.current) return;

    addLine("ctrl+c", "input");
    wsRef.current?.send("STOPVPN");
    setIsConnected(false);
    setIsConnecting(false);
    setVpnIp(null);
    onStatusChange?.(false, false, null);
    addLine("[!] VPN session terminated", "info");
  };

  // Terminal commands
  const handleCommand = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    addLine(`$ ${input}`, "input");
    wsRef.current?.send(input);
    setInput("");
  };

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input":
        return "text-primary";
      case "output":
        return "text-foreground";
      case "error":
        return "text-destructive";
      case "success":
        return "text-success";
      case "info":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col bg-background border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Shield className="w-5 h-5" />
            OpenVPN Terminal
            <Circle
              className={`w-3 h-3 ml-2 ${
                isConnected
                  ? "text-success fill-success"
                  : isConnecting
                    ? "text-warning fill-warning animate-pulse"
                    : "text-destructive fill-destructive"
              }`}
            />
            <span className="text-sm font-normal">
              {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
            </span>
            {isConnected && vpnIp && (
              <span className="text-sm font-mono text-success ml-2">
                IP: {vpnIp}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center gap-2 py-2 border-b border-border">
          <button onClick={() => fileInputRef.current?.click()} className="ctf-button flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Choose VPN Config
          </button>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !vpnFilePath}
              className="ctf-button flex items-center gap-2"
            >
              {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start VPN
            </button>
          ) : (
            <button onClick={handleDisconnect} className="ctf-button flex items-center gap-2 bg-destructive/20">
              <Square className="w-4 h-4" />
              Stop VPN
            </button>
          )}

          <input ref={fileInputRef} type="file" accept=".ovpn" style={{ display: "none" }} onChange={handleFilePick} />
        </div>

        {/* Terminal Output */}
        <ScrollArea ref={scrollRef} className="flex-1 bg-terminal-bg rounded p-3 font-mono text-sm">
          {history.map((line) => (
            <div key={line.id} className={getLineColor(line.type)}>
              {line.content}
            </div>
          ))}
        </ScrollArea>

        {/* Terminal Input */}
        <div className="flex items-start gap-2 p-2 border rounded">
          <span className="text-primary font-mono pt-1">$</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommand();
              }
              if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                sendInterrupt();
              }
            }}
            rows={1}
            className="flex-1 bg-transparent outline-none font-mono resize-none overflow-y-auto"
            style={{ maxHeight: '11lh', minHeight: '1.5rem' }}
            placeholder={isConnected ? "Enter command..." : "Connect first..."}
            disabled={!isConnected}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 11 * 24) + 'px';
            }}
          />
          {isConnected && (
            <button
              onClick={sendInterrupt}
              className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
              title="Send interrupt (Ctrl+C)"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Hint */}
        <div className="text-xs text-muted-foreground">
          Ctrl+C shows as "ctrl+c" • Enter Execute • Shift+Enter Newline
        </div>
      </DialogContent>
    </Dialog>
  );
});

OpenVPNDialog.displayName = "OpenVPNDialog";
