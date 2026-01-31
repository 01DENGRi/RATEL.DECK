import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileUp, FileText, Check, AlertCircle, Network } from 'lucide-react';
import { parseNmapXML, nmapResultToTasks, type NmapResult } from '@/utils/nmapParser';
import type { Task, TaskCategory, TaskStatus } from '@/types/ctf';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NmapImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (tasks: Omit<Task, 'id'>[]) => void;
}

export function NmapImportDialog({ open, onOpenChange, onImport }: NmapImportDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<NmapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPorts, setSelectedPorts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    setParseResult(null);
    
    if (!file.name.endsWith('.xml')) {
      setError('Please select an Nmap XML file (.xml)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseNmapXML(content);
        
        if (result.hosts.length === 0) {
          setError('No hosts with open ports found in the scan result');
          return;
        }
        
        setParseResult(result);
        // Select all ports by default
        const allPorts = new Set<string>();
        result.hosts.forEach(host => {
          host.ports.forEach(port => {
            allPorts.add(`${host.ip}:${port.port}`);
          });
        });
        setSelectedPorts(allPorts);
      } catch (err) {
        setError('Failed to parse Nmap XML file. Make sure it\'s a valid Nmap XML output.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const togglePort = (portKey: string) => {
    setSelectedPorts(prev => {
      const next = new Set(prev);
      if (next.has(portKey)) {
        next.delete(portKey);
      } else {
        next.add(portKey);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!parseResult) return;
    const allPorts = new Set<string>();
    parseResult.hosts.forEach(host => {
      host.ports.forEach(port => {
        allPorts.add(`${host.ip}:${port.port}`);
      });
    });
    setSelectedPorts(allPorts);
  };

  const selectNone = () => {
    setSelectedPorts(new Set());
  };

  const handleImport = () => {
    if (!parseResult) return;

    const tasks = nmapResultToTasks(parseResult).filter((_, index) => {
      let portIndex = 0;
      for (const host of parseResult.hosts) {
        for (const port of host.ports) {
          if (portIndex === index) {
            return selectedPorts.has(`${host.ip}:${port.port}`);
          }
          portIndex++;
        }
      }
      return false;
    });

    onImport(tasks);
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setParseResult(null);
    setError(null);
    setSelectedPorts(new Set());
  };

  const totalPorts = parseResult?.hosts.reduce((acc, host) => acc + host.ports.length, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetState(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-neon-cyan" />
            Import Nmap Results
          </DialogTitle>
          <DialogDescription>
            Import Nmap XML scan results to automatically create TODO items for discovered services.
          </DialogDescription>
        </DialogHeader>

        {!parseResult ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }
            `}
          >
            <FileUp className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium mb-1">
              Drag & drop Nmap XML file here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse (supports .xml files)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Found {parseResult.hosts.length} host(s) with {totalPorts} open port(s)
                </span>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-primary hover:underline">
                    Select All
                  </button>
                  <button onClick={selectNone} className="text-xs text-muted-foreground hover:underline">
                    Select None
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPorts.size} port(s) selected for import
              </p>
            </div>

            {/* Port list */}
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-3">
                {parseResult.hosts.map((host) => (
                  <div key={host.ip} className="space-y-1">
                    <div className="text-xs font-semibold text-primary px-2">
                      {host.ip}{host.hostname ? ` (${host.hostname})` : ''}
                    </div>
                    {host.ports.map((port) => {
                      const portKey = `${host.ip}:${port.port}`;
                      const isSelected = selectedPorts.has(portKey);
                      return (
                        <div
                          key={portKey}
                          onClick={() => togglePort(portKey)}
                          className={`
                            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
                            ${isSelected ? 'bg-primary/20' : 'hover:bg-muted/50'}
                          `}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="text-sm font-mono">
                            Port {port.port}
                          </span>
                          <span className="text-xs text-muted-foreground">–</span>
                          <span className="text-sm">
                            {port.service.toUpperCase()}
                          </span>
                          {port.product && (
                            <span className="text-xs text-muted-foreground">
                              ({port.product}{port.version ? ` ${port.version}` : ''})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between">
              <button 
                onClick={resetState} 
                className="ctf-button"
              >
                <FileText className="w-4 h-4 mr-1" />
                Choose Different File
              </button>
              <button 
                onClick={handleImport}
                disabled={selectedPorts.size === 0}
                className="ctf-button-primary disabled:opacity-50"
              >
                <Check className="w-4 h-4 mr-1" />
                Import {selectedPorts.size} Task(s)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
