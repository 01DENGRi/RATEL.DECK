import { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { Target, OSType, Credential, TargetColors, Ticket, Hash, TicketType, HashType } from "@/types/ctf";

interface TargetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (target: Omit<Target, "id"> & { id?: string }) => void;
  target?: Target | null;
  title: string;
}

const defaultOsOptions: OSType[] = ["Windows", "Linux", "macOS", "Unknown"];
const defaultColors = ["#00d4aa", "#ff6b6b", "#4ade80", "#f59e0b", "#8b5cf6", "#3b82f6", "#f97316", "#06b6d4"];
const ticketTypes: TicketType[] = ["TGT", "TGS", "ADCS", "Golden", "Silver", "Other"];
const hashTypes: HashType[] = [
  "NTLM",
  "NTLMv2",
  "LM",
  "Kerberos",
  "ASREP",
  "SHA1",
  "SHA256",
  "MD5",
  "NetNTLMv1",
  "NetNTLMv2",
  "Other",
];

const defaultComponentColors: TargetColors = {
  os: "#00d4aa",
  hostname: "#00d4aa",
  ip: "#f59e0b",
  credentials: "#8b5cf6",
  tickets: "#f97316",
  hashes: "#06b6d4",
};

export function TargetDialog({ isOpen, onClose, onSave, target, title }: TargetDialogProps) {
  const [formData, setFormData] = useState({
    os: "Unknown" as OSType,
    customOs: "",
    hostname: "",
    ip: "",
    color: "#00d4aa",
  });
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hashes, setHashes] = useState<Hash[]>([]);
  const [componentColors, setComponentColors] = useState<TargetColors>(defaultComponentColors);
  const [showColorCustomization, setShowColorCustomization] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showHashes, setShowHashes] = useState(false);

  useEffect(() => {
    if (target) {
      setFormData({
        os: target.os,
        customOs: target.customOs || "",
        hostname: target.hostname,
        ip: target.ip,
        color: target.color,
      });
      setCredentials(target.credentials || []);
      setTickets(target.tickets || []);
      setHashes(target.hashes || []);
      setComponentColors(target.colors || defaultComponentColors);
      setShowTickets((target.tickets || []).length > 0);
      setShowHashes((target.hashes || []).length > 0);
    } else {
      setFormData({
        os: "Unknown",
        customOs: "",
        hostname: "",
        ip: "",
        color: "#00d4aa",
      });
      setCredentials([{ id: crypto.randomUUID(), username: "", password: "", note: "" }]);
      setTickets([]);
      setHashes([]);
      setComponentColors(defaultComponentColors);
      setShowTickets(false);
      setShowHashes(false);
    }
  }, [target, isOpen]);

  const handleAddCredential = () => {
    setCredentials((prev) => [...prev, { id: crypto.randomUUID(), username: "", password: "", note: "" }]);
  };

  const handleRemoveCredential = (id: string) => {
    if (credentials.length > 1) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleCredentialChange = (id: string, field: keyof Credential, value: string) => {
    setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleAddTicket = () => {
    setTickets((prev) => [...prev, { id: crypto.randomUUID(), type: "TGT", value: "", note: "" }]);
  };

  const handleRemoveTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTicketChange = (id: string, field: keyof Ticket, value: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleAddHash = () => {
    setHashes((prev) => [...prev, { id: crypto.randomUUID(), type: "NTLM", value: "", note: "" }]);
  };

  const handleRemoveHash = (id: string) => {
    setHashes((prev) => prev.filter((h) => h.id !== id));
  };

  const handleHashChange = (id: string, field: keyof Hash, value: string) => {
    setHashes((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      customOs: formData.os === "Unknown" ? formData.customOs : undefined,
      credentials: credentials.filter((c) => c.username || c.password),
      tickets: tickets.filter((t) => t.value),
      hashes: hashes.filter((h) => h.value),
      colors: componentColors,
      id: target?.id,
    });
    onClose();
  };

  const ColorPicker = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (color: string) => void;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <div className="flex gap-1">
        {defaultColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-4 h-4 rounded border transition-all ${
              value === color ? "border-foreground scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded cursor-pointer bg-transparent"
      />
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-lg animate-slide-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary rounded-t-lg">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* OS Selection */}
          <div className="grid grid-cols-[100px_1fr] items-start gap-3">
            <label className="text-sm text-muted-foreground pt-2">OS</label>
            <div className="space-y-2">
              <select
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value as OSType })}
                className="ctf-select w-full"
              >
                {defaultOsOptions.map((os) => (
                  <option key={os} value={os}>
                    {os}
                  </option>
                ))}
              </select>
              {formData.os === "Unknown" && (
                <input
                  type="text"
                  value={formData.customOs}
                  onChange={(e) => setFormData({ ...formData, customOs: e.target.value })}
                  placeholder="Custom OS name (e.g., FreeBSD, ESXi, FortiOS...)"
                  className="ctf-input w-full"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm text-muted-foreground">Hostname</label>
            <input
              type="text"
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              placeholder="DC1.domain.local"
              className="ctf-input"
            />
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <label className="text-sm text-muted-foreground">IP</label>
            <input
              type="text"
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
              placeholder="10.10.10.1"
              className="ctf-input"
            />
          </div>

          {/* Credentials Section */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Credentials</label>
              <button
                type="button"
                onClick={handleAddCredential}
                className="ctf-button text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {credentials.map((cred, index) => (
                <div key={cred.id} className="bg-secondary/50 rounded-lg p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    {credentials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCredential(cred.id)}
                        className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cred.username}
                      onChange={(e) => handleCredentialChange(cred.id, "username", e.target.value)}
                      placeholder="Username"
                      className="ctf-input text-sm"
                    />
                    <input
                      type="text"
                      value={cred.password}
                      onChange={(e) => handleCredentialChange(cred.id, "password", e.target.value)}
                      placeholder="Password"
                      className="ctf-input text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={cred.note || ""}
                    onChange={(e) => handleCredentialChange(cred.id, "note", e.target.value)}
                    placeholder="Note"
                    className="ctf-input text-sm w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tickets Section */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => {
                setShowTickets(!showTickets);
                if (!showTickets && tickets.length === 0) {
                  handleAddTicket();
                }
              }}
              className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"
            >
              {showTickets ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Tickets (AD/ADCS)
              {tickets.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">{tickets.length}</span>
              )}
            </button>

            {showTickets && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddTicket}
                    className="ctf-button text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Ticket
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tickets.map((ticket, index) => (
                    <div key={ticket.id} className="bg-secondary/50 rounded-lg p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Ticket #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTicket(ticket.id)}
                          className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <select
                          value={ticket.type}
                          onChange={(e) => handleTicketChange(ticket.id, "type", e.target.value)}
                          className="ctf-select text-sm"
                        >
                          {ticketTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={ticket.value}
                          onChange={(e) => handleTicketChange(ticket.id, "value", e.target.value)}
                          placeholder="Ticket value/path (e.g., kirbi, ccache)"
                          className="ctf-input text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        value={ticket.note || ""}
                        onChange={(e) => handleTicketChange(ticket.id, "note", e.target.value)}
                        placeholder="Note (e.g., domain admin, service account)"
                        className="ctf-input text-sm w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hashes Section */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => {
                setShowHashes(!showHashes);
                if (!showHashes && hashes.length === 0) {
                  handleAddHash();
                }
              }}
              className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"
            >
              {showHashes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Hashes
              {hashes.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">{hashes.length}</span>
              )}
            </button>

            {showHashes && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button type="button" onClick={handleAddHash} className="ctf-button text-xs flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add Hash
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {hashes.map((hash, index) => (
                    <div key={hash.id} className="bg-secondary/50 rounded-lg p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Hash #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHash(hash.id)}
                          className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <select
                          value={hash.type}
                          onChange={(e) => handleHashChange(hash.id, "type", e.target.value)}
                          className="ctf-select text-sm"
                        >
                          {hashTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={hash.value}
                          onChange={(e) => handleHashChange(hash.id, "value", e.target.value)}
                          placeholder="Hash value"
                          className="ctf-input text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        value={hash.note || ""}
                        onChange={(e) => handleHashChange(hash.id, "note", e.target.value)}
                        placeholder="Note (e.g., cracked, pass-the-hash)"
                        className="ctf-input text-sm w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Customization */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowColorCustomization(!showColorCustomization)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"
            >
              {showColorCustomization ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Color Customization
            </button>

            {showColorCustomization && (
              <div className="space-y-2 bg-secondary/30 rounded-lg p-2">
                <ColorPicker
                  label="OS"
                  value={componentColors.os}
                  onChange={(color) => setComponentColors((prev) => ({ ...prev, os: color }))}
                />
                <ColorPicker
                  label="Hostname"
                  value={componentColors.hostname}
                  onChange={(color) => setComponentColors((prev) => ({ ...prev, hostname: color }))}
                />
                <ColorPicker
                  label="IP"
                  value={componentColors.ip}
                  onChange={(color) => setComponentColors((prev) => ({ ...prev, ip: color }))}
                />
                <ColorPicker
                  label="Credentials"
                  value={componentColors.credentials}
                  onChange={(color) => setComponentColors((prev) => ({ ...prev, credentials: color }))}
                />
                <ColorPicker
                  label="Tickets"
                  value={componentColors.tickets}
                  onChange={(color) => setComponentColors((prev) => ({ ...prev, tickets: color }))}
                />
                <ColorPicker
                  label="Hashes"
                  value={componentColors.hashes}
                  onChange={(color) => setComponentColors((prev) => ({ ...prev, hashes: color }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button type="button" onClick={onClose} className="header-button px-4 py-1.5">
              Cancel
            </button>
            <button type="submit" className="header-button px-4 py-1.5 bg-primary/20 text-primary hover:bg-primary/30">
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
