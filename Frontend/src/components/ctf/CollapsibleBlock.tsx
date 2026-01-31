import { useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2, GripVertical } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Default height for 11 lines of terminal output (~264px content + header)
const DEFAULT_BLOCK_HEIGHT = 300;
const MIN_BLOCK_HEIGHT = 150;

interface CollapsibleBlockProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  headerClassName?: string;
  contentClassName?: string;
  resizable?: boolean;
  accentColor?: "cyan" | "amber" | "red" | "default";
  headerActions?: ReactNode;
  // Drag & drop props
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragLeave?: () => void;
  onDrop?: (id: string) => void;
  onDragEnd?: () => void;
  draggable?: boolean;
}

export function CollapsibleBlock({
  id,
  title,
  icon,
  children,
  defaultOpen = false,
  isOpen: externalIsOpen,
  onOpenChange,
  isMaximized = false,
  onToggleMaximize,
  headerClassName = "",
  contentClassName = "",
  resizable = false,
  accentColor = "default",
  headerActions,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggable = true,
}: CollapsibleBlockProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [height, setHeight] = useState(DEFAULT_BLOCK_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalOpen;
  
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  // Sync internal state with external when it changes
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = height;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(MIN_BLOCK_HEIGHT, startHeight + deltaY);
      setHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [height]);

  const accentStyles = {
    cyan: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/10",
      headerBg: "bg-cyan-950/30",
      text: "text-cyan-400",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "bg-amber-950/10",
      headerBg: "bg-amber-950/30",
      text: "text-amber-400",
    },
    red: {
      border: "border-red-500/30",
      bg: "bg-red-950/10",
      headerBg: "bg-red-950/30",
      text: "text-red-400",
    },
    default: {
      border: "border-border",
      bg: "bg-background",
      headerBg: "bg-secondary/50",
      text: "text-foreground",
    },
  };

  const accent = accentStyles[accentColor];

  // Unified rendering - same DOM structure for both maximized and normal states
  // This prevents children from remounting and losing their state (e.g., terminal connections)
  const containerClasses = isMaximized
    ? `fixed inset-4 z-50 flex flex-col border ${accent.border} rounded-lg overflow-hidden ${accent.bg}`
    : `relative border ${accent.border} rounded-lg overflow-hidden ${accent.bg} flex flex-col transition-all duration-300 ease-in-out`;

  const containerStyle = !isMaximized && isOpen && resizable ? { height: `${height}px` } : undefined;

  // When maximized, always show as open
  const effectiveIsOpen = isMaximized ? true : isOpen;

  return (
    <div
      ref={containerRef}
      draggable={draggable && !isResizing && !isMaximized}
      onDragStart={(e) => {
        if (isResizing || isMaximized) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(id);
      }}
      onDragOver={(e) => onDragOver?.(e, id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(id);
      }}
      onDragEnd={onDragEnd}
      className={`transition-all duration-200 ${isDragging ? "opacity-50" : ""} ${isDragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      {/* Backdrop for maximized state */}
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onToggleMaximize}
        />
      )}
      
      <Collapsible open={effectiveIsOpen} onOpenChange={isMaximized ? undefined : handleOpenChange}>
        <div 
          className={containerClasses}
          style={containerStyle}
        >
          <div className={`flex items-center justify-between px-3 py-2 ${accent.headerBg} ${headerClassName} ${isMaximized ? `border-b ${accent.border}` : ''}`}>
            {/* Drag handle - hidden when maximized */}
            {draggable && !isMaximized && (
              <div className="cursor-grab active:cursor-grabbing px-1 opacity-40 hover:opacity-100 transition-opacity mr-1">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            
            {isMaximized ? (
              // Maximized header - no collapsible trigger
              <div className="flex items-center gap-2 flex-1">
                {icon && <span className={accent.text}>{icon}</span>}
                <span className={`text-xs font-bold tracking-wide uppercase ${accent.text}`}>
                  {title}
                </span>
              </div>
            ) : (
              // Normal header with collapsible trigger
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 flex-1 text-left">
                  {isOpen ? (
                    <ChevronDown className={`w-4 h-4 ${accent.text}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${accent.text}`} />
                  )}
                  {icon && <span className={accent.text}>{icon}</span>}
                  <span className={`text-xs font-bold tracking-wide uppercase ${accent.text}`}>
                    {title}
                  </span>
                </button>
              </CollapsibleTrigger>
            )}
            
            <div className="flex items-center gap-1">
              {headerActions}
              {onToggleMaximize && effectiveIsOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMaximize();
                  }}
                  className="p-1.5 rounded hover:bg-accent transition-colors"
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          
          <CollapsibleContent className="flex-1 min-h-0 overflow-hidden">
            <div className={`h-full overflow-auto ${contentClassName}`}>
              {children}
            </div>
          </CollapsibleContent>
          
          {/* Resize handle - hidden when maximized */}
          {effectiveIsOpen && resizable && !isMaximized && (
            <div
              onMouseDown={handleMouseDown}
              className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 transition-opacity ${isResizing ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className={`w-3 h-3 border-r-2 border-b-2 ${accent.border}`} />
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
