import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Terminal as TerminalIcon, Layers, FileText } from "lucide-react";
import { Header } from "@/components/ctf/Header";
import { CheatSheetsSidebar } from "@/components/ctf/CheatSheetsSidebar";
import { TargetTable } from "@/components/ctf/TargetTable";
import { TargetActions } from "@/components/ctf/TargetActions";
import { TodoList } from "@/components/ctf/TodoList";
import { NotesPanel } from "@/components/ctf/NotesPanel";
import { TargetDialog } from "@/components/ctf/TargetDialog";
import { CommandDialog } from "@/components/ctf/CommandDialog";
import { CheatSheetDialog } from "@/components/ctf/CheatSheetDialog";
import { AddCheatDialog } from "@/components/ctf/AddCheatDialog";
import { NetworkMapDialog } from "@/components/ctf/NetworkMapDialog";
import { SplitTerminal, SplitTerminalRef } from "@/components/ctf/SplitTerminal";
import { TargetTerminalManager } from "@/components/ctf/TargetTerminalManager";
import { AddTargetTerminalDialog } from "@/components/ctf/AddTargetTerminalDialog";
import { CollapsibleBlock } from "@/components/ctf/CollapsibleBlock";
import { WelcomeMessage } from "@/components/ctf/WelcomeMessage";
import { OpenVPNDialog } from "@/components/ctf/OpenVPNDialog";
import { CVECheckerDialog } from "@/components/ctf/CVECheckerDialog";
import { TunnelingDialog } from "@/components/ctf/TunnelingDialog";
import { NmapImportDialog } from "@/components/ctf/NmapImportDialog";
import { HTTPServerDialog } from "@/components/ctf/HTTPServerDialog";
import { ProfileManagerDialog } from "@/components/ctf/ProfileManagerDialog";
import { useProfiles } from "@/hooks/useProfiles";
import { useDraggableBlocks } from "@/hooks/useDraggableBlocks";
import type { Target, Task, TaskCategory, TaskStatus } from "@/types/ctf";
import { defaultCheatSheets, type CheatSheetData } from "@/data/cheatsheets";
import type { StoredProfile, ProfileData } from "@/types/profile";
import type { TargetTerminalManagerRef } from "@/components/ctf/TargetTerminalManager";

const PROFILES_STORAGE_KEY = "ctf-profiles";
const ACTIVE_PROFILE_KEY = "ctf-active-profile";

