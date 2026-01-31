import { useState } from "react";
import { Plus, Pencil, Trash2, Monitor, Terminal, AlertTriangle, FileText } from "lucide-react";

interface TargetActionsProps {
  hasSelection: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRDP: () => void;
  onSSH: () => void;
  onReport?: () => void;
}

export function TargetActions({ hasSelection, onAdd, onEdit, onDelete, onRDP, onSSH, onReport }: TargetActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  // Unified button style - all buttons use primary color scheme
  const buttonBase = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const primaryStyle = "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30 hover:border-primary";
  const destructiveStyle = "bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/20 hover:border-destructive";
  
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Report Button - No selection required */}
        <button
          onClick={onReport}
          className={`${buttonBase} ${primaryStyle}`}
        >
          <FileText className="w-3.5 h-3.5" />
          Report
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Add Button */}
        <button 
          onClick={onAdd} 
          className={`${buttonBase} ${primaryStyle}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
        
        {/* Edit Button */}
        <button
          onClick={onEdit}
          disabled={!hasSelection}
          className={`${buttonBase} ${primaryStyle}`}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        
        {/* RDP Button */}
        <button
          onClick={onRDP}
          disabled={!hasSelection}
          className={`${buttonBase} ${primaryStyle}`}
        >
          <Monitor className="w-3.5 h-3.5" />
          RDP
        </button>
        
        {/* SSH Button */}
        <button
          onClick={onSSH}
          disabled={!hasSelection}
          className={`${buttonBase} ${primaryStyle}`}
        >
          <Terminal className="w-3.5 h-3.5" />
          SSH
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />
        
        {/* Delete Button - Destructive style */}
        <button
          onClick={handleDeleteClick}
          disabled={!hasSelection}
          className={`${buttonBase} ${destructiveStyle}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-lg shadow-xl p-5 max-w-sm animate-slide-in">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-full bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Delete Target</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to delete this target? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className={`${buttonBase} bg-secondary border-border text-secondary-foreground hover:bg-accent`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`${buttonBase} ${destructiveStyle}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
