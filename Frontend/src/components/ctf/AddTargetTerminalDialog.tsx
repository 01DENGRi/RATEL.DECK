import { useState } from "react";
import { Layers, Server, Plug2, X } from "lucide-react";
import type { Target } from "@/types/ctf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddTargetTerminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: Target[];
  onCreateTerminal: (target: Target, listenerPort?: number) => void;
}

const DEFAULT_LISTENER_PORTS = [4444, 4445, 8080, 8443, 9001, 9002, 1337, 443, 80];

export function AddTargetTerminalDialog({
  open,
  onOpenChange,
  targets,
  onCreateTerminal,
}: AddTargetTerminalDialogProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [listenerPort, setListenerPort] = useState<string>("4444");
  const [customPort, setCustomPort] = useState<string>("");
  const [useCustomPort, setUseCustomPort] = useState(false);

  const selectedTarget = targets.find(t => t.id === selectedTargetId);

  const handleCreate = () => {
    if (!selectedTarget) return;
    
    const port = useCustomPort && customPort 
      ? parseInt(customPort, 10) 
      : parseInt(listenerPort, 10);
    
    onCreateTerminal(selectedTarget, port || undefined);
    onOpenChange(false);
    
    // Reset form
    setSelectedTargetId("");
    setListenerPort("4444");
    setCustomPort("");
    setUseCustomPort(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-amber-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <Layers className="w-5 h-5" />
            Add Target Terminal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Select Target Host
            </label>
            {targets.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-lg text-center">
                No targets available. Add targets to the table first.
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-lg p-1">
                {targets.map(target => (
                  <button
                    key={target.id}
                    onClick={() => setSelectedTargetId(target.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
                      selectedTargetId === target.id
                        ? "bg-amber-500/20 border border-amber-500/50"
                        : "hover:bg-secondary border border-transparent"
                    }`}
                  >
                    <Server className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{target.hostname}</div>
                      <div className="text-xs text-muted-foreground font-mono">{target.ip}</div>
                    </div>
                    {selectedTargetId === target.id && (
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Listener Port Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Plug2 className="w-3 h-3" />
              Listener Port (Agent-Handled)
            </label>
            <div className="text-[10px] text-muted-foreground mb-2">
              The listener is handled by the agent at ws://localhost:8787
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_LISTENER_PORTS.map(port => (
                <button
                  key={port}
                  onClick={() => {
                    setListenerPort(port.toString());
                    setUseCustomPort(false);
                  }}
                  className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                    !useCustomPort && listenerPort === port.toString()
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {port}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="customPort"
                checked={useCustomPort}
                onChange={(e) => setUseCustomPort(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="customPort" className="text-xs text-muted-foreground">
                Custom port:
              </label>
              <input
                type="number"
                value={customPort}
                onChange={(e) => {
                  setCustomPort(e.target.value);
                  setUseCustomPort(true);
                }}
                placeholder="e.g. 5555"
                className="ctf-input w-24 text-xs font-mono"
                min={1}
                max={65535}
              />
            </div>
          </div>

          {/* Preview */}
          {selectedTarget && (
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Preview</div>
              <div className="text-sm font-medium text-amber-400">
                {selectedTarget.hostname}:{useCustomPort ? customPort || "—" : listenerPort}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Target: {selectedTarget.ip} • Agent: ws://localhost:8787
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-xs rounded border border-border hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedTarget}
            className="px-3 py-1.5 text-xs rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3 h-3" />
            Create Terminal
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
