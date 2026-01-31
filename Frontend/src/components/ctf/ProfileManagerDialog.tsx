import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  User,
  CloudDownload,
  CloudUpload,
  Download,
  Upload,
  Database,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  saveProfileToServer,
  loadProfileFromServer,
  exportProfileToFile,
  importProfileFromFile,
  profileKeyFromName,
} from "@/services/profileDatabase";
import type { Profile, ProfileData } from "@/types/profile";

interface ProfileManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Profile[];
  activeProfileId: string | null;
  currentData: ProfileData;
  onCreateProfile: (name: string, data: ProfileData) => Profile;
  onUpdateProfile: (id: string, data: ProfileData, newName?: string) => boolean;
  onDeleteProfile: (id: string) => boolean;
  onRenameProfile: (id: string, newName: string) => boolean;
  onDataLoaded: (data: ProfileData) => void;
}

export function ProfileManagerDialog({
  open,
  onOpenChange,
  profiles,
  activeProfileId,
  currentData,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile,
  onRenameProfile,
  onDataLoaded,
}: ProfileManagerDialogProps) {
  const [newProfileName, setNewProfileName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [noDatabaseAlert, setNoDatabaseAlert] = useState<{
    open: boolean;
    profileName: string;
  }>({ open: false, profileName: "" });
  const [filePathConfirm, setFilePathConfirm] = useState<{
    open: boolean;
    action: "export" | "import";
    profile?: Profile;
  }>({ open: false, action: "export" });

  const importFileRef = useRef<HTMLInputElement>(null);

  const handleCreateProfile = () => {
    const name = newProfileName.trim();
    if (!name) {
      toast.error("Please enter a profile name");
      return;
    }

    // Auto-save current profile if one is active
    if (activeProfileId) {
      onUpdateProfile(activeProfileId, currentData);
    }

    const profile = onCreateProfile(name, currentData);
    toast.success(`Profile "${profile.name}" created!`);
    setNewProfileName("");
  };

  const handleDeleteProfile = (id: string, name: string) => {
    if (confirm(`Delete profile "${name}"? This cannot be undone.`)) {
      const success = onDeleteProfile(id);
      if (success) {
        toast.success(`Profile "${name}" deleted`);
      } else {
        toast.error("Failed to delete profile");
      }
    }
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleConfirmRename = (id: string) => {
    const name = editingName.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }

    const success = onRenameProfile(id, name);
    if (success) {
      toast.success("Profile renamed!");
      setEditingId(null);
      setEditingName("");
    } else {
      toast.error("Failed to rename profile");
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };


  const handleSaveToServer = async (profile: Profile) => {
    toast.loading("Saving to server...", { id: "save-profile" });
    const result = await saveProfileToServer(profile.name, currentData);

    if (result.success) {
      // Also update local storage
      onUpdateProfile(profile.id, currentData);
      toast.success(`Profile "${profile.name}" saved to server`, { id: "save-profile" });
    } else if (result.error === "NO_DATABASE") {
      toast.dismiss("save-profile");
      setNoDatabaseAlert({ open: true, profileName: profile.name });
    } else {
      toast.error(result.error || "Failed to save to server", { id: "save-profile" });
    }
  };

  const handleLoadFromServer = async (profile: Profile) => {
    toast.loading("Loading from server...", { id: "load-profile" });
    const result = await loadProfileFromServer(profile.name);

    if (result.success && result.data) {
      // Update local storage and UI
      onUpdateProfile(profile.id, result.data);
      onDataLoaded(result.data);
      toast.success(`Profile "${profile.name}" loaded from server`, { id: "load-profile" });
      onOpenChange(false);
    } else if (result.error === "NO_DATABASE") {
      toast.dismiss("load-profile");
      setNoDatabaseAlert({ open: true, profileName: profile.name });
    } else {
      toast.error(result.error || "Failed to load from server", { id: "load-profile" });
    }
  };

  

  const handleExportJSON = (profile: Profile) => {
    setFilePathConfirm({ open: true, action: "export", profile });
  };

  const doExportJSON = (profile: Profile) => {
    exportProfileToFile(profile.name, currentData);
    toast.success(`Profile "${profile.name}" exported!`);
  };

  const handleImportJSONClick = () => {
    setFilePathConfirm({ open: true, action: "import" });
  };

  const doImportJSONClick = () => {
    importFileRef.current?.click();
  };

  const handleImportJSONFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importProfileFromFile(file);
    if (result.success && result.data) {
      // If there's an active profile, update it with imported data
      if (activeProfileId) {
        onUpdateProfile(activeProfileId, result.data);
      }
      onDataLoaded(result.data);
      toast.success("Profile data imported successfully!");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Import failed");
    }

    e.target.value = "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg bg-card border-2 border-[hsl(var(--panel-border))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <User className="w-5 h-5" />
              Profile Manager
            </DialogTitle>
            <DialogDescription>
              Manage your profiles with server sync and JSON import/export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new profile */}
            <div className="flex gap-2">
              <Input
                placeholder="New profile name..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProfile()}
                className="flex-1 bg-background border-border"
              />
              <Button onClick={handleCreateProfile} className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </div>

            {/* Database actions for active profile */}
            {activeProfile && (
              <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-primary">
                    Active: {activeProfile.name}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveToServer(activeProfile)}
                    className="gap-1.5 text-xs text-primary"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    Save to Server
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadFromServer(activeProfile)}
                    className="gap-1.5 text-xs text-primary"
                  >
                    <CloudDownload className="w-3.5 h-3.5" />
                    Load from Server
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportJSON(activeProfile)}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImportJSONClick}
                    className="gap-1.5 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden file input for import */}
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSONFile}
            />

            {/* Profiles list */}
            <div className="border border-border rounded-md">
              <div className="px-3 py-2 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="w-4 h-4" />
                Saved Profiles ({profiles.length})
              </div>

              {profiles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No profiles saved yet. Create one above!
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <div className="divide-y divide-border">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={`p-3 hover:bg-muted/30 transition-colors ${
                          profile.id === activeProfileId
                            ? "bg-primary/10 border-l-2 border-l-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingId === profile.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleConfirmRename(profile.id);
                                    if (e.key === "Escape") handleCancelRename();
                                  }}
                                  className="h-7 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleConfirmRename(profile.id)}
                                >
                                  <Check className="w-3 h-3 text-success" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={handleCancelRename}
                                >
                                  <X className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="font-medium text-foreground truncate flex items-center gap-2">
                                  {profile.name}
                                  {profile.id === activeProfileId && (
                                    <span className="text-xs text-primary font-normal">
                                      (active)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Updated: {formatDate(profile.updatedAt)}
                                </div>
                              </>
                            )}
                          </div>

                          {editingId !== profile.id && (
                            <div className="flex items-center gap-1">
                              {/* Database dropdown menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    title="Database actions"
                                  >
                                    <Database className="w-4 h-4 text-primary" />
                                  </Button>
                                </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => handleSaveToServer(profile)}
                                    className="cursor-pointer text-primary"
                                  >
                                    <CloudUpload className="w-4 h-4 mr-2" />
                                    Save to Server
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleLoadFromServer(profile)}
                                    className="cursor-pointer text-primary"
                                  >
                                    <CloudDownload className="w-4 h-4 mr-2" />
                                    Load from Server
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleExportJSON(profile)}
                                    className="cursor-pointer"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export JSON
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleStartRename(profile.id, profile.name)}
                                title="Rename profile"
                              >
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleDeleteProfile(profile.id, profile.name)}
                                title="Delete profile"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Current session info */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
              <div className="font-medium mb-1">Current Session Data:</div>
              <div className="grid grid-cols-2 gap-1">
                <span>• {currentData.targets.length} host(s)</span>
                <span>• {currentData.tasks.length} task(s)</span>
                <span>• {currentData.notes.length} chars notes</span>
                <span>• {currentData.cheatSheets.length} cheat sheet(s)</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Database Alert Dialog */}
      <AlertDialog
        open={noDatabaseAlert.open}
        onOpenChange={(open) => setNoDatabaseAlert({ ...noDatabaseAlert, open })}
      >
        <AlertDialogContent className="bg-card border-2 border-warning/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              No Database Found
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              No database exists for profile "{noDatabaseAlert.profileName}" yet.
              <br />
              <br />
              Please <strong>Export</strong> the current data as{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                profile-{profileKeyFromName(noDatabaseAlert.profileName)}.json
              </code>{" "}
              to initialize storage.
              <br />
              <br />
              After placing the exported file in the backend folder, Save/Load will work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const profile = profiles.find((p) => p.name === noDatabaseAlert.profileName);
                if (profile) {
                  handleExportJSON(profile);
                }
                setNoDatabaseAlert({ open: false, profileName: "" });
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  ? "Place your JSON file in:"
                  : "Place your JSON file in:"}
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
                if (filePathConfirm.action === "export" && filePathConfirm.profile) {
                  doExportJSON(filePathConfirm.profile);
                } else if (filePathConfirm.action === "import") {
                  doImportJSONClick();
                }
                setFilePathConfirm({ open: false, action: "export" });
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