const Index = () => {
  const navigate = useNavigate();

  // Profile-specific state
  const [targets, setTargets] = useState<Target[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [cheatSheets, setCheatSheets] = useState<CheatSheetData[]>(defaultCheatSheets);
  const [isLoaded, setIsLoaded] = useState(false);

  // UI State
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCheatSheetId, setSelectedCheatSheetId] = useState<string | null>(null);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [cheatSheetDialogOpen, setCheatSheetDialogOpen] = useState(false);
  const [selectedCheatSheet, setSelectedCheatSheet] = useState<CheatSheetData | null>(null);
  const [addCheatDialogOpen, setAddCheatDialogOpen] = useState(false);
  const [networkMapOpen, setNetworkMapOpen] = useState(false);
  const [openVPNDialogOpen, setOpenVPNDialogOpen] = useState(false);
  const [cveDialogOpen, setCVEDialogOpen] = useState(false);
  const [tunnelingDialogOpen, setTunnelingDialogOpen] = useState(false);
  const [nmapImportOpen, setNmapImportOpen] = useState(false);
  const [httpServerOpen, setHttpServerOpen] = useState(false);
  const [httpServerRunning, setHttpServerRunning] = useState(false);
  const [tunnelingActive, setTunnelingActive] = useState(false);
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const [addTargetTerminalDialogOpen, setAddTargetTerminalDialogOpen] = useState(false);
  const [commandDialog, setCommandDialog] = useState<{
    isOpen: boolean;
    type: "RDP" | "SSH";
    target?: Target;
  }>({ isOpen: false, type: "RDP" });

  // Collapse states for panels (default collapsed)
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [targetTerminalExpanded, setTargetTerminalExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Expand states for larger viewing (Target Terminal only for now)
  const [targetTerminalEnlarged, setTargetTerminalEnlarged] = useState(false);

  // Maximize states for panels
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const [targetTerminalMaximized, setTargetTerminalMaximized] = useState(false);
  const [todoMaximized, setTodoMaximized] = useState(false);
  const [notesMaximized, setNotesMaximized] = useState(false);
  const [terminalConnected, setTerminalConnected] = useState(false);

  // VPN status
  const [vpnStatus, setVpnStatus] = useState({
    isConnected: false,
    isConnecting: false,
    ipAddress: null as string | null,
  });

  const terminalRef = useRef<SplitTerminalRef>(null);

  const targetTerminalManagerRef = useRef<TargetTerminalManagerRef>(null);

  // Draggable blocks hook
  const {
    draggedId,
    dragOverId,
    getSortedBlockIds,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDraggableBlocks();
  
  // Profile management
  const {
    profiles,
    activeProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    loadProfile,
    getActiveProfile,
    renameProfile,
  } = useProfiles();

  const activeProfile = getActiveProfile();
  
  // Get sorted block IDs for rendering order
  const sortedBlockIds = useMemo(() => getSortedBlockIds(), [getSortedBlockIds]);

  // Check if blocks are empty (for welcome message)
  const showWelcomeMessage = useMemo(() => {
    const noBlocksExpanded = !terminalExpanded && !targetTerminalExpanded && !notesExpanded;
    return noBlocksExpanded;
  }, [terminalExpanded, targetTerminalExpanded, notesExpanded]);

  // Load profile data on mount - redirect if no active profile
  useEffect(() => {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!activeId) {
      navigate("/");
      return;
    }

    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!stored) {
      navigate("/");
      return;
    }

    try {
      const allProfiles: StoredProfile[] = JSON.parse(stored);
      const profile = allProfiles.find((p) => p.id === activeId);
      if (!profile) {
        navigate("/");
        return;
      }

      // Load profile-specific data
      setTargets(profile.data.targets || []);
      setTasks(profile.data.tasks || []);
      setNotes(profile.data.notes || "");
      setCheatSheets(profile.data.cheatSheets?.length ? profile.data.cheatSheets : defaultCheatSheets);
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load profile data:", e);
      navigate("/");
    }
  }, [navigate]);

  // Auto-save profile data when it changes
  useEffect(() => {
    if (!isLoaded) return;

    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!activeId) return;

    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!stored) return;

    try {
      const allProfiles: StoredProfile[] = JSON.parse(stored);
      const index = allProfiles.findIndex((p) => p.id === activeId);
      if (index === -1) return;

      allProfiles[index] = {
        ...allProfiles[index],
        data: { targets, tasks, notes, cheatSheets },
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(allProfiles));
    } catch (e) {
      console.error("Failed to save profile data:", e);
    }
  }, [targets, tasks, notes, cheatSheets, isLoaded]);

  const handleDataLoaded = useCallback(
    (data: { targets: Target[]; tasks: Task[]; notes: string; cheatSheets: CheatSheetData[] }) => {
      setTargets(data.targets);
      setTasks(data.tasks);
      setNotes(data.notes);
      setCheatSheets(data.cheatSheets);
    },
    [],
  );

  const handleSendToTerminal = useCallback((command: string) => {
    if (terminalRef.current) {
      terminalRef.current.setInputValue(command);
    }
  }, []);

  const handleVpnStatusChange = useCallback((connected: boolean, connecting: boolean, ip: string | null) => {
    setVpnStatus({ isConnected: connected, isConnecting: connecting, ipAddress: ip });
  }, []);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);

  // Cheat Sheet Actions
  const handleSelectCheatSheet = (id: string) => {
    const sheet = cheatSheets.find((cs) => cs.id === id);
    if (sheet) {
      setSelectedCheatSheet(sheet);
      setSelectedCheatSheetId(id);
      setCheatSheetDialogOpen(true);
    }
  };

  const handleImportCheatSheet = (id: string, data: CheatSheetData) => {
    setCheatSheets((prev) => prev.map((cs) => (cs.id === id ? data : cs)));
  };

  const handleAddCheatSheet = (newCheat: CheatSheetData) => {
    setCheatSheets((prev) => [...prev, newCheat]);
    toast.success(`Added cheat sheet: ${newCheat.name}`);
  };

  const handleReorderCheatSheets = (reorderedSheets: CheatSheetData[]) => {
    setCheatSheets(reorderedSheets);
  };

  const handleUpdateCheatSheetColor = (id: string, color: string) => {
    setCheatSheets((prev) => prev.map((cs) => (cs.id === id ? { ...cs, color } : cs)));
  };

  const handleImportAllCheatSheets = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) {
              setCheatSheets(data);
              toast.success(`Imported ${data.length} cheat sheets!`);
            } else if (data.cheatSheets && Array.isArray(data.cheatSheets)) {
              setCheatSheets(data.cheatSheets);
              toast.success(`Imported ${data.cheatSheets.length} cheat sheets!`);
            } else {
              toast.error("Invalid format. Expected array of cheat sheets.");
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

  // Target Actions
  const handleAddTarget = () => {
    setEditingTarget(null);
    setTargetDialogOpen(true);
  };

  const handleEditTarget = () => {
    if (selectedTarget) {
      setEditingTarget(selectedTarget);
      setTargetDialogOpen(true);
    }
  };

  const handleSaveTarget = (targetData: Omit<Target, "id"> & { id?: string }) => {
    if (targetData.id) {
      setTargets((prev) => prev.map((t) => (t.id === targetData.id ? ({ ...targetData, id: t.id } as Target) : t)));
      toast.success("Target updated!");
    } else {
      const newTarget: Target = {
        ...targetData,
        id: crypto.randomUUID(),
      };
      setTargets((prev) => [...prev, newTarget]);
      toast.success("Target added!");
    }
  };

  const handleDeleteTarget = () => {
    if (selectedTargetId) {
      setTargets((prev) => prev.filter((t) => t.id !== selectedTargetId));
      setSelectedTargetId(null);
      toast.success("Target deleted!");
    }
  };

  const handleCopyTarget = () => {
    if (selectedTarget) {
      const copiedTarget: Target = {
        ...selectedTarget,
        id: crypto.randomUUID(),
        hostname: `${selectedTarget.hostname} (copy)`,
        credentials: selectedTarget.credentials.map((c) => ({ ...c, id: crypto.randomUUID() })),
      };
      setTargets((prev) => [...prev, copiedTarget]);
      toast.success("Target copied!");
    }
  };

  const handleSaveTargets = () => {
    const dataStr = JSON.stringify(targets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ctf-targets.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Targets exported!");
  };

  const handleLoadTargets = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            const migratedData = data.map((t: any) => ({
              ...t,
              credentials:
                t.credentials ||
                (t.username || t.password
                  ? [
                      {
                        id: crypto.randomUUID(),
                        username: t.username || "",
                        password: t.password || "",
                      },
                    ]
                  : []),
            }));
            setTargets(migratedData);
            toast.success("Targets loaded!");
          } catch {
            toast.error("Invalid file format");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRDP = (target?: Target) => {
    const t = target || selectedTarget;
    if (t) {
      setCommandDialog({ isOpen: true, type: "RDP", target: t });
    }
  };

  const handleSSH = (target?: Target) => {
    const t = target || selectedTarget;
    if (t) {
      setCommandDialog({ isOpen: true, type: "SSH", target: t });
    }
  };

  // Open target terminal for selected target
  const handleOpenTargetTerminal = (target?: Target) => {
    const t = target || selectedTarget;
    if (t) {
      targetTerminalManagerRef.current?.openForTarget(t);
      setTargetTerminalExpanded(true); // Auto-expand when creating
      toast.success(`Target terminal opened for ${t.hostname}`);
    }
  };

  // Open the "Add Target Terminal" dialog with port selection
  const handleOpenAddTargetTerminalDialog = () => {
    setAddTargetTerminalDialogOpen(true);
  };

  // Create target terminal from dialog
  const handleCreateTargetTerminalFromDialog = (target: Target, listenerPort?: number) => {
    targetTerminalManagerRef.current?.openForTarget(target, listenerPort?.toString());
    setTargetTerminalExpanded(true);
    toast.success(`Target terminal opened for ${target.hostname}${listenerPort ? `:${listenerPort}` : ""}`);
  };

  // Open notes/report panel
  const handleOpenReport = (target?: Target) => {
    setNotesExpanded(true);
  };

  // Task Actions
  const handleAddTask = (content: string, category: TaskCategory, details?: string, notes?: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      completed: false,
      important: false,
      category,
      status: "low-priority",
      details,
      notes,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleImportNmapTasks = (importedTasks: Omit<Task, "id">[]) => {
    const tasksWithIds = importedTasks.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
    }));
    setTasks((prev) => [...prev, ...tasksWithIds]);
    toast.success(`Imported ${tasksWithIds.length} tasks from Nmap scan!`);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearDoneTasks = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
    toast.success("Completed tasks cleared!");
  };

  const handleUpdateTask = (
    id: string,
    content: string,
    category: TaskCategory,
    status: TaskStatus,
    details?: string,
    notes?: string,
  ) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, content, category, status, details, notes } : t)));
  };

  // Notes Actions
  const handleSaveNotes = () => {
    toast.success("Notes saved!");
  };

  const handleLoadNotes = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.md";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setNotes(e.target?.result as string);
          toast.success("Notes loaded!");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header
        onOpenNetworkMap={() => setNetworkMapOpen(true)}
        onOpenVPN={() => setOpenVPNDialogOpen(true)}
        onOpenCVE={() => setCVEDialogOpen(true)}
        onOpenTunneling={() => setTunnelingDialogOpen(true)}
        onOpenHTTPServer={() => setHttpServerOpen(true)}
        onOpenProfiles={() => setProfileManagerOpen(true)}
        isNetworkMapOpen={networkMapOpen}
        vpnStatus={vpnStatus}
        httpServerRunning={httpServerRunning}
        tunnelingActive={tunnelingActive}
        activeProfileName={activeProfile?.name}
      />

      <div className="flex flex-1 overflow-hidden">
        <CheatSheetsSidebar
          cheatSheets={cheatSheets}
          selectedId={selectedCheatSheetId}
          onSelect={handleSelectCheatSheet}
          onAdd={() => setAddCheatDialogOpen(true)}
          onImportAll={handleImportAllCheatSheets}
          onReorder={handleReorderCheatSheets}
          onUpdateColor={handleUpdateCheatSheetColor}
        />

        <main className="flex-1 flex flex-col overflow-y-auto p-4 gap-3">
          <section className="flex-shrink-0">
            <TargetTable 
              targets={targets} 
              selectedId={selectedTargetId} 
              onSelect={setSelectedTargetId}
              onRDP={handleRDP}
              onSSH={handleSSH}
              onTargetTerminal={handleOpenTargetTerminal}
              onReport={handleOpenReport}
            />

            <div className="mt-3">
              <TargetActions
                hasSelection={!!selectedTargetId}
                onAdd={handleAddTarget}
                onEdit={handleEditTarget}
                onDelete={handleDeleteTarget}
                onRDP={() => handleRDP()}
                onSSH={() => handleSSH()}
                onReport={() => setNotesExpanded(true)}
              />
            </div>
          </section>

          {/* Draggable Collapsible Blocks */}
          {sortedBlockIds.map((blockId) => {
            if (blockId === "terminal") {
              return (
                <section key="terminal" className="flex-shrink-0">
                  <CollapsibleBlock
                    id="terminal"
                    title="Terminal"
                    icon={<TerminalIcon className="w-4 h-4" />}
                    isOpen={terminalExpanded}
                    onOpenChange={setTerminalExpanded}
                    isMaximized={terminalMaximized}
                    onToggleMaximize={() => setTerminalMaximized(!terminalMaximized)}
                    resizable={true}
                    accentColor="cyan"
                    isDragging={draggedId === "terminal"}
                    isDragOver={dragOverId === "terminal"}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  >
                    <SplitTerminal
                      ref={terminalRef}
                      onConnectionChange={setTerminalConnected}
                    />
                  </CollapsibleBlock>
                </section>
              );
            }
            
            if (blockId === "target-terminal") {
              return (
                <section key="target-terminal" className="flex-shrink-0">
                  <CollapsibleBlock
                    id="target-terminal"
                    title="Target Terminals"
                    icon={<Layers className="w-4 h-4" />}
                    isOpen={targetTerminalExpanded}
                    onOpenChange={setTargetTerminalExpanded}
                    isMaximized={targetTerminalMaximized}
                    onToggleMaximize={() => setTargetTerminalMaximized(!targetTerminalMaximized)}
                    resizable={true}
                    accentColor="red"
                    isDragging={draggedId === "target-terminal"}
                    isDragOver={dragOverId === "target-terminal"}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  >
                    <TargetTerminalManager
                      ref={targetTerminalManagerRef}
                      targets={targets}
                    />
                  </CollapsibleBlock>
                </section>
              );
            }
            
            if (blockId === "notes") {
              return (
                <section key="notes" className="flex-shrink-0">
                  <CollapsibleBlock
                    id="notes"
                    title="Notes / Report"
                    icon={<FileText className="w-4 h-4" />}
                    isOpen={notesExpanded}
                    onOpenChange={setNotesExpanded}
                    isMaximized={notesMaximized}
                    onToggleMaximize={() => setNotesMaximized(!notesMaximized)}
                    resizable={true}
                    accentColor="default"
                    isDragging={draggedId === "notes"}
                    isDragOver={dragOverId === "notes"}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  >
                    <NotesPanel
                      notes={notes}
                      onChange={setNotes}
                      onSave={handleSaveNotes}
                      onLoad={handleLoadNotes}
                      isMaximized={false}
                      onToggleMaximize={() => {}}
                    />
                  </CollapsibleBlock>
                </section>
              );
            }
            
            return null;
          })}

          {/* Welcome message when all blocks are collapsed */}
          <WelcomeMessage isVisible={showWelcomeMessage} />
        </main>

        <aside className="w-80 border-l-2 border-l-[hsl(var(--panel-border))] p-4 overflow-hidden flex flex-col">
          <TodoList
            tasks={tasks}
            onAdd={handleAddTask}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onClearDone={handleClearDoneTasks}
            onUpdateTask={handleUpdateTask}
            isMaximized={todoMaximized}
            onToggleMaximize={() => setTodoMaximized(!todoMaximized)}
            onOpenNmapImport={() => setNmapImportOpen(true)}
          />
        </aside>
      </div>

      {/* Dialogs */}
      <TargetDialog
        isOpen={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
        onSave={handleSaveTarget}
        target={editingTarget}
        title={editingTarget ? "Edit Target" : "Add Target"}
      />
      <CommandDialog
        isOpen={commandDialog.isOpen}
        onClose={() => setCommandDialog({ ...commandDialog, isOpen: false })}
        type={commandDialog.type}
        ip={commandDialog.target?.ip || selectedTarget?.ip || ""}
        credentials={commandDialog.target?.credentials || selectedTarget?.credentials || []}
      />
      <AddTargetTerminalDialog
        open={addTargetTerminalDialogOpen}
        onOpenChange={setAddTargetTerminalDialogOpen}
        targets={targets}
        onCreateTerminal={handleCreateTargetTerminalFromDialog}
      />
      <CheatSheetDialog
        isOpen={cheatSheetDialogOpen}
        onClose={() => setCheatSheetDialogOpen(false)}
        cheatSheet={selectedCheatSheet}
        onImport={handleImportCheatSheet}
        targets={targets}
        onSendToTerminal={handleSendToTerminal}
      />
      <AddCheatDialog
        isOpen={addCheatDialogOpen}
        onClose={() => setAddCheatDialogOpen(false)}
        onSave={handleAddCheatSheet}
      />
      <NetworkMapDialog isOpen={networkMapOpen} onClose={() => setNetworkMapOpen(false)} targets={targets} />
      <OpenVPNDialog
        open={openVPNDialogOpen}
        onOpenChange={setOpenVPNDialogOpen}
        onStatusChange={handleVpnStatusChange}
      />
      <CVECheckerDialog open={cveDialogOpen} onOpenChange={setCVEDialogOpen} />
      <TunnelingDialog open={tunnelingDialogOpen} onOpenChange={setTunnelingDialogOpen} targets={targets} onStatusChange={setTunnelingActive} />
      <NmapImportDialog open={nmapImportOpen} onOpenChange={setNmapImportOpen} onImport={handleImportNmapTasks} />
      <HTTPServerDialog
        open={httpServerOpen}
        onOpenChange={setHttpServerOpen}
        onServerStatusChange={setHttpServerRunning}
      />
      <ProfileManagerDialog
        open={profileManagerOpen}
        onOpenChange={setProfileManagerOpen}
        profiles={profiles}
        activeProfileId={activeProfileId}
        currentData={{ targets, tasks, notes, cheatSheets }}
        onCreateProfile={createProfile}
        onUpdateProfile={updateProfile}
        onDeleteProfile={deleteProfile}
        onRenameProfile={renameProfile}
        onDataLoaded={handleDataLoaded}
      />
    </div>
  );
};

export default Index;
