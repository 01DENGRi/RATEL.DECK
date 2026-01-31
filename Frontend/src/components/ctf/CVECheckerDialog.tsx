import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  Bug,
  Search,
  ExternalLink,
  Github,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Check,
  Filter,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Edit3,
  Database,
  Download,
  Upload,
  RotateCcw,
  CloudDownload,
  CloudUpload,
  FolderOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  searchCVE,
  getCVEById,
  CVEEntry,
  CVEFilters,
  defaultOSFilters,
  defaultServiceFilters,
  getAvailableYears,
  addCVE,
  updateCVE,
  deleteCVE,
  getAllCVEs,
  exportDatabaseToFile,
  importDatabaseFromFile,
  mergeDatabaseFromFile,
  resetDatabaseToDefaults,
  saveDatabaseToServer,
  loadDatabaseFromServer,
} from "@/data/cveDatabase";
import { toast } from "sonner";
import { CVEEditorDialog } from "./CVEEditorDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CVECheckerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CVECheckerDialog({ open, onOpenChange }: CVECheckerDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedCVE, setSelectedCVE] = useState<CVEEntry | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // File input refs
  const importFileRef = useRef<HTMLInputElement>(null);
  const mergeFileRef = useRef<HTMLInputElement>(null);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add");
  const [editingCVE, setEditingCVE] = useState<CVEEntry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [selectedOS, setSelectedOS] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");

  const [osOptions, setOsOptions] = useState<string[]>(defaultOSFilters);
  const [serviceOptions, setServiceOptions] = useState<string[]>(defaultServiceFilters);
  const [newOS, setNewOS] = useState("");
  const [newService, setNewService] = useState("");
  const [filePathConfirm, setFilePathConfirm] = useState<{
    open: boolean;
    action: "export" | "import" | "merge";
  }>({ open: false, action: "export" });

  const availableYears = useMemo(() => getAvailableYears(), [refreshKey]);

  const filters: CVEFilters = useMemo(
    () => ({
      os: selectedOS,
      services: selectedServices,
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
    }),
    [selectedOS, selectedServices, yearFrom, yearTo],
  );

  const results = useMemo(() => searchCVE(query, filters), [query, filters, refreshKey]);

  const activeFilterCount = selectedOS.length + selectedServices.length + (yearFrom ? 1 : 0) + (yearTo ? 1 : 0);

  // ----------------- Handlers -----------------
  const handleAddCVE = () => {
    setEditingCVE(null);
    setEditorMode("add");
    setEditorOpen(true);
  };
  const handleEditCVE = (cve: CVEEntry) => {
    setEditingCVE(cve);
    setEditorMode("edit");
    setEditorOpen(true);
  };
  const handleSaveCVE = (cve: CVEEntry) => {
    if (editorMode === "add") {
      const success = addCVE(cve);
      if (!success) {
        toast.error("CVE ID already exists");
        return;
      }
    } else {
      updateCVE(cve);
    }
    setRefreshKey((prev) => prev + 1);
    if (selectedCVE?.id === cve.id) setSelectedCVE(cve);
  };
  const handleDeleteCVE = (id: string) => {
    deleteCVE(id);
    setRefreshKey((prev) => prev + 1);
    if (selectedCVE?.id === id) setSelectedCVE(null);
  };
  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      const exact = getCVEById(value);
      if (exact) setSelectedCVE(exact);
      else if (results.length === 1) setSelectedCVE(results[0]);
    }
  };

  // Filters
  const toggleOS = (os: string) =>
    setSelectedOS((prev) => (prev.includes(os) ? prev.filter((o) => o !== os) : [...prev, os]));
  const toggleService = (svc: string) =>
    setSelectedServices((prev) => (prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]));
  const addCustomOS = () => {
    if (newOS.trim() && !osOptions.includes(newOS.trim())) {
      setOsOptions((prev) => [...prev, newOS.trim()]);
      toast.success(`Added "${newOS.trim()}" to OS filters`);
      setNewOS("");
    }
  };
  const addCustomService = () => {
    if (newService.trim() && !serviceOptions.includes(newService.trim())) {
      setServiceOptions((prev) => [...prev, newService.trim()]);
      toast.success(`Added "${newService.trim()}" to service filters`);
      setNewService("");
    }
  };
  const removeOSOption = (os: string) => {
    setOsOptions((prev) => prev.filter((o) => o !== os));
    setSelectedOS((prev) => prev.filter((o) => o !== os));
  };
  const removeServiceOption = (svc: string) => {
    setServiceOptions((prev) => prev.filter((s) => s !== svc));
    setSelectedServices((prev) => prev.filter((s) => s !== svc));
  };
  const clearFilters = () => {
    setSelectedOS([]);
    setSelectedServices([]);
    setYearFrom("");
    setYearTo("");
  };

  // Severity helpers
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Copy & clone
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied");
    setTimeout(() => setCopiedUrl(null), 2000);
  };
  const handleCloneCommand = (url: string) => {
    navigator.clipboard.writeText(`git clone ${url}.git`);
    toast.success("Clone command copied!");
  };

  // Database handlers
  const handleExport = () => {
    setFilePathConfirm({ open: true, action: "export" });
  };
  const handleImportClick = () => {
    setFilePathConfirm({ open: true, action: "import" });
  };
  const handleMergeClick = () => {
    setFilePathConfirm({ open: true, action: "merge" });
  };
  const doExport = () => {
    exportDatabaseToFile();
    toast.success("Database exported");
  };
  const doImportClick = () => importFileRef.current?.click();
  const doMergeClick = () => mergeFileRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importDatabaseFromFile(file);
    if (result.success) {
      toast.success(`Imported ${result.count} CVEs`);
      setRefreshKey((p) => p + 1);
      setSelectedCVE(null);
    } else toast.error(result.error || "Import failed");
    e.target.value = "";
  };
  const handleMergeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await mergeDatabaseFromFile(file);
    if (result.success) {
      toast.success(`Added ${result.added} new CVEs, skipped ${result.skipped}`);
      setRefreshKey((p) => p + 1);
    } else toast.error("Merge failed");
    e.target.value = "";
  };
  const handleReset = () => {
    if (confirm("Reset database to defaults?")) {
      resetDatabaseToDefaults();
      toast.success("Database reset");
      setRefreshKey((p) => p + 1);
      setSelectedCVE(null);
    }
  };

  // Server save/load handlers
  const handleSaveToServer = async () => {
    toast.loading("Saving to server...", { id: "save-server" });
    const result = await saveDatabaseToServer();
    if (result.success) {
      toast.success("Database saved to server", { id: "save-server" });
    } else {
      toast.error(result.error || "Failed to save to server", { id: "save-server" });
    }
  };

  const handleLoadFromServer = async () => {
    toast.loading("Loading from server...", { id: "load-server" });
    const result = await loadDatabaseFromServer();
    if (result.success) {
      toast.success(`Loaded ${result.count} CVEs from server`, { id: "load-server" });
      setRefreshKey((p) => p + 1);
      setSelectedCVE(null);
    } else {
      toast.error(result.error || "Failed to load from server", { id: "load-server" });
    }
  };

  // ----------------- Render -----------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[800px] flex flex-col bg-background border-primary/30">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Bug className="w-5 h-5" />
            CVE Checker & PoC Finder
          </DialogTitle>
        </DialogHeader>

        {/* Hidden File Inputs */}
        <input type="file" ref={importFileRef} onChange={handleImportFile} accept=".json" className="hidden" />
        <input type="file" ref={mergeFileRef} onChange={handleMergeFile} accept=".json" className="hidden" />

        {/* Search + Buttons */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search CVEs..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleAddCVE} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add CVE
            </Button>

            {/* ---------- Database Dropdown ---------- */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Database className="w-4 h-4" /> Database <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="z-[9999] bg-popover border-border">
                {/* Server Save/Load */}
                <DropdownMenuItem onClick={handleSaveToServer} className="cursor-pointer text-neon-cyan">
                  <CloudUpload className="w-4 h-4 mr-2" />
                  Save to Server
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLoadFromServer} className="cursor-pointer text-neon-cyan">
                  <CloudDownload className="w-4 h-4 mr-2" />
                  Load from Server
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* File Operations */}
                <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-2" />
                  Export to JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick} className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import (Replace All)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMergeClick} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Merge (Add New Only)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReset} className="text-destructive cursor-pointer">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={filtersOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Filters{" "}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Advanced Filters Collapsible */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-border bg-muted/30">
                {/* OS Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Operating System</label>
                  <div className="flex flex-wrap gap-1">
                    {osOptions.map((os) => (
                      <Badge
                        key={os}
                        variant={selectedOS.includes(os) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleOS(os)}
                      >
                        {os}
                        {!defaultOSFilters.includes(os) && (
                          <X
                            className="w-3 h-3 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOSOption(os);
                            }}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Input
                      value={newOS}
                      onChange={(e) => setNewOS(e.target.value)}
                      placeholder="Add OS..."
                      className="h-7 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addCustomOS()}
                    />
                    <Button size="sm" variant="ghost" onClick={addCustomOS} className="h-7 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Service Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Service / Software</label>
                  <div className="flex flex-wrap gap-1">
                    {serviceOptions.map((svc) => (
                      <Badge
                        key={svc}
                        variant={selectedServices.includes(svc) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleService(svc)}
                      >
                        {svc}
                        {!defaultServiceFilters.includes(svc) && (
                          <X
                            className="w-3 h-3 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeServiceOption(svc);
                            }}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Input
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      placeholder="Add service..."
                      className="h-7 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addCustomService()}
                    />
                    <Button size="sm" variant="ghost" onClick={addCustomService} className="h-7 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Year Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Year Range
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      placeholder="From"
                      className="h-7 text-xs w-20"
                      min={availableYears[availableYears.length - 1]}
                      max={availableYears[0]}
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input
                      type="number"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      placeholder="To"
                      className="h-7 text-xs w-20"
                      min={availableYears[availableYears.length - 1]}
                      max={availableYears[0]}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {availableYears[availableYears.length - 1]} - {availableYears[0]}
                  </p>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    <X className="w-3 h-3 mr-1" /> Clear all filters
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* CVE Results + Details */}
        <div className="flex-1 flex gap-4 min-h-0 mt-4">
          {/* Results List */}
          <div className="w-1/2 flex flex-col">
            <div className="text-sm text-muted-foreground mb-2">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>
            <ScrollArea className="flex-1 border border-border rounded-lg">
              <div className="p-2 space-y-1">
                {results.map((cve) => (
                  <div
                    key={cve.id}
                    onClick={() => setSelectedCVE(cve)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCVE?.id === cve.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{cve.id}</span>
                      <Badge className={getSeverityColor(cve.severity)} variant="secondary">
                        {getSeverityIcon(cve.severity)}
                        <span className="ml-1 capitalize">{cve.severity}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cve.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {cve.os && cve.os.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {cve.os.join(", ")}
                        </Badge>
                      )}
                      {cve.services && cve.services.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {cve.services.join(", ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No CVEs found</p>
                    <p className="text-xs">Try a different search or add a new CVE</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Details Panel */}
          <div className="w-1/2 flex flex-col">
            {selectedCVE ? (
              <ScrollArea className="flex-1 border border-border rounded-lg p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-mono text-lg font-bold">{selectedCVE.id}</h3>
                      <Badge className={getSeverityColor(selectedCVE.severity)} variant="secondary">
                        {getSeverityIcon(selectedCVE.severity)}
                        <span className="ml-1 capitalize">{selectedCVE.severity}</span>
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditCVE(selectedCVE)}>
                      <Edit3 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">{selectedCVE.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedCVE.os && selectedCVE.os.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">OS</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedCVE.os.map((o, idx) => (
                            <Badge key={idx} variant="outline">{o}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedCVE.services && selectedCVE.services.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Service</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedCVE.services.map((s, idx) => (
                            <Badge key={idx} variant="outline">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedCVE.pocs && selectedCVE.pocs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">PoC / Exploit Links</h4>
                      <div className="space-y-2">
                        {selectedCVE.pocs.map((poc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border"
                          >
                            {poc.url.includes("github.com") ? (
                              <Github className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div className="flex-1 min-w-0">
                              <a
                                href={poc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline truncate block"
                              >
                                {poc.name || poc.url}
                              </a>
                              {poc.language && (
                                <span className="text-xs text-muted-foreground">{poc.language}</span>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleCopyUrl(poc.url)}>
                              {copiedUrl === poc.url ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                            {poc.url.includes("github.com") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => handleCloneCommand(poc.url)}
                              >
                                <Github className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 border border-border rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Bug className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a CVE to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex-shrink-0 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Database className="w-3 h-3" /> {getAllCVEs().length} CVEs in database • Stored in localStorage • Use
            "Database" menu to export/import JSON
          </p>
        </div>

        {/* CVE Editor Dialog */}
        <CVEEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          cve={editingCVE}
          onSave={handleSaveCVE}
          onDelete={handleDeleteCVE}
          mode={editorMode}
        />

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
                    doExport();
                  } else if (filePathConfirm.action === "import") {
                    doImportClick();
                  } else if (filePathConfirm.action === "merge") {
                    doMergeClick();
                  }
                  setFilePathConfirm({ open: false, action: "export" });
                }}
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
