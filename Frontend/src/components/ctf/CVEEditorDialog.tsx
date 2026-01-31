import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Save, Trash2, Edit3 } from "lucide-react";
import { CVEEntry } from "@/data/cveDatabase";
import { toast } from "sonner";

interface CVEEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cve?: CVEEntry | null;
  onSave: (cve: CVEEntry) => void;
  onDelete?: (id: string) => void;
  mode: "add" | "edit";
}

export function CVEEditorDialog({ open, onOpenChange, cve, onSave, onDelete, mode }: CVEEditorDialogProps) {
  const [formData, setFormData] = useState<CVEEntry>({
    id: "",
    title: "",
    description: "",
    severity: "medium",
    cvss: undefined,
    affectedProducts: [],
    publishedDate: new Date().toISOString().split("T")[0],
    os: [],
    services: [],
    pocs: [],
    references: [],
  });

  const [newProduct, setNewProduct] = useState("");
  const [newOS, setNewOS] = useState("");
  const [newService, setNewService] = useState("");
  const [newReference, setNewReference] = useState("");
  const [newPoc, setNewPoc] = useState({ name: "", url: "", language: "" });

  useEffect(() => {
    if (cve && mode === "edit") {
      setFormData({ ...cve });
    } else if (mode === "add") {
      setFormData({
        id: "",
        title: "",
        description: "",
        severity: "medium",
        cvss: undefined,
        affectedProducts: [],
        publishedDate: new Date().toISOString().split("T")[0],
        os: [],
        services: [],
        pocs: [],
        references: [],
      });
    }
  }, [cve, mode, open]);

  const handleSave = () => {
    if (!formData.id.trim()) {
      toast.error("CVE ID is required");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSave(formData);
    toast.success(mode === "add" ? "CVE added successfully" : "CVE updated successfully");
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete && formData.id) {
      onDelete(formData.id);
      toast.success("CVE deleted");
      onOpenChange(false);
    }
  };

  const addItem = (
    field: "affectedProducts" | "os" | "services" | "references",
    value: string,
    setter: (v: string) => void,
  ) => {
    if (value.trim() && !formData[field]?.includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()],
      }));
      setter("");
    }
  };

  const removeItem = (field: "affectedProducts" | "os" | "services" | "references", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field]?.filter((item) => item !== value) || [],
    }));
  };

  const addPoc = () => {
    if (newPoc.name.trim() && newPoc.url.trim()) {
      setFormData((prev) => ({
        ...prev,
        pocs: [...prev.pocs, { ...newPoc, name: newPoc.name.trim(), url: newPoc.url.trim() }],
      }));
      setNewPoc({ name: "", url: "", language: "" });
    }
  };

  const removePoc = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pocs: prev.pocs.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col bg-background border-primary/30 overflow-hidden">
        <DialogHeader className="flex-shrink-0 border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-primary">
            {mode === "add" ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            {mode === "add" ? "Add New CVE" : "Edit CVE"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-4 py-4 pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cve-id">CVE ID *</Label>
                <Input
                  id="cve-id"
                  value={formData.id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value.toUpperCase() }))}
                  placeholder="CVE-2024-XXXXX"
                  disabled={mode === "edit"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvss">CVSS Score</Label>
                <Input
                  id="cvss"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.cvss || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cvss: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0.0 - 10.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Vulnerability title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      severity: e.target.value as CVEEntry["severity"],
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Published Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, publishedDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed vulnerability description..."
                rows={3}
              />
            </div>

            {/* Affected Products */}
            <div className="space-y-2">
              <Label>Affected Products</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.affectedProducts?.map((product) => (
                  <Badge key={product} variant="secondary" className="gap-1">
                    {product}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem("affectedProducts", product)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addItem("affectedProducts", newProduct, setNewProduct))
                  }
                  placeholder="Add affected product..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem("affectedProducts", newProduct, setNewProduct)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* OS Tags */}
            <div className="space-y-2">
              <Label>Operating Systems</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.os?.map((os) => (
                  <Badge key={os} variant="outline" className="gap-1">
                    🖥️ {os}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem("os", os)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newOS}
                  onChange={(e) => setNewOS(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("os", newOS, setNewOS))}
                  placeholder="Add OS (e.g., Windows, Linux)..."
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addItem("os", newOS, setNewOS)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Services Tags */}
            <div className="space-y-2">
              <Label>Services / Protocols</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.services?.map((service) => (
                  <Badge key={service} variant="secondary" className="gap-1">
                    {service}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem("services", service)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addItem("services", newService, setNewService))
                  }
                  placeholder="Add service (e.g., SMB, SSH)..."
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addItem("services", newService, setNewService)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* PoC Links */}
            <div className="space-y-2">
              <Label>PoC Links</Label>
              <div className="space-y-2 mb-2">
                {formData.pocs.map((poc, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-card/50 rounded border border-border">
                    <div className="flex-1 text-sm">
                      <span className="font-mono text-primary">{poc.name}</span>
                      {poc.language && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {poc.language}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground truncate">{poc.url}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removePoc(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={newPoc.name}
                  onChange={(e) => setNewPoc((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="user/repo"
                />
                <Input
                  value={newPoc.url}
                  onChange={(e) => setNewPoc((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://github.com/..."
                />
                <div className="flex gap-2">
                  <Input
                    value={newPoc.language}
                    onChange={(e) => setNewPoc((prev) => ({ ...prev, language: e.target.value }))}
                    placeholder="Language"
                    className="flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={addPoc}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* References */}
            <div className="space-y-2">
              <Label>References</Label>
              <div className="space-y-1 mb-2">
                {formData.references?.map((ref) => (
                  <div key={ref} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-muted-foreground">{ref}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => removeItem("references", ref)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addItem("references", newReference, setNewReference))
                  }
                  placeholder="https://nvd.nist.gov/vuln/detail/..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem("references", newReference, setNewReference)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-border">
          {mode === "edit" && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {mode === "add" ? "Add CVE" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
