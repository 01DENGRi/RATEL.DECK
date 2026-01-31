import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Circle, AlertCircle } from 'lucide-react';

interface TerminalProps {
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface TerminalRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error' | 'system';
}

export const Terminal = forwardRef<TerminalRef, TerminalProps>(function Terminal(
  { isMaximized, onToggleMaximize, onConnectionChange },
  ref
) {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => {
      setInput(value);
      inputRef.current?.focus();
    },
    focusInput: () => {
      inputRef.current?.focus();
    },
  }));

  const addLine = useCallback((content: string, type: TerminalLine['type']) => {
    setLines(prev => [...prev, { 
      id: crypto.randomUUID(), 
      content, 
      type 
    }]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    addLine('[*] Connecting to Kali agent at ws://localhost:8787...', 'system');

    try {
      const ws = new WebSocket('ws://localhost:8787');

      ws.onopen = () => {
        setStatus('connected');
        onConnectionChange?.(true);
        addLine('[+] Connected to Kali agent!', 'system');
        addLine('[+] Shell: /usr/bin/zsh', 'system');
      };

      ws.onmessage = (event) => {
        const data = event.data;
        // Split by newlines and add each line
        const outputLines = data.split('\n');
        outputLines.forEach((line: string) => {
          if (line.trim()) {
            addLine(line, 'output');
          }
        });
      };

      ws.onerror = () => {
        setStatus('error');
        onConnectionChange?.(false);
        addLine('[-] WebSocket error. Is the Kali agent running?', 'error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onConnectionChange?.(false);
        addLine('[!] Connection closed', 'system');
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
      onConnectionChange?.(false);
      addLine(`[-] Failed to connect: ${error}`, 'error');
    }
  }, [addLine, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  const sendCommand = useCallback((cmd: string) => {
    if (!cmd.trim()) return;

    addLine(`$ ${cmd}`, 'input');
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd);
    } else {
      addLine('[-] Not connected. Click "Connect" to start.', 'error');
    }

    setInput('');
  }, [addLine]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('\x03'); // Send Ctrl+C
        addLine('^C', 'system');
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when clicking terminal
  const focusInput = () => inputRef.current?.focus();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const statusColors: Record<ConnectionStatus, string> = {
    connecting: 'text-warning',
    connected: 'text-success',
    disconnected: 'text-muted-foreground',
    error: 'text-destructive',
  };

  const statusLabels: Record<ConnectionStatus, string> = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  return (
    <div className={`terminal-panel flex flex-col ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-semibold text-foreground">Terminal</span>
          <div className={`flex items-center gap-1 text-xs ${statusColors[status]}`}>
            <Circle className="w-2 h-2 fill-current" />
            {statusLabels[status]}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {status === 'disconnected' || status === 'error' ? (
            <button 
              onClick={connect}
              className="ctf-button-primary text-xs px-2 py-1"
            >
              Connect
            </button>
          ) : status === 'connected' ? (
            <button 
              onClick={disconnect}
              className="ctf-button text-xs px-2 py-1"
            >
              Disconnect
            </button>
          ) : null}
          <button
            onClick={onToggleMaximize}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        onClick={focusInput}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm bg-terminal-bg cursor-text"
      >
        {lines.length === 0 && (
          <div className="text-muted-foreground">
            <p className="mb-2">┌─────────────────────────────────────┐</p>
            <p>│  CTF Commander Terminal             │</p>
            <p>│  WebSocket: ws://localhost:8787     │</p>
            <p>│  Shell: /usr/bin/zsh                │</p>
            <p className="mb-2">└─────────────────────────────────────┘</p>
            <p className="text-neon-cyan">Click "Connect" to start a session</p>
          </div>
        )}
        {lines.map(line => (
          <div 
            key={line.id}
            className={`whitespace-pre-wrap break-all ${
              line.type === 'input' ? 'text-neon-cyan' :
              line.type === 'error' ? 'text-destructive' :
              line.type === 'system' ? 'text-warning' :
              'text-foreground'
            }`}
          >
            {line.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-secondary/30">
        <span className="text-neon-cyan font-mono text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={status === 'connected' ? 'Enter command...' : 'Connect first...'}
          disabled={status !== 'connected'}
          className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>

      {/* Hint */}
      <div className="px-3 py-1 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
        ↑↓ History • Ctrl+C Interrupt • Enter Execute
      </div>
    </div>
  );
});
