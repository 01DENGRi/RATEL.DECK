import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Search,
  FolderOpen,
  Settings2,
  User,
  Key,
  Monitor,
  ChevronDown,
  ChevronUp,
  Terminal,
  Pencil,
  Trash2,
  Plus,
  Save,
  Shield,
  Variable,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import type { CheatSheetData, CheatCategory, CheatCommand } from "@/data/cheatsheets";
import { updateCheatSheet } from "@/data/cheatsheets";
import type { Target, Credential } from "@/types/ctf";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CheatSheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cheatSheet: CheatSheetData | null;
  onImport: (id: string, data: CheatSheetData) => void;
  onUpdate?: (id: string, data: CheatSheetData) => void;
  targets?: Target[];
  onSendToTerminal?: (command: string) => void;
}

interface SelectedVariables {
  host: Target | null;
  credential: Credential | null;
}

interface CustomVariable {
  id: string;
  name: string;
  value: string;
}

interface EditingCommand {
  categoryIndex: number;
  commandIndex: number;
  title: string;
  command: string;
  description: string;
  opsec: string;
}

// Store OPSEC notes per command (keyed by cheatsheet-id:command-title)
const opsecStorage: Record<string, string> = {};

export function CheatSheetDialog({
  isOpen,
  onClose,
  cheatSheet,
  onImport,
  onUpdate,
  targets = [],
  onSendToTerminal,
}: CheatSheetDialogProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // All categories collapsed by default - empty set means all collapsed
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    // Initialize with all category names collapsed
    return new Set(cheatSheet?.categories.map((c) => c.name) || []);
  });
  const [showVariables, setShowVariables] = useState(false);
  const [selectedVars, setSelectedVars] = useState<SelectedVariables>({ host: null, credential: null });
  const [editingCommand, setEditingCommand] = useState<EditingCommand | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<number | null>(null);
  const [newCommand, setNewCommand] = useState({ title: "", command: "", description: "", opsec: "" });
  const [editingCategoryName, setEditingCategoryName] = useState<{ index: number; name: string } | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [expandedOpsec, setExpandedOpsec] = useState<Set<string>>(new Set());
  const [opsecNotes, setOpsecNotes] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("ctf-opsec-notes") || "{}");
    } catch {
      return {};
    }
  });
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ctf-custom-variables") || "[]");
    } catch {
      return [];
    }
  });
  const [addingVariable, setAddingVariable] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "command" | "category";
    catIdx: number;
    cmdIdx?: number;
  } | null>(null);

  if (!isOpen || !cheatSheet) return null;

  const saveOpsecNotes = (notes: Record<string, string>) => {
    setOpsecNotes(notes);
    localStorage.setItem("ctf-opsec-notes", JSON.stringify(notes));
  };

  const saveCustomVariables = (vars: CustomVariable[]) => {
    setCustomVariables(vars);
    localStorage.setItem("ctf-custom-variables", JSON.stringify(vars));
  };

  const getOpsecKey = (cmdTitle: string) => `${cheatSheet.id}:${cmdTitle}`;

  const injectVariables = (command: string): string => {
    let result = command;
    if (selectedVars.host) {
      result = result.replace(/\{HOST\}/gi, selectedVars.host.ip);
      result = result.replace(/\{IP\}/gi, selectedVars.host.ip);
      result = result.replace(/\{HOSTNAME\}/gi, selectedVars.host.hostname);

      // Inject tickets
      const firstTicket = selectedVars.host.tickets?.[0];
      if (firstTicket) {
        result = result.replace(/\{TICKET\}/gi, firstTicket.value);
        result = result.replace(/\{TICKET_TYPE\}/gi, firstTicket.type);
      }

      // Inject hashes
      const firstHash = selectedVars.host.hashes?.[0];
      if (firstHash) {
        result = result.replace(/\{HASH\}/gi, firstHash.value);
        result = result.replace(/\{HASH_TYPE\}/gi, firstHash.type);
      }
    }
    if (selectedVars.credential) {
      result = result.replace(/\{USERNAME\}/gi, selectedVars.credential.username);
      result = result.replace(/\{USER\}/gi, selectedVars.credential.username);
      result = result.replace(/\{PASSWORD\}/gi, selectedVars.credential.password);
      result = result.replace(/\{PASS\}/gi, selectedVars.credential.password);
    }

    // Inject custom variables
    customVariables.forEach((v) => {
      const regex = new RegExp(`\\{${v.name}\\}`, "gi");
      result = result.replace(regex, v.value);
    });

    return result;
  };

  const copyCommand = (command: string, title: string) => {
    const injectedCommand = injectVariables(command);
    navigator.clipboard.writeText(injectedCommand);
    setCopiedCommand(title);
    toast.success(`Copied: ${title}`);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const sendToTerminal = (command: string, title: string) => {
    const injectedCommand = injectVariables(command);
    if (onSendToTerminal) {
      onSendToTerminal(injectedCommand);
      toast.success(`Sent to terminal: ${title}`);
    } else {
      toast.error("Terminal not available");
    }
  };

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName); // Expand
      } else {
        next.add(categoryName); // Collapse
      }
      return next;
    });
  };

  // Expand All Categories
  const expandAllCategories = () => {
    setCollapsedCategories(new Set());
  };

  // Collapse All Categories
  const collapseAllCategories = () => {
    if (cheatSheet?.categories) {
      setCollapsedCategories(new Set(cheatSheet.categories.map((cat) => cat.name)));
    }
  };

  const toggleOpsec = (cmdKey: string) => {
    setExpandedOpsec((prev) => {
      const next = new Set(prev);
      if (next.has(cmdKey)) {
        next.delete(cmdKey);
      } else {
        next.add(cmdKey);
      }
      return next;
    });
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string) as CheatSheetData;
            if (data.categories && Array.isArray(data.categories)) {
              onImport(cheatSheet.id, { ...cheatSheet, categories: data.categories });
              toast.success("Cheat sheet imported successfully!");
            } else {
              toast.error("Invalid JSON format. Expected { categories: [...] }");
            }
          } catch {
            toast.error("Failed to parse JSON file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSelectHost = (target: Target) => {
    setSelectedVars((prev) => ({
      ...prev,
      host: target,
      credential: target.credentials?.[0] || null,
    }));
  };

  // Filter commands based on search
  const filteredCategories = cheatSheet.categories
    .map((category) => ({
      ...category,
      commands: category.commands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.commands.length > 0);

  const hasVariablesSelected = selectedVars.host || selectedVars.credential;

  // Edit functions - FIXED: Now persists to localStorage AND updates React state
  const saveCheatSheet = (updatedData: CheatSheetData) => {
    // CRITICAL: First persist to localStorage
    updateCheatSheet(updatedData);

    // Then update React state via callbacks
    if (onUpdate) {
      onUpdate(cheatSheet.id, updatedData);
    } else {
      onImport(cheatSheet.id, updatedData);
    }
  };

  const handleEditCommand = (categoryIndex: number, commandIndex: number, cmd: CheatCommand) => {
    setEditingCommand({
      categoryIndex,
      commandIndex,
      title: cmd.title,
      command: cmd.command,
      description: cmd.description || "",
      opsec: opsecNotes[getOpsecKey(cmd.title)] || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingCommand) return;
    const updatedCategories = [...cheatSheet.categories];
    updatedCategories[editingCommand.categoryIndex].commands[editingCommand.commandIndex] = {
      title: editingCommand.title,
      command: editingCommand.command,
      description: editingCommand.description || undefined,
    };
    saveCheatSheet({ ...cheatSheet, categories: updatedCategories });

    // Save OPSEC note
    if (editingCommand.opsec.trim()) {
      saveOpsecNotes({ ...opsecNotes, [getOpsecKey(editingCommand.title)]: editingCommand.opsec });
    }

    setEditingCommand(null);
    toast.success("Command updated!");
  };

  const handleDeleteCommand = (categoryIndex: number, commandIndex: number) => {
    const updatedCategories = [...cheatSheet.categories];
    updatedCategories[categoryIndex].commands.splice(commandIndex, 1);
    // Remove empty categories
    if (updatedCategories[categoryIndex].commands.length === 0) {
      updatedCategories.splice(categoryIndex, 1);
    }
    saveCheatSheet({ ...cheatSheet, categories: updatedCategories });
    setDeleteConfirm(null);
    toast.success("Command deleted!");
  };

  const handleAddCommand = (categoryIndex: number) => {
    if (!newCommand.title || !newCommand.command) {
      toast.error("Title and command are required");
      return;
    }
    const updatedCategories = [...cheatSheet.categories];
    updatedCategories[categoryIndex].commands.push({
      title: newCommand.title,
      command: newCommand.command,
      description: newCommand.description || undefined,
    });
    saveCheatSheet({ ...cheatSheet, categories: updatedCategories });

    // Save OPSEC note if provided
    if (newCommand.opsec.trim()) {
      saveOpsecNotes({ ...opsecNotes, [getOpsecKey(newCommand.title)]: newCommand.opsec });
    }

    setNewCommand({ title: "", command: "", description: "", opsec: "" });
    setAddingToCategory(null);
    toast.success("Command added!");
  };

  const handleSaveCategoryName = () => {
    if (!editingCategoryName || !editingCategoryName.name.trim()) return;
    const updatedCategories = [...cheatSheet.categories];
    updatedCategories[editingCategoryName.index].name = editingCategoryName.name;
    saveCheatSheet({ ...cheatSheet, categories: updatedCategories });
    setEditingCategoryName(null);
    toast.success("Category renamed!");
  };

  const handleDeleteCategory = (categoryIndex: number) => {
    const updatedCategories = [...cheatSheet.categories];
    updatedCategories.splice(categoryIndex, 1);
    saveCheatSheet({ ...cheatSheet, categories: updatedCategories });
    setDeleteConfirm(null);
    toast.success("Category deleted!");
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const updatedCategories = [...cheatSheet.categories, { name: newCategoryName, commands: [] }];
    saveCheatSheet({ ...cheatSheet, categories: updatedCategories });
    setNewCategoryName("");
    setAddingCategory(false);
    toast.success("Category added!");
  };

  const handleEditTitle = () => {
    setNewTitle(cheatSheet.name);
    setEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    saveCheatSheet({ ...cheatSheet, name: newTitle });
    setEditingTitle(false);
    toast.success("Cheat sheet renamed!");
  };

  const handleAddCustomVariable = () => {
    if (!newVarName.trim() || !newVarValue.trim()) {
      toast.error("Variable name and value are required");
      return;
    }
    const newVar: CustomVariable = {
      id: crypto.randomUUID(),
      name: newVarName.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      value: newVarValue,
    };
    saveCustomVariables([...customVariables, newVar]);
    setNewVarName("");
    setNewVarValue("");
    setAddingVariable(false);
    toast.success("Custom variable added!");
  };

  const handleDeleteVariable = (id: string) => {
    saveCustomVariables(customVariables.filter((v) => v.id !== id));
    toast.success("Variable deleted");
  };

  const updateOpsecNote = (cmdTitle: string, note: string) => {
    saveOpsecNotes({ ...opsecNotes, [getOpsecKey(cmdTitle)]: note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border-2 border-[hsl(var(--panel-border))] rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-in overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border"
          style={{ backgroundColor: cheatSheet.color + "20" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-8 rounded-full" style={{ backgroundColor: cheatSheet.color }} />
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="ctf-input text-lg font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                />
                <button onClick={handleSaveTitle} className="p-1 rounded hover:bg-accent">
                  <Save className="w-4 h-4 text-success" />
                </button>
                <button onClick={() => setEditingTitle(false)} className="p-1 rounded hover:bg-accent">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground">{cheatSheet.name}</h3>
                <button
                  onClick={handleEditTitle}
                  className="p-1 rounded hover:bg-accent transition-colors"
                  title="Edit title"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground hover:text-warning" />
                </button>
              </>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {cheatSheet.categories.reduce((acc, cat) => acc + cat.commands.length, 0)} commands
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Expand/Collapse All Button */}
            <button
              onClick={() => {
                // If all are collapsed (set size = total categories), expand all
                // Otherwise collapse all
                if (collapsedCategories.size === cheatSheet.categories.length) {
                  expandAllCategories();
                } else {
                  collapseAllCategories();
                }
              }}
              className="ctf-button flex items-center gap-1.5 text-sm"
              title={
                collapsedCategories.size === cheatSheet.categories.length
                  ? "Expand all categories"
                  : "Collapse all categories"
              }
            >
              <ChevronsUpDown className="w-4 h-4" />
              {collapsedCategories.size === cheatSheet.categories.length ? "Expand All" : "Collapse All"}
            </button>
            <button
              onClick={() => setShowVariables(!showVariables)}
              className={`ctf-button flex items-center gap-1.5 text-sm ${hasVariablesSelected || customVariables.length > 0 ? "border-primary text-primary" : ""}`}
            >
              <Settings2 className="w-4 h-4" />
              Variables
              {(hasVariablesSelected || customVariables.length > 0) && <Check className="w-3 h-3 text-success" />}
            </button>
            <button onClick={handleImportJSON} className="ctf-button flex items-center gap-1.5 text-sm">
              <FolderOpen className="w-4 h-4" />
              Import JSON
            </button>

            <button onClick={onClose} className="p-2 rounded hover:bg-accent transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Variables Panel */}
        {showVariables && (
          <div className="px-5 py-4 border-b border-border bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Dynamic Variables</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {"{HOST}"}, {"{USERNAME}"}, {"{PASSWORD}"}, {"{TICKET}"}, {"{HASH}"}, + custom
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Host Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  Select Host
                </label>
                <select
                  value={selectedVars.host?.id || ""}
                  onChange={(e) => {
                    const target = targets.find((t) => t.id === e.target.value);
                    if (target) handleSelectHost(target);
                    else setSelectedVars((prev) => ({ ...prev, host: null, credential: null }));
                  }}
                  className="ctf-select w-full text-sm"
                >
                  <option value="">-- Select Host --</option>
                  {targets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.hostname} ({target.ip})
                    </option>
                  ))}
                </select>
              </div>

              {/* Username/Credential Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Select Credential
                </label>
                <select
                  value={selectedVars.credential?.id || ""}
                  onChange={(e) => {
                    const cred = selectedVars.host?.credentials.find((c) => c.id === e.target.value);
                    setSelectedVars((prev) => ({ ...prev, credential: cred || null }));
                  }}
                  className="ctf-select w-full text-sm"
                  disabled={!selectedVars.host}
                >
                  <option value="">-- Select Credential --</option>
                  {selectedVars.host?.credentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.username} {cred.note ? `(${cred.note})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Current Values
                </label>
                <div className="bg-secondary/50 rounded px-3 py-2 text-xs font-mono space-y-0.5 max-h-[100px] overflow-y-auto">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{"{HOST}"}:</span>
                    <span className="text-primary">{selectedVars.host?.ip || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{"{USERNAME}"}:</span>
                    <span className="text-warning">{selectedVars.credential?.username || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{"{PASSWORD}"}:</span>
                    <span className="text-destructive">{selectedVars.credential?.password ? "••••••" : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{"{TICKET}"}:</span>
                    <span className="text-neon-cyan">
                      {selectedVars.host?.tickets?.[0]?.value?.slice(0, 20) || "—"}
                      {selectedVars.host?.tickets?.[0]?.value && selectedVars.host.tickets[0].value.length > 20
                        ? "..."
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{"{HASH}"}:</span>
                    <span className="text-success">
                      {selectedVars.host?.hashes?.[0]?.value?.slice(0, 20) || "—"}
                      {selectedVars.host?.hashes?.[0]?.value && selectedVars.host.hashes[0].value.length > 20
                        ? "..."
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Variables Section */}
            <div className="border-t border-border/50 pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Variable className="w-4 h-4 text-success" />
                  <span className="text-sm font-semibold">Custom Variables</span>
                </div>
                <button
                  onClick={() => setAddingVariable(!addingVariable)}
                  className="ctf-button text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Variable
                </button>
              </div>

              {addingVariable && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-secondary/30 rounded">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="VAR_NAME"
                    className="ctf-input text-xs w-32 font-mono uppercase"
                  />
                  <span className="text-muted-foreground">=</span>
                  <input
                    type="text"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    placeholder="value"
                    className="ctf-input text-xs flex-1"
                  />
                  <button onClick={handleAddCustomVariable} className="p-1 rounded hover:bg-accent">
                    <Save className="w-4 h-4 text-success" />
                  </button>
                  <button
                    onClick={() => {
                      setAddingVariable(false);
                      setNewVarName("");
                      setNewVarValue("");
                    }}
                    className="p-1 rounded hover:bg-accent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {customVariables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customVariables.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-1 bg-secondary/50 rounded px-2 py-1 text-xs font-mono"
                    >
                      <span className="text-success">{`{${v.name}}`}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-foreground max-w-[100px] truncate">{v.value}</span>
                      <button
                        onClick={() => handleDeleteVariable(v.id)}
                        className="p-0.5 rounded hover:bg-destructive/20 ml-1"
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {targets.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No hosts available. Add hosts in the Targets section first.
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-3 border-b border-border bg-secondary/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="ctf-input pl-10"
            />
          </div>
        </div>

        {/* Content - with improved scrolling */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {filteredCategories.length === 0 && searchQuery ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No commands found matching "{searchQuery}"</p>
            </div>
          ) : (
            <>
              {cheatSheet.categories.map((category, catIdx) => {
                const filteredCat = filteredCategories.find((c) => c.name === category.name);
                if (searchQuery && !filteredCat) return null;
                const displayCommands = searchQuery ? filteredCat?.commands : category.commands;

                return (
                  <div key={category.name} className="terminal-panel overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-secondary">
                      {editingCategoryName?.index === catIdx ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingCategoryName.name}
                            onChange={(e) => setEditingCategoryName({ ...editingCategoryName, name: e.target.value })}
                            className="ctf-input text-sm flex-1"
                            autoFocus
                          />
                          <button onClick={handleSaveCategoryName} className="p-1 rounded hover:bg-accent">
                            <Save className="w-4 h-4 text-success" />
                          </button>
                          <button onClick={() => setEditingCategoryName(null)} className="p-1 rounded hover:bg-accent">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => toggleCategory(category.name)} className="flex-1 text-left">
                            <span className="font-semibold text-foreground">{category.name}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-2">
                              {category.commands.length} cmd{category.commands.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => setAddingToCategory(catIdx)}
                              className="p-1 rounded hover:bg-accent transition-colors"
                              title="Add command"
                            >
                              <Plus className="w-4 h-4 text-success" />
                            </button>
                            <button
                              onClick={() => setEditingCategoryName({ index: catIdx, name: category.name })}
                              className="p-1 rounded hover:bg-accent transition-colors"
                              title="Rename category"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: "category", catIdx })}
                              className="p-1 rounded hover:bg-accent transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                            <button onClick={() => toggleCategory(category.name)}>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${collapsedCategories.has(category.name) ? "" : "rotate-180"}`}
                              />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Add Command Form */}
                    {addingToCategory === catIdx && (
                      <div className="p-4 bg-primary/5 border-b border-border space-y-2">
                        <input
                          type="text"
                          value={newCommand.title}
                          onChange={(e) => setNewCommand({ ...newCommand, title: e.target.value })}
                          placeholder="Command title"
                          className="ctf-input text-sm"
                          autoFocus
                        />
                        <textarea
                          value={newCommand.command}
                          onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                          placeholder="Command (e.g., nmap -sV {HOST})"
                          className="ctf-input text-sm font-mono min-h-[60px]"
                        />
                        <input
                          type="text"
                          value={newCommand.description}
                          onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="ctf-input text-sm"
                        />
                        <textarea
                          value={newCommand.opsec}
                          onChange={(e) => setNewCommand({ ...newCommand, opsec: e.target.value })}
                          placeholder="OPSEC notes (optional) - e.g., clean logs, avoid noisy flags..."
                          className="ctf-input text-sm min-h-[40px]"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddCommand(catIdx)} className="ctf-button text-sm">
                            <Plus className="w-4 h-4 mr-1" /> Add
                          </button>
                          <button
                            onClick={() => {
                              setAddingToCategory(null);
                              setNewCommand({ title: "", command: "", description: "", opsec: "" });
                            }}
                            className="ctf-button text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Commands - hidden when collapsed */}
                    <div className={`${collapsedCategories.has(category.name) ? "hidden" : "block"}`}>
                      <div className="divide-y divide-border/30">
                        {displayCommands?.map((cmd, cmdIdx) => {
                          const realCmdIdx = category.commands.findIndex(
                            (c) => c.title === cmd.title && c.command === cmd.command,
                          );
                          const isEditing =
                            editingCommand?.categoryIndex === catIdx && editingCommand?.commandIndex === realCmdIdx;
                          const opsecKey = getOpsecKey(cmd.title);

                          if (isEditing) {
                            return (
                              <div key={`${cmd.title}-${cmdIdx}`} className="p-4 bg-primary/5 space-y-2">
                                <input
                                  type="text"
                                  value={editingCommand.title}
                                  onChange={(e) => setEditingCommand({ ...editingCommand, title: e.target.value })}
                                  placeholder="Title"
                                  className="ctf-input text-sm"
                                />
                                <textarea
                                  value={editingCommand.command}
                                  onChange={(e) => setEditingCommand({ ...editingCommand, command: e.target.value })}
                                  placeholder="Command"
                                  className="ctf-input text-sm font-mono min-h-[60px]"
                                />
                                <input
                                  type="text"
                                  value={editingCommand.description}
                                  onChange={(e) =>
                                    setEditingCommand({ ...editingCommand, description: e.target.value })
                                  }
                                  placeholder="Description"
                                  className="ctf-input text-sm"
                                />
                                <textarea
                                  value={editingCommand.opsec}
                                  onChange={(e) => setEditingCommand({ ...editingCommand, opsec: e.target.value })}
                                  placeholder="OPSEC notes"
                                  className="ctf-input text-sm min-h-[40px]"
                                />
                                <div className="flex gap-2">
                                  <button onClick={handleSaveEdit} className="ctf-button text-sm">
                                    <Save className="w-4 h-4 mr-1" /> Save
                                  </button>
                                  <button onClick={() => setEditingCommand(null)} className="ctf-button text-sm">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <CommandRow
                              key={`${cmd.title}-${cmdIdx}`}
                              command={cmd}
                              isCopied={copiedCommand === cmd.title}
                              onCopy={() => copyCommand(cmd.command, cmd.title)}
                              onSendToTerminal={() => sendToTerminal(cmd.command, cmd.title)}
                              onEdit={() => handleEditCommand(catIdx, realCmdIdx, cmd)}
                              onDelete={() => setDeleteConfirm({ type: "command", catIdx, cmdIdx: realCmdIdx })}
                              accentColor={cheatSheet.color}
                              injectedCommand={injectVariables(cmd.command)}
                              hasVariables={!!hasVariablesSelected}
                              hasTerminal={!!onSendToTerminal}
                              opsecNote={opsecNotes[opsecKey] || ""}
                              onOpsecChange={(note) => updateOpsecNote(cmd.title, note)}
                              isOpsecExpanded={expandedOpsec.has(opsecKey)}
                              onToggleOpsec={() => toggleOpsec(opsecKey)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Category */}
              {addingCategory ? (
                <div className="terminal-panel p-4 space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="ctf-input text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddCategory} className="ctf-button text-sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Category
                    </button>
                    <button
                      onClick={() => {
                        setAddingCategory(false);
                        setNewCategoryName("");
                      }}
                      className="ctf-button text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCategory(true)}
                  className="ctf-button w-full flex items-center justify-center gap-2 py-3"
                >
                  <Plus className="w-4 h-4" /> Add New Category
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
          <p>
            💡 Variables: {"{HOST}"}, {"{USERNAME}"}, {"{PASSWORD}"}, {"{TICKET}"}, {"{HASH}"}, + custom | 🛡️ OPSEC
            notes per command
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-destructive">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="ctf-button text-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "command" && deleteConfirm.cmdIdx !== undefined) {
                    handleDeleteCommand(deleteConfirm.catIdx, deleteConfirm.cmdIdx);
                  } else if (deleteConfirm.type === "category") {
                    handleDeleteCategory(deleteConfirm.catIdx);
                  }
                }}
                className="px-4 py-2 rounded bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CommandRowProps {
  command: CheatCommand;
  isCopied: boolean;
  onCopy: () => void;
  onSendToTerminal: () => void;
  onEdit: () => void;
  onDelete: () => void;
  accentColor: string;
  injectedCommand: string;
  hasVariables: boolean;
  hasTerminal: boolean;
  opsecNote: string;
  onOpsecChange: (note: string) => void;
  isOpsecExpanded: boolean;
  onToggleOpsec: () => void;
}

function CommandRow({
  command,
  isCopied,
  onCopy,
  onSendToTerminal,
  onEdit,
  onDelete,
  accentColor,
  injectedCommand,
  hasVariables,
  hasTerminal,
  opsecNote,
  onOpsecChange,
  isOpsecExpanded,
  onToggleOpsec,
}: CommandRowProps) {
  const showPreview = hasVariables && injectedCommand !== command.command;
  const [localOpsec, setLocalOpsec] = useState(opsecNote);
  const [isEditingOpsec, setIsEditingOpsec] = useState(false);

  const handleSaveOpsec = () => {
    onOpsecChange(localOpsec);
    setIsEditingOpsec(false);
  };

  return (
    <div className="group px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm" style={{ color: accentColor }}>
              {command.title}
            </span>
            {command.description && <span className="text-xs text-muted-foreground">— {command.description}</span>}
          </div>
          <code className="block text-xs font-mono text-foreground/90 bg-terminal-bg px-3 py-2 rounded border border-terminal-border overflow-x-auto whitespace-pre">
            {command.command}
          </code>
          {showPreview && (
            <div className="mt-2">
              <span className="text-xs text-success mb-1 block">▶ With variables:</span>
              <code className="block text-xs font-mono text-success bg-success/10 px-3 py-2 rounded border border-success/30 overflow-x-auto whitespace-pre">
                {injectedCommand}
              </code>
            </div>
          )}

          {/* OPSEC Section - Collapsible */}
          <Collapsible open={isOpsecExpanded} onOpenChange={onToggleOpsec}>
            <CollapsibleTrigger className="flex items-center gap-1.5 mt-2 text-xs text-warning hover:text-warning/80 transition-colors">
              <Shield className="w-3 h-3" />
              <span>OPSEC Best Practices</span>
              {opsecNote && <span className="text-[10px] bg-warning/20 px-1 rounded">has notes</span>}
              {isOpsecExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-warning/5 border border-warning/20 rounded p-2">
                {isEditingOpsec ? (
                  <div className="space-y-2">
                    <textarea
                      value={localOpsec}
                      onChange={(e) => setLocalOpsec(e.target.value)}
                      placeholder="Add OPSEC notes... (e.g., clean logs, avoid noisy flags, use socks proxy)"
                      className="w-full bg-background/50 border border-border rounded p-2 text-xs min-h-[60px] resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveOpsec}
                        className="text-xs px-2 py-1 rounded bg-warning/20 text-warning hover:bg-warning/30"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingOpsec(false);
                          setLocalOpsec(opsecNote);
                        }}
                        className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setIsEditingOpsec(true)} className="cursor-pointer min-h-[30px]">
                    {opsecNote ? (
                      <p className="text-xs text-warning/80 whitespace-pre-wrap">{opsecNote}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Click to add OPSEC notes...</p>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 mt-1">
          <button onClick={onEdit} className="p-2 rounded hover:bg-accent transition-colors" title="Edit command">
            <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-warning" />
          </button>
          <button
            onClick={onCopy}
            className="p-2 rounded hover:bg-accent transition-colors"
            title={hasVariables ? "Copy with variables injected" : "Copy command"}
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            )}
          </button>
          {hasTerminal && (
            <button
              onClick={onSendToTerminal}
              className="p-2 rounded hover:bg-accent transition-colors"
              title="Send to terminal"
            >
              <Terminal className="w-4 h-4 text-muted-foreground group-hover:text-neon-cyan" />
            </button>
          )}
          <button onClick={onDelete} className="p-2 rounded hover:bg-accent transition-colors" title="Delete command">
            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
