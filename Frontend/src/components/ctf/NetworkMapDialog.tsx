import { useState } from 'react';
import { X, Network, Server, Monitor, ArrowRight, Wifi, Shield, MapPin } from 'lucide-react';
import type { Target } from '@/types/ctf';

interface NetworkMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targets: Target[];
}

export function NetworkMapDialog({ isOpen, onClose, targets }: NetworkMapDialogProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate positions for nodes in a circular layout
  const centerX = 300;
  const centerY = 200;
  const radius = 150;
  
  const getNodePosition = (index: number, total: number) => {
    if (total === 0) return { x: centerX, y: centerY };
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const selectedTarget = targets.find(t => t.id === selectedNode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] animate-slide-in flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Network Map</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Network Graph */}
          <div className="flex-1 p-4 relative bg-terminal-bg">
            <svg className="w-full h-[400px]">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Attacker Node (center) */}
              <g>
                <circle cx={centerX} cy={centerY} r="30" fill="hsl(var(--destructive))" opacity="0.2" />
                <circle cx={centerX} cy={centerY} r="20" fill="hsl(var(--destructive))" />
                <text x={centerX} y={centerY + 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  KALI
                </text>
                <text x={centerX} y={centerY + 45} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9">
                  Attacker
                </text>
              </g>

              {/* Connections from attacker to targets */}
              {targets.map((target, index) => {
                const pos = getNodePosition(index, targets.length);
                return (
                  <g key={`line-${target.id}`}>
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={pos.x}
                      y2={pos.y}
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray={target.credentials?.length > 0 ? "none" : "4,4"}
                      opacity="0.5"
                    />
                    {/* Arrow */}
                    <circle
                      cx={pos.x - (pos.x - centerX) * 0.2}
                      cy={pos.y - (pos.y - centerY) * 0.2}
                      r="3"
                      fill="hsl(var(--primary))"
                    />
                  </g>
                );
              })}

              {/* Target Nodes */}
              {targets.map((target, index) => {
                const pos = getNodePosition(index, targets.length);
                const isSelected = selectedNode === target.id;
                const hasAccess = target.credentials?.length > 0;
                
                return (
                  <g
                    key={target.id}
                    onClick={() => setSelectedNode(isSelected ? null : target.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? "35" : "25"}
                      fill={hasAccess ? "hsl(var(--success))" : "hsl(var(--muted))"}
                      opacity={isSelected ? "0.3" : "0.2"}
                      className="transition-all"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="20"
                      fill={target.color || (hasAccess ? "hsl(var(--success))" : "hsl(var(--muted))")}
                      stroke={isSelected ? "hsl(var(--primary))" : "transparent"}
                      strokeWidth="2"
                    />
                    {/* OS Icon indicator */}
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                      {target.os === 'Windows' ? 'WIN' : target.os === 'Linux' ? 'LNX' : target.os === 'macOS' ? 'MAC' : '???'}
                    </text>
                    <text x={pos.x} y={pos.y + 40} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontWeight="500">
                      {target.hostname.length > 12 ? target.hostname.slice(0, 12) + '...' : target.hostname}
                    </text>
                    <text x={pos.x} y={pos.y + 52} textAnchor="middle" fill="hsl(var(--warning))" fontSize="8">
                      {target.ip}
                    </text>
                    
                    {/* Access indicator */}
                    {hasAccess && (
                      <g>
                        <circle cx={pos.x + 15} cy={pos.y - 15} r="6" fill="hsl(var(--success))" />
                        <text x={pos.x + 15} y={pos.y - 12} textAnchor="middle" fill="white" fontSize="8">✓</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(20, 20)">
                <rect x="0" y="0" width="120" height="80" fill="hsl(var(--card))" rx="4" opacity="0.9" />
                <text x="10" y="18" fill="hsl(var(--foreground))" fontSize="10" fontWeight="bold">Legend</text>
                <circle cx="20" cy="35" r="6" fill="hsl(var(--success))" />
                <text x="35" y="38" fill="hsl(var(--muted-foreground))" fontSize="9">Access gained</text>
                <circle cx="20" cy="55" r="6" fill="hsl(var(--muted))" />
                <text x="35" y="58" fill="hsl(var(--muted-foreground))" fontSize="9">No access yet</text>
                <line x1="10" y1="70" x2="30" y2="70" stroke="hsl(var(--primary))" strokeDasharray="4,4" />
                <text x="35" y="73" fill="hsl(var(--muted-foreground))" fontSize="9">Pending</text>
              </g>
            </svg>

            {targets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No targets added yet</p>
                  <p className="text-xs">Add targets to see the network map</p>
                </div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="w-64 border-l border-border p-4 bg-secondary/30 overflow-y-auto">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {selectedTarget ? 'Target Details' : 'Network Stats'}
            </h4>

            {selectedTarget ? (
              <div className="space-y-3">
                <div className="bg-card rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedTarget.os === 'Windows' ? <Monitor className="w-4 h-4 text-neon-cyan" /> : <Server className="w-4 h-4 text-neon-orange" />}
                    <span className="font-semibold">{selectedTarget.hostname}</span>
                  </div>
                  <div className="text-sm text-warning">{selectedTarget.ip}</div>
                  <div className="text-xs text-muted-foreground">{selectedTarget.os}</div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold mb-2 text-muted-foreground">CREDENTIALS</h5>
                  {selectedTarget.credentials?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTarget.credentials.map((cred, i) => (
                        <div key={cred.id} className="bg-card rounded p-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-success" />
                            <span>{cred.username}</span>
                          </div>
                          {cred.note && <div className="text-muted-foreground mt-1">{cred.note}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No credentials yet</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-card rounded p-3">
                  <div className="text-2xl font-bold text-primary">{targets.length}</div>
                  <div className="text-xs text-muted-foreground">Total Targets</div>
                </div>
                <div className="bg-card rounded p-3">
                  <div className="text-2xl font-bold text-success">
                    {targets.filter(t => t.credentials?.length > 0).length}
                  </div>
                  <div className="text-xs text-muted-foreground">With Access</div>
                </div>
                <div className="bg-card rounded p-3">
                  <div className="text-2xl font-bold text-warning">
                    {targets.reduce((acc, t) => acc + (t.credentials?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Credentials</div>
                </div>
                <div className="bg-card rounded p-3 space-y-1">
                  <div className="text-xs text-muted-foreground mb-1">OS Distribution</div>
                  {['Windows', 'Linux', 'macOS', 'Unknown'].map(os => {
                    const count = targets.filter(t => t.os === os).length;
                    if (count === 0) return null;
                    return (
                      <div key={os} className="flex justify-between text-xs">
                        <span>{os}</span>
                        <span className="font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
