import { useState, useRef, useEffect } from 'react';
import { Globe, Play, Square, FolderOpen, Copy, Check, ExternalLink, ChevronRight, Home, ArrowUp, RefreshCw, Folder } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface HTTPServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerStatusChange?: (running: boolean) => void;
}

type ServerStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

interface LogLine {
  id: string;
  content: string;
  type: 'info' | 'request' | 'error' | 'system';
  timestamp: Date;
}

interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
}

export function HTTPServerDialog({ open, onOpenChange, onServerStatusChange }: HTTPServerDialogProps) {
  const [directory, setDirectory] = useState('/tmp');
  const [port, setPort] = useState('8000');
  const [status, setStatus] = useState<ServerStatus>('idle');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [copied, setCopied] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loadingDir, setLoadingDir] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const browserWsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const serverUrl = `http://0.0.0.0:${port}`;

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Don't close WebSocket when dialog closes - only when explicitly stopped
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const addLog = (content: string, type: LogLine['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      content,
      type,
      timestamp: new Date()
    }]);
  };

  const listDirectory = (path: string) => {
    setLoadingDir(true);
    setEntries([]);
    
    if (browserWsRef.current?.readyState === WebSocket.OPEN) {
      browserWsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:8787');
    browserWsRef.current = ws;
    
    let output = '';

    ws.onopen = () => {
      // Use a command that gives clean, parseable output
      ws.send(`ls -1aF "${path}" 2>/dev/null\n`);
    };

    ws.onmessage = (event) => {
      const data = event.data;
      if (typeof data === 'string') {
        output += data;
      }
    };

    ws.onclose = () => {
      setLoadingDir(false);
      // Parse the output
      const lines = output.split('\n').filter(l => {
        const trimmed = l.trim();
        // Filter out prompt lines and empty lines
        if (!trimmed) return false;
        if (trimmed.includes('┌──') || trimmed.includes('└─')) return false;
        if (trimmed.includes('zsh') || trimmed.includes('kali')) return false;
        if (trimmed.startsWith('ls ')) return false;
        return true;
      });

      const parsedEntries: DirectoryEntry[] = [];
      lines.forEach(line => {
        const name = line.trim();
        if (!name || name === '.' || name === './') return;
        
        const isDir = name.endsWith('/');
        const cleanName = isDir ? name.slice(0, -1) : name.replace(/[*@|=]$/, '');
        
        if (cleanName === '..') {
          parsedEntries.unshift({ name: '..', isDirectory: true });
        } else if (cleanName) {
          parsedEntries.push({ name: cleanName, isDirectory: isDir });
        }
      });

      setEntries(parsedEntries);
      setCurrentPath(path);
    };

    ws.onerror = () => {
      setLoadingDir(false);
      toast.error('Failed to browse directory');
    };

    // Timeout to close connection
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }, 2000);
  };

  const navigateTo = (entry: DirectoryEntry) => {
    if (!entry.isDirectory) return;
    
    let newPath: string;
    if (entry.name === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      newPath = '/' + parts.join('/');
    } else {
      newPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
    }
    
    listDirectory(newPath);
  };

  const selectCurrentDirectory = () => {
    setDirectory(currentPath);
    setShowBrowser(false);
    toast.success(`Selected: ${currentPath}`);
  };

  const startServer = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setStatus('starting');
    setLogs([]);
    addLog(`Starting HTTP server on port ${port}...`, 'system');
    addLog(`Serving directory: ${directory}`, 'system');

    const ws = new WebSocket('ws://localhost:8787');
    wsRef.current = ws;

    ws.onopen = () => {
      const command = `cd "${directory}" && python3 -m http.server ${port}`;
      ws.send(command + '\n');
      addLog(`$ ${command}`, 'info');
      setStatus('running');
      onServerStatusChange?.(true);
      toast.success(`HTTP server started on port ${port}`);
    };

    ws.onmessage = (event) => {
      const data = event.data;
      if (typeof data === 'string' && data.trim()) {
        const lines = data.split('\n').filter((l: string) => l.trim());
        lines.forEach((line: string) => {
          if (line.includes('┌──') || line.includes('└─') || line.includes('zsh')) return;
          
          if (line.includes('GET') || line.includes('POST') || line.includes('HEAD')) {
            addLog(line, 'request');
          } else if (line.includes('Error') || line.includes('error') || line.includes('Address already in use')) {
            addLog(line, 'error');
            if (line.includes('Address already in use')) {
              setStatus('error');
              onServerStatusChange?.(false);
              toast.error(`Port ${port} is already in use`);
            }
          } else {
            addLog(line, 'info');
          }
        });
      }
    };

    ws.onerror = () => {
      addLog('Connection error - is the terminal agent running?', 'error');
      setStatus('error');
      onServerStatusChange?.(false);
      toast.error('Failed to connect to terminal agent');
    };

    ws.onclose = () => {
      if (status === 'running') {
        addLog('Connection closed', 'system');
        setStatus('idle');
        onServerStatusChange?.(false);
      }
    };
  };

  const stopServer = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('\x03');
      addLog('Stopping server...', 'system');
      setStatus('stopping');
      
      setTimeout(() => {
        wsRef.current?.close();
        wsRef.current = null;
        setStatus('idle');
        onServerStatusChange?.(false);
        addLog('Server stopped', 'system');
        toast.success('HTTP server stopped');
      }, 500);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(serverUrl);
    setCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-success';
      case 'starting': return 'text-warning animate-pulse';
      case 'stopping': return 'text-warning animate-pulse';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'Server Running';
      case 'starting': return 'Starting...';
      case 'stopping': return 'Stopping...';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  };

  const getLogColor = (type: LogLine['type']) => {
    switch (type) {
      case 'request': return 'text-success';
      case 'error': return 'text-destructive';
      case 'system': return 'text-primary';
      default: return 'text-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-card border-2 border-[hsl(var(--panel-border))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary glow-text-cyan font-mono">
            <Globe className="w-5 h-5" />
            HTTP Server
            <span className={`ml-auto text-sm font-normal ${getStatusColor()}`}>
              ● {getStatusText()}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-[1fr,100px] gap-4">
            <div className="space-y-2">
              <Label htmlFor="directory" className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <FolderOpen className="w-3 h-3" />
                Directory
              </Label>
              <div className="flex gap-2">
                <Input
                  id="directory"
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder="/path/to/serve"
                  className="font-mono text-sm bg-background border-[hsl(var(--panel-border))]"
                  disabled={status === 'running' || status === 'starting'}
                />
                <button
                  onClick={() => {
                    setShowBrowser(true);
                    listDirectory(directory || '/');
                  }}
                  disabled={status === 'running' || status === 'starting'}
                  className="ctf-button px-3 disabled:opacity-50"
                  title="Browse directories"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="port" className="text-xs text-muted-foreground font-mono">
                Port
              </Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))}
                placeholder="8000"
                className="font-mono text-sm bg-background border-[hsl(var(--panel-border))]"
                disabled={status === 'running' || status === 'starting'}
              />
            </div>
          </div>

          {/* Directory Browser */}
          {showBrowser && (
            <div className="border border-[hsl(var(--panel-border))] rounded-md bg-background overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 p-2 bg-muted/30 border-b border-[hsl(var(--panel-border))]">
                <button
                  onClick={() => listDirectory('/')}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Go to root"
                >
                  <Home className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const parts = currentPath.split('/').filter(Boolean);
                    parts.pop();
                    listDirectory('/' + parts.join('/'));
                  }}
                  disabled={currentPath === '/'}
                  className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                  title="Go up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => listDirectory(currentPath)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDir ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex-1 font-mono text-sm text-muted-foreground truncate px-2">
                  {currentPath}
                </div>
                <button
                  onClick={selectCurrentDirectory}
                  className="ctf-button text-xs px-3 py-1 bg-primary/20 hover:bg-primary/30 border-primary text-primary"
                >
                  Select
                </button>
                <button
                  onClick={() => setShowBrowser(false)}
                  className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground"
                >
                  ✕
                </button>
              </div>
              
              {/* Directory List */}
              <ScrollArea className="h-48">
                <div className="p-1">
                  {loadingDir ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Empty directory
                    </div>
                  ) : (
                    entries.map((entry, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigateTo(entry)}
                        disabled={!entry.isDirectory}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left text-sm font-mono transition-colors ${
                          entry.isDirectory 
                            ? 'hover:bg-primary/10 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {entry.isDirectory ? (
                          <Folder className="w-4 h-4 text-primary" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className={entry.isDirectory ? 'text-primary' : 'text-muted-foreground'}>
                          {entry.name}
                        </span>
                        {entry.isDirectory && entry.name !== '..' && (
                          <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Server URL when running */}
          {status === 'running' && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-md">
              <ExternalLink className="w-4 h-4 text-success" />
              <code className="flex-1 text-sm font-mono text-success">{serverUrl}</code>
              <button
                onClick={copyUrl}
                className="p-1.5 hover:bg-success/20 rounded transition-colors"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-success" />
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {status === 'idle' || status === 'error' ? (
              <button
                onClick={startServer}
                className="ctf-button flex-1 flex items-center justify-center gap-2 bg-success/20 hover:bg-success/30 border-success text-success"
              >
                <Play className="w-4 h-4" />
                Start Server
              </button>
            ) : (
              <button
                onClick={stopServer}
                disabled={status === 'stopping'}
                className="ctf-button flex-1 flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/30 border-destructive text-destructive disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                Stop Server
              </button>
            )}
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-mono">
              Server Logs
            </Label>
            <ScrollArea className="h-40 bg-background border border-[hsl(var(--panel-border))] rounded-md p-3">
              <div className="font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground italic">
                    No logs yet. Start the server to see activity.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={`${getLogColor(log.type)} break-all`}>
                      <span className="text-muted-foreground">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>{' '}
                      {log.content}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Quick Tips */}
          <div className="text-xs text-muted-foreground font-mono space-y-1 border-t border-[hsl(var(--panel-border))] pt-3">
            <div className="font-semibold text-primary">Quick Tips:</div>
            <div>• Server keeps running when dialog is closed</div>
            <div>• Access from target: <code className="bg-muted px-1 rounded">wget http://YOUR_IP:{port}/file</code></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
