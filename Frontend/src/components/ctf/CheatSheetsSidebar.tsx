import { useState, useRef } from "react";
import {
  Plus,
  FileText,
  GripVertical,
  ChevronDown,
  Database,
  Download,
  Upload,
  RotateCcw,
  CloudUpload,
  CloudDownload,
  FolderOpen,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  exportCheatSheetsDatabaseToFile,
  importCheatSheetsDatabaseFromFile,
  mergeCheatSheetsDatabaseFromFile,
  resetCheatSheetsDatabaseToDefaults,
  reloadCheatSheetsDatabase,
  saveCheatSheetsDatabaseToServer,
  loadCheatSheetsDatabaseFromServer,
} from "@/data/cheatsheets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeManagement } from "./TimeManagement";

export interface CheatSheetData {
  id: string;
  name: string;
  color: string;
  content?: string;
}

interface CheatSheetsSidebarProps {
  cheatSheets: CheatSheetData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onImportAll: () => void;
  onReorder?: (sheets: CheatSheetData[]) => void;
  onUpdateColor?: (id: string, color: string) => void;
  onRefresh?: () => void;
}

const defaultColors = ["#00d4aa", "#00bcd4", "#4dd0e1", "#26c6da", "#00acc1", "#00e5ff", "#1de9b6", "#64ffda"];

