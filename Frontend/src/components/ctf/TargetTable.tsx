import React, { useState } from "react";
import {
  Monitor,
  Server,
  Apple,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  User,
  Key,
  Settings2,
  Hash,
  Plus,
  Minus,
  Layers,
} from "lucide-react";
import type { Target, OSType } from "@/types/ctf";
import { toast } from "sonner";

interface TargetTableProps {
  targets: Target[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRDP?: (target: Target) => void;
  onSSH?: (target: Target) => void;
  onTargetTerminal?: (target: Target) => void;
  onReport?: (target: Target) => void;
}

const defaultOsIcons: Record<string, React.ReactNode> = {
  Windows: <Monitor className="w-3 h-3" />,
  Linux: <Server className="w-3 h-3" />,
  macOS: <Apple className="w-3 h-3" />,
  Unknown: <HelpCircle className="w-3 h-3" />,
};

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16];
const DEFAULT_FONT_INDEX = 2; // 10px

export function TargetTable({ targets, selectedId, onSelect, onRDP, onSSH, onTargetTerminal, onReport }: TargetTableProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());
  const [fontSizeIndex, setFontSizeIndex] = useState(DEFAULT_FONT_INDEX);

  const fontSize = FONT_SIZES[fontSizeIndex];
  const headerFontSize = fontSize;
  const bodyFontSize = fontSize;
  const smallFontSize = Math.max(fontSize - 1, 7);

  const increaseFontSize = () => {
    setFontSizeIndex((prev) => Math.min(prev + 1, FONT_SIZES.length - 1));
  };

  const decreaseFontSize = () => {
    setFontSizeIndex((prev) => Math.max(prev - 1, 0));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(value, field);
      }}
      className="ml-1 p-0.5 rounded hover:bg-accent/50 transition-colors opacity-0 group-hover:opacity-100"
    >
      {copiedField === field ? (
        <Check className="w-2.5 h-2.5 text-success" />
      ) : (
        <Copy className="w-2.5 h-2.5 text-muted-foreground" />
      )}
    </button>
  );

  const getOsIcon = (target: Target) => {
    const icon = defaultOsIcons[target.os] || <Settings2 className="w-3 h-3" />;
    const color =
      target.colors?.os || (target.os === "Windows" ? "#00d4aa" : target.os === "Linux" ? "#ff6b6b" : "#888");
    return <span style={{ color }}>{icon}</span>;
  };

  return (
    <div 
      className="terminal-panel flex flex-col relative group/resize"
      style={{ 
        height: '140px',
        minHeight: '100px',
        maxHeight: '600px',
        resize: 'vertical',
        overflow: 'hidden'
      }}
    >
      {/* Font size controls */}
      <div className="flex items-center justify-end gap-1 px-2 py-1 bg-secondary/50 border-b border-border shrink-0">
        <span className="text-[10px] text-muted-foreground mr-1">Font:</span>
        <button
          onClick={decreaseFontSize}
          disabled={fontSizeIndex === 0}
          className="p-0.5 rounded hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-[10px] text-muted-foreground min-w-[24px] text-center">{fontSize}px</span>
        <button
          onClick={increaseFontSize}
          disabled={fontSizeIndex === FONT_SIZES.length - 1}
          className="p-0.5 rounded hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <table className="w-full table-fixed" style={{ fontSize: `${bodyFontSize}px` }}>
          <thead className="sticky top-0 z-10 bg-secondary">
            <tr className="table-header">
              <th className="table-cell text-left py-1 px-1 w-[3%]" style={{ fontSize: `${headerFontSize}px` }}></th>
              <th className="table-cell text-left py-1 px-2 w-[12%]" style={{ fontSize: `${headerFontSize}px` }}>
                OS
              </th>
              <th className="table-cell text-left py-1 px-2 w-[15%]" style={{ fontSize: `${headerFontSize}px` }}>
                Hostname
              </th>
              <th className="table-cell text-left py-1 px-2 w-[13%]" style={{ fontSize: `${headerFontSize}px` }}>
                IP
              </th>
              <th className="table-cell text-left py-1 px-2 w-[22%]" style={{ fontSize: `${headerFontSize}px` }}>
                Credentials
              </th>
              <th className="table-cell text-left py-1 px-2 w-[18%]" style={{ fontSize: `${headerFontSize}px` }}>
                Hashes
              </th>
              <th className="table-cell text-left py-1 px-2 w-[12%]" style={{ fontSize: `${headerFontSize}px` }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {targets.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell text-center text-muted-foreground py-6 text-xs">
                  No targets added yet. Click "Add" to add your first target.
                </td>
              </tr>
            ) : (
              targets.map((target) => {
                const isExpanded = expandedTargets.has(target.id);
                const hasMultipleCreds = target.credentials?.length > 1;
                const hasMultipleHashes = (target.hashes?.length || 0) > 1;
                const firstCred = target.credentials?.[0];
                const firstHash = target.hashes?.[0];
                const hasExpandableContent = hasMultipleCreds || hasMultipleHashes;

                return (
                  <React.Fragment key={target.id}>
                    <tr
                      key={target.id}
                      onClick={() => onSelect(target.id)}
                      className={`table-row cursor-pointer group ${
                        selectedId === target.id ? "bg-primary/20 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <td className="py-1 px-1">
                        {hasExpandableContent && (
                          <button
                            onClick={(e) => toggleExpand(target.id, e)}
                            className="p-0.5 rounded hover:bg-accent transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-2.5 h-2.5" />
                            ) : (
                              <ChevronRight className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex items-center gap-1">
                          {getOsIcon(target)}
                          <span style={{ color: target.colors?.os }}>{target.customOs || target.os}</span>
                        </div>
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex items-center">
                          <span className="truncate" style={{ color: target.colors?.hostname || "#00d4aa" }}>
                            {target.hostname}
                          </span>
                          <CopyButton value={target.hostname} field={`hostname-${target.id}`} />
                        </div>
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex items-center">
                          <span className="font-mono" style={{ color: target.colors?.ip || "#f59e0b" }}>
                            {target.ip}
                          </span>
                          <CopyButton value={target.ip} field={`ip-${target.id}`} />
                        </div>
                      </td>
                      <td className="py-1 px-2">
                        {!target.credentials || target.credentials.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div
                            className="flex items-center gap-1.5"
                            style={{ color: target.colors?.credentials || "#8b5cf6" }}
                          >
                            <div className="flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" />
                              <span>{firstCred?.username || "—"}</span>
                              {firstCred?.username && (
                                <CopyButton value={firstCred.username} field={`user-${target.id}-${firstCred.id}`} />
                              )}
                            </div>
                            <span className="text-muted-foreground">/</span>
                            <div className="flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5" />
                              <span>{firstCred?.password ? "••••" : "—"}</span>
                              {firstCred?.password && (
                                <CopyButton value={firstCred.password} field={`pass-${target.id}-${firstCred.id}`} />
                              )}
                            </div>
                            {hasMultipleCreds && (
                              <span
                                className="text-muted-foreground bg-secondary px-1 py-0.5 rounded"
                                style={{ fontSize: `${smallFontSize}px` }}
                              >
                                +{target.credentials.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {!target.hashes || target.hashes.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: target.colors?.hashes || "#06b6d4" }}
                          >
                            <Hash className="w-2.5 h-2.5" />
                            <span>{firstHash?.type}</span>
                            {firstHash?.value && (
                              <CopyButton value={firstHash.value} field={`hash-${target.id}-${firstHash.id}`} />
                            )}
                            {hasMultipleHashes && (
                              <span
                                className="text-muted-foreground bg-secondary px-1 py-0.5 rounded"
                                style={{ fontSize: `${smallFontSize}px` }}
                              >
                                +{target.hashes.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Row Actions - Only Target Terminal */}
                      <td className="py-1 px-2">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                               onSelect(target.id);
                              onTargetTerminal?.(target);
                            }}
                             className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-all text-destructive border border-destructive/30 hover:border-destructive/50"
                            title="Open Target Terminal"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded details */}
                    {isExpanded && hasExpandableContent && (
                      <>
                        {/* Expanded credentials */}
                        {hasMultipleCreds &&
                          target.credentials.map((cred, index) => (
                            <tr
                              key={`${target.id}-cred-${cred.id}`}
                              className="bg-secondary/30 border-l-2 border-l-border group"
                            >
                              <td className="py-1 px-1"></td>
                              <td className="py-1 px-2" colSpan={2}>
                                <div className="flex items-center gap-1 pl-2">
                                  <span className="text-muted-foreground" style={{ fontSize: `${smallFontSize}px` }}>
                                    Cred #{index + 1}
                                  </span>
                                  {cred.note && (
                                    <span
                                      className="text-primary/70 bg-primary/10 px-1 py-0.5 rounded"
                                      style={{ fontSize: `${smallFontSize}px` }}
                                    >
                                      {cred.note}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-1 px-2" colSpan={3}>
                                <div
                                  className="flex items-center gap-3"
                                  style={{ color: target.colors?.credentials || "#8b5cf6" }}
                                >
                                  <div className="flex items-center gap-0.5">
                                    <User className="w-2.5 h-2.5" />
                                    <span>{cred.username || "—"}</span>
                                    {cred.username && (
                                      <CopyButton value={cred.username} field={`user-${target.id}-${cred.id}`} />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <Key className="w-2.5 h-2.5" />
                                    <span>{cred.password ? "••••" : "—"}</span>
                                    {cred.password && (
                                      <CopyButton value={cred.password} field={`pass-${target.id}-${cred.id}`} />
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {/* Expanded hashes */}
                        {hasMultipleHashes &&
                          target.hashes?.map((hash, index) => (
                            <tr
                              key={`${target.id}-hash-${hash.id}`}
                              className="bg-secondary/30 border-l-2 border-l-cyan-500/50 group"
                            >
                              <td className="py-1 px-1"></td>
                              <td className="py-1 px-2" colSpan={2}>
                                <div className="flex items-center gap-1 pl-2">
                                  <Hash className="w-2.5 h-2.5" style={{ color: target.colors?.hashes || "#06b6d4" }} />
                                  <span className="text-muted-foreground" style={{ fontSize: `${smallFontSize}px` }}>
                                    Hash #{index + 1}
                                  </span>
                                  <span
                                    className="px-1 py-0.5 rounded"
                                    style={{
                                      fontSize: `${smallFontSize}px`,
                                      backgroundColor: "rgba(6, 182, 212, 0.2)",
                                      color: target.colors?.hashes || "#06b6d4",
                                    }}
                                  >
                                    {hash.type}
                                  </span>
                                </div>
                              </td>
                              <td className="py-1 px-2" colSpan={3}>
                                <div
                                  className="flex items-center gap-2"
                                  style={{ color: target.colors?.hashes || "#06b6d4" }}
                                >
                                  <span className="font-mono truncate max-w-[200px]">{hash.value}</span>
                                  <CopyButton value={hash.value} field={`hash-${target.id}-${hash.id}`} />
                                  {hash.note && (
                                    <span className="text-muted-foreground" style={{ fontSize: `${smallFontSize}px` }}>
                                      ({hash.note})
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
