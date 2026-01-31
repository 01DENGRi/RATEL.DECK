import { useState } from "react";
import { X, Copy, ExternalLink, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { Credential } from "@/types/ctf";

interface CommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "RDP" | "SSH";
  ip: string;
  credentials: Credential[];
}

export function CommandDialog({ isOpen, onClose, type, ip, credentials }: CommandDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCredId, setSelectedCredId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const selectedCred = credentials.find((c) => c.id === selectedCredId) || credentials[0];

  const generateCommand = (cred: Credential) => {
    if (type === "RDP") {
      return `xfreerdp3 /v:${ip} /u:${cred.username} /p:'${cred.password}' /dynamic-resolution`;
    }
    return `sshpass -p '${cred.password}' ssh ${cred.username}@${ip}`;
  };

  const handleCopy = (command: string, credId: string) => {
    navigator.clipboard.writeText(command);
    setCopied(credId);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-lg animate-slide-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary rounded-t-lg">
          <h3 className="text-sm font-semibold text-foreground">{type} Command Ready</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No credentials available for this target.</p>
          ) : credentials.length === 1 ? (
            // Single credential - simple view
            <>
              <p className="text-sm text-muted-foreground">
                Copy or Launch this command for <span className="text-primary">{selectedCred?.username}</span>:
              </p>

              <div className="bg-terminal-bg border border-terminal-border rounded p-3 font-mono text-sm text-primary break-all">
                {generateCommand(selectedCred)}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleCopy(generateCommand(selectedCred), selectedCred.id)}
                  className="ctf-button flex items-center gap-2"
                >
                  {copied === selectedCred.id ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied === selectedCred.id ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => {
                    toast.info("Launch functionality requires desktop app integration");
                  }}
                  className="ctf-button flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch
                </button>
              </div>
            </>
          ) : (
            // Multiple credentials - show dropdown and list
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select credential:</p>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full ctf-input flex items-center justify-between"
                  >
                    <span>
                      {selectedCred?.username || "Select credential"}
                      {selectedCred?.note && <span className="text-muted-foreground ml-2">({selectedCred.note})</span>}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                      {credentials.map((cred) => (
                        <button
                          key={cred.id}
                          onClick={() => {
                            setSelectedCredId(cred.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                            selectedCredId === cred.id ? "bg-primary/20" : ""
                          }`}
                        >
                          <span>{cred.username}</span>
                          {cred.note && <span className="text-xs text-muted-foreground">{cred.note}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-terminal-bg border border-terminal-border rounded p-3 font-mono text-sm text-primary break-all">
                {generateCommand(selectedCred)}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleCopy(generateCommand(selectedCred), selectedCred.id)}
                  className="ctf-button flex items-center gap-2"
                >
                  {copied === selectedCred.id ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied === selectedCred.id ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => {
                    toast.info("Launch functionality requires desktop app integration");
                  }}
                  className="ctf-button flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch
                </button>
              </div>

              {/* All credentials quick copy */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">All credentials quick copy:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {credentials.map((cred) => (
                    <div key={cred.id} className="flex items-center gap-2 bg-secondary/50 rounded p-2">
                      <div className="flex-1 text-xs">
                        <span className="text-primary">{cred.username}</span>
                        {cred.note && <span className="text-muted-foreground ml-1">• {cred.note}</span>}
                      </div>
                      <button
                        onClick={() => handleCopy(generateCommand(cred), cred.id)}
                        className="p-1 rounded hover:bg-accent transition-colors"
                      >
                        {copied === cred.id ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