export function CheatSheetsSidebar({
  cheatSheets,
  selectedId,
  onSelect,
  onAdd,
  onImportAll,
  onReorder,
  onUpdateColor,
  onRefresh,
}: CheatSheetsSidebarProps) {
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [filePathConfirm, setFilePathConfirm] = useState<{
    open: boolean;
    action: "export" | "import" | "merge";
  }>({ open: false, action: "export" });

  // Database file input refs
  const importFileRef = useRef<HTMLInputElement>(null);
  const mergeFileRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (id: string, color: string) => {
    onUpdateColor?.(id, color);
    setEditingColorId(null);
  };

  // Database handlers - FIXED: Always reload cache before refreshing UI
  const handleExportDatabase = () => {
    setFilePathConfirm({ open: true, action: "export" });
  };
  const handleImportDatabaseClick = () => {
    setFilePathConfirm({ open: true, action: "import" });
  };
  const handleMergeDatabaseClick = () => {
    setFilePathConfirm({ open: true, action: "merge" });
  };

  const doExportDatabase = () => {
    reloadCheatSheetsDatabase();
    exportCheatSheetsDatabaseToFile();
    toast.success("Cheat sheets database exported");
  };
  const doImportDatabaseClick = () => importFileRef.current?.click();
  const doMergeDatabaseClick = () => mergeFileRef.current?.click();

  const handleImportDatabaseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importCheatSheetsDatabaseFromFile(file);
    if (result.success) {
      toast.success(`Imported ${result.count} cheat sheets`);
      // Force reload cache then refresh UI
      reloadCheatSheetsDatabase();
      if (onRefresh) onRefresh();
      else window.location.reload();
    } else {
      toast.error(result.error || "Import failed");
    }
    e.target.value = "";
  };

  const handleMergeDatabaseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await mergeCheatSheetsDatabaseFromFile(file);
    if (result.success) {
      toast.success(`Added ${result.added} new cheat sheets, skipped ${result.skipped}`);
      // Force reload cache then refresh UI
      reloadCheatSheetsDatabase();
      if (onRefresh) onRefresh();
      else window.location.reload();
    } else {
      toast.error("Merge failed");
    }
    e.target.value = "";
  };

  const handleResetDatabase = () => {
    if (confirm("Reset cheat sheets database to defaults? This will remove all custom cheat sheets.")) {
      resetCheatSheetsDatabaseToDefaults();
      toast.success("Database reset to defaults");
      // Force reload cache then refresh UI
      reloadCheatSheetsDatabase();
      if (onRefresh) onRefresh();
      else window.location.reload();
    }
  };

  // Backend server handlers
  const handleSaveToServer = async () => {
    toast.loading("Saving to server...", { id: "save-cheatsheets" });
    const result = await saveCheatSheetsDatabaseToServer();
    if (result.success) {
      toast.success("Cheat sheets saved to server", { id: "save-cheatsheets" });
    } else {
      toast.error(`Failed to save: ${result.error}`, { id: "save-cheatsheets" });
    }
  };

  const handleLoadFromServer = async () => {
    toast.loading("Loading from server...", { id: "load-cheatsheets" });
    const result = await loadCheatSheetsDatabaseFromServer();
    if (result.success) {
      toast.success(`Loaded ${result.count} cheat sheets from server`, { id: "load-cheatsheets" });
      reloadCheatSheetsDatabase();
      if (onRefresh) onRefresh();
      else window.location.reload();
    } else {
      toast.error(`Failed to load: ${result.error}`, { id: "load-cheatsheets" });
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) setDragOverId(id);
  };
  const handleDragLeave = () => setDragOverId(null);
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return (setDraggedId(null), setDragOverId(null));

    const draggedIndex = cheatSheets.findIndex((s) => s.id === draggedId);
    const targetIndex = cheatSheets.findIndex((s) => s.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSheets = [...cheatSheets];
    const [removed] = newSheets.splice(draggedIndex, 1);
    newSheets.splice(targetIndex, 0, removed);

    onReorder?.(newSheets);
    setDraggedId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="w-52 bg-sidebar border-r-2 border-r-[hsl(var(--panel-border))] flex flex-col h-full">
      {/* Hidden File Inputs for Database Operations */}
      <input type="file" ref={importFileRef} onChange={handleImportDatabaseFile} accept=".json" className="hidden" />
      <input type="file" ref={mergeFileRef} onChange={handleMergeDatabaseFile} accept=".json" className="hidden" />

      {/* Logo at the top */}
      <div className="p-3 flex justify-center border-b border-sidebar-border">
        <img src="/src/assets/ratel-deck-logo.png" alt="CTF Logo" className="max-w-[180px] drop-shadow-lg" />
      </div>

      {/* Top Section: Add / Database - Compact & Pro */}
      <div className="px-2 py-2 border-b border-sidebar-border">
        <div className="flex items-center justify-center mb-2">
          <h2 className="text-xs font-bold text-sidebar-foreground tracking-wide uppercase border-b-2 border-primary pb-1">
            Cheat-Sheets
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onAdd}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>

          {/* Database Dropdown - Matches CVE style */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-1 h-7 text-[10px]">
                <Database className="w-3 h-3" />
                Database
                <ChevronDown className="w-2.5 h-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={4}
              className="z-[9999] bg-popover border-border min-w-[160px]"
            >
              {/* Server Save/Load - Same cyan style as CVE */}
              <DropdownMenuItem onClick={handleSaveToServer} className="cursor-pointer text-xs text-primary">
                <CloudUpload className="w-3.5 h-3.5 mr-2" />
                Save to Server
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLoadFromServer} className="cursor-pointer text-xs text-primary">
                <CloudDownload className="w-3.5 h-3.5 mr-2" />
                Load from Server
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* File Operations */}
              <DropdownMenuItem onClick={handleExportDatabase} className="cursor-pointer text-xs">
                <Download className="w-3.5 h-3.5 mr-2" />
                Export to JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportDatabaseClick} className="cursor-pointer text-xs">
                <Upload className="w-3.5 h-3.5 mr-2" />
                Import (Replace All)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMergeDatabaseClick} className="cursor-pointer text-xs">
                <Plus className="w-3.5 h-3.5 mr-2" />
                Merge (Add New Only)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetDatabase} className="text-destructive cursor-pointer text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                Reset to Defaults
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CheatSheets List - Uniform size */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 max-h-[420px]">
        {cheatSheets.map((sheet) => (
          <div
            key={sheet.id}
            draggable
            onDragStart={(e) => handleDragStart(e, sheet.id)}
            onDragOver={(e) => handleDragOver(e, sheet.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, sheet.id)}
            onDragEnd={handleDragEnd}
            className={`relative group transition-all duration-200 ${draggedId === sheet.id ? "opacity-50" : ""} ${dragOverId === sheet.id ? "border-t-2 border-primary" : ""}`}
          >
            <div
              className={`flex items-center h-8 rounded transition-all duration-200 ${
                selectedId === sheet.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
              style={{
                backgroundColor: selectedId !== sheet.id ? sheet.color + "20" : undefined,
                borderLeft: `3px solid ${sheet.color}`,
              }}
            >
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing px-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Main button */}
              <button onClick={() => onSelect(sheet.id)} className="flex-1 flex items-center gap-1.5 px-1 py-1 min-w-0">
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate text-[11px] font-medium">{sheet.name}</span>
              </button>

              {/* Color picker dropdown - inline on the right */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingColorId(editingColorId === sheet.id ? null : sheet.id);
                  }}
                  className="flex items-center gap-0.5 px-1 py-1 rounded"
                  title="Change color"
                >
                  <div className="w-3 h-3 rounded-sm border border-white/30" style={{ backgroundColor: sheet.color }} />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>

                {/* Inline color picker dropdown */}
                {editingColorId === sheet.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md p-1.5 shadow-xl min-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-4 gap-1">
                      {defaultColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(sheet.id, color)}
                          className={`w-5 h-5 rounded-sm border transition-all hover:scale-110 ${
                            sheet.color === color ? "border-foreground ring-1 ring-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "color";
                        input.value = sheet.color;
                        input.onchange = (e) => handleColorChange(sheet.id, (e.target as HTMLInputElement).value);
                        input.click();
                      }}
                      className="w-full mt-1.5 text-[10px] py-0.5 px-1.5 bg-secondary hover:bg-accent rounded transition-colors"
                    >
                      Custom...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Management Section */}
      <div className="p-3 border-t border-sidebar-border">
        <TimeManagement />
      </div>

      {/* Bottom info */}
      <div className="p-2 border-t border-sidebar-border">
        <span className="text-xs text-muted-foreground">{cheatSheets.length} cheat sheets</span>
      </div>

      {/* File Path Confirm Dialog */}
      <AlertDialog
        open={filePathConfirm.open}
        onOpenChange={(open) => setFilePathConfirm({ ...filePathConfirm, open })}
      >
        <AlertDialogContent className="bg-card border-2 border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              <FolderOpen className="w-5 h-5" />
              File Path
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {filePathConfirm.action === "export"
                  ? "Place your JSON file in :"
                  : "Place your JSON file in :"}
              </p>
              <code className="block bg-muted px-3 py-2 rounded-md font-mono text-sm text-foreground border border-border">
                ~/Ratel_Deck/backend/your-file.json
              </code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (filePathConfirm.action === "export") {
                  doExportDatabase();
                } else if (filePathConfirm.action === "import") {
                  doImportDatabaseClick();
                } else if (filePathConfirm.action === "merge") {
                  doMergeDatabaseClick();
                }
                setFilePathConfirm({ open: false, action: "export" });
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
