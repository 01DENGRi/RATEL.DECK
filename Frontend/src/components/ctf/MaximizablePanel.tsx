import { ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MaximizablePanelProps {
  title: string;
  icon: ReactNode;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  children: ReactNode;
  headerColor?: string;
  headerActions?: ReactNode;
  className?: string;
}

export function MaximizablePanel({
  title,
  icon,
  isMaximized,
  onToggleMaximize,
  children,
  headerColor,
  headerActions,
  className = '',
}: MaximizablePanelProps) {
  return (
    <div 
      className={`terminal-panel flex flex-col ${
        isMaximized 
          ? 'fixed inset-4 z-50 shadow-2xl' 
          : 'h-full'
      } ${className}`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-border"
        style={{ backgroundColor: headerColor ? `${headerColor}20` : undefined }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          <button
            onClick={onToggleMaximize}
            className="p-1 rounded hover:bg-accent transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Backdrop for maximized state */}
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={onToggleMaximize}
        />
      )}
    </div>
  );
}