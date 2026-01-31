import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, Server, Plus, Trash2, Settings, Terminal, Radio, Save } from "lucide-react";

interface CustomC2Config {
  id: string;
  name: string;
  description: string;
  serverHost: string;
  serverPort: string;
  protocol: string;
  authType: string;
  username: string;
  password: string;
  apiKey: string;
  customHeaders: string;
  commands: { name: string; command: string }[];
  listeners: { name: string; config: string }[];
  notes: string;
}

interface CustomC2DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultConfig: CustomC2Config = {
  id: "",
  name: "",
  description: "",
  serverHost: "",
  serverPort: "",
  protocol: "https",
  authType: "password",
  username: "",
  password: "",
  apiKey: "",
  customHeaders: "",
  commands: [],
  listeners: [],
  notes: "",
};

export function CustomC2Dialog({ open, onOpenChange }: CustomC2DialogProps) {
  const [configs, setConfigs] = useState<CustomC2Config[]>(() => {
    const saved = localStorage.getItem("custom-c2-configs");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<CustomC2Config>(defaultConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newCommand, setNewCommand] = useState({ name: "", command: "" });
  const [newListener, setNewListener] = useState({ name: "", config: "" });

  const selectedConfig = configs.find(c => c.id === selectedConfigId);

  const handleSaveConfigs = (newConfigs: CustomC2Config[]) => {
    localStorage.setItem("custom-c2-configs", JSON.stringify(newConfigs));
    setConfigs(newConfigs);
  };

  const handleCreateNew = () => {
    const newConfig: CustomC2Config = {
      ...defaultConfig,
      id: Date.now().toString(),
      name: "New C2 Framework",
    };
    setEditConfig(newConfig);
    setIsEditing(true);
  };

  const handleEdit = (config: CustomC2Config) => {
    setEditConfig({ ...config });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editConfig.name) {
      toast({ title: "Name Required", description: "Please enter a name for this C2 configuration", variant: "destructive" });
      return;
    }

    const existingIndex = configs.findIndex(c => c.id === editConfig.id);
    let newConfigs: CustomC2Config[];
    
    if (existingIndex >= 0) {
      newConfigs = [...configs];
      newConfigs[existingIndex] = editConfig;
    } else {
      newConfigs = [...configs, editConfig];
    }

    handleSaveConfigs(newConfigs);
    setSelectedConfigId(editConfig.id);
    setIsEditing(false);
    toast({ title: "Saved", description: `${editConfig.name} configuration saved` });
  };

  const handleDelete = (id: string) => {
    const newConfigs = configs.filter(c => c.id !== id);
    handleSaveConfigs(newConfigs);
    if (selectedConfigId === id) {
      setSelectedConfigId(null);
    }
    toast({ title: "Deleted", description: "C2 configuration removed" });
  };

  const handleAddCommand = () => {
    if (!newCommand.name || !newCommand.command) return;
    setEditConfig({
      ...editConfig,
      commands: [...editConfig.commands, { ...newCommand }],
    });
    setNewCommand({ name: "", command: "" });
  };

  const handleRemoveCommand = (index: number) => {
    setEditConfig({
      ...editConfig,
      commands: editConfig.commands.filter((_, i) => i !== index),
    });
  };

  const handleAddListener = () => {
    if (!newListener.name || !newListener.config) return;
    setEditConfig({
      ...editConfig,
      listeners: [...editConfig.listeners, { ...newListener }],
    });
    setNewListener({ name: "", config: "" });
  };

  const handleRemoveListener = (index: number) => {
    setEditConfig({
      ...editConfig,
      listeners: editConfig.listeners.filter((_, i) => i !== index),
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-slate-900 border-cyan-500/30 p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Custom C2 Framework
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure and manage custom C2 frameworks
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex">
          {/* Sidebar - Config List */}
          <div className="w-64 border-r border-slate-700/50 p-4 flex flex-col">
            <Button onClick={handleCreateNew} size="sm" className="mb-4 bg-cyan-600 hover:bg-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              Add New C2
            </Button>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {configs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No custom C2 configured</p>
                ) : (
                  configs.map((config) => (
                    <div
                      key={config.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedConfigId === config.id
                          ? "bg-cyan-500/20 border-cyan-500/50"
                          : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                      }`}
                      onClick={() => {
                        setSelectedConfigId(config.id);
                        setIsEditing(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate">{config.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(config.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                      <span className="text-[10px] text-slate-500">{config.serverHost || "Not configured"}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            {isEditing ? (
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {editConfig.id ? "Edit Configuration" : "New Configuration"}
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Name *</Label>
                        <Input
                          value={editConfig.name}
                          onChange={(e) => setEditConfig({ ...editConfig, name: e.target.value })}
                          placeholder="My Custom C2"
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Description</Label>
                        <Input
                          value={editConfig.description}
                          onChange={(e) => setEditConfig({ ...editConfig, description: e.target.value })}
                          placeholder="Custom framework for..."
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Connection Settings */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Connection Settings</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Server Host</Label>
                        <Input
                          value={editConfig.serverHost}
                          onChange={(e) => setEditConfig({ ...editConfig, serverHost: e.target.value })}
                          placeholder="192.168.1.100"
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Port</Label>
                        <Input
                          value={editConfig.serverPort}
                          onChange={(e) => setEditConfig({ ...editConfig, serverPort: e.target.value })}
                          placeholder="443"
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Protocol</Label>
                        <Select value={editConfig.protocol} onValueChange={(v) => setEditConfig({ ...editConfig, protocol: v })}>
                          <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="websocket">WebSocket</SelectItem>
                            <SelectItem value="dns">DNS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Auth Type</Label>
                        <Select value={editConfig.authType} onValueChange={(v) => setEditConfig({ ...editConfig, authType: v })}>
                          <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="password">Password</SelectItem>
                            <SelectItem value="apikey">API Key</SelectItem>
                            <SelectItem value="certificate">Certificate</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Username</Label>
                        <Input
                          value={editConfig.username}
                          onChange={(e) => setEditConfig({ ...editConfig, username: e.target.value })}
                          placeholder="operator"
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Password / API Key</Label>
                        <Input
                          type="password"
                          value={editConfig.authType === "apikey" ? editConfig.apiKey : editConfig.password}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            [editConfig.authType === "apikey" ? "apiKey" : "password"]: e.target.value 
                          })}
                          placeholder="••••••••"
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commands */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Commands</h4>
                    <div className="flex gap-2">
                      <Input
                        value={newCommand.name}
                        onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
                        placeholder="Command name"
                        className="bg-slate-900 border-slate-600 text-white flex-1"
                      />
                      <Input
                        value={newCommand.command}
                        onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                        placeholder="Command syntax"
                        className="bg-slate-900 border-slate-600 text-white flex-[2]"
                      />
                      <Button size="sm" onClick={handleAddCommand} className="bg-cyan-600 hover:bg-cyan-500">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editConfig.commands.map((cmd, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-900 rounded">
                          <span className="text-xs text-slate-300 w-32 truncate">{cmd.name}</span>
                          <code className="text-xs text-cyan-400 flex-1 truncate">{cmd.command}</code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveCommand(index)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Listeners */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Listeners</h4>
                    <div className="flex gap-2">
                      <Input
                        value={newListener.name}
                        onChange={(e) => setNewListener({ ...newListener, name: e.target.value })}
                        placeholder="Listener name"
                        className="bg-slate-900 border-slate-600 text-white w-48"
                      />
                      <Textarea
                        value={newListener.config}
                        onChange={(e) => setNewListener({ ...newListener, config: e.target.value })}
                        placeholder="Listener configuration..."
                        className="bg-slate-900 border-slate-600 text-white flex-1 min-h-[60px]"
                      />
                      <Button size="sm" onClick={handleAddListener} className="bg-cyan-600 hover:bg-cyan-500">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editConfig.listeners.map((listener, index) => (
                        <div key={index} className="p-2 bg-slate-900 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-300">{listener.name}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveListener(index)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                          <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">{listener.config}</pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Notes</h4>
                    <Textarea
                      value={editConfig.notes}
                      onChange={(e) => setEditConfig({ ...editConfig, notes: e.target.value })}
                      placeholder="Additional notes, setup instructions, etc..."
                      className="bg-slate-900 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>
                </div>
              </ScrollArea>
            ) : selectedConfig ? (
              <Tabs defaultValue="connection" className="h-full flex flex-col">
                <TabsList className="mx-6 mt-4 bg-slate-800/50 border border-slate-700/50 flex-shrink-0">
                  <TabsTrigger value="connection" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                    <Server className="w-4 h-4 mr-2" />Connection
                  </TabsTrigger>
                  <TabsTrigger value="listeners" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                    <Radio className="w-4 h-4 mr-2" />Listeners
                  </TabsTrigger>
                  <TabsTrigger value="commands" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                    <Terminal className="w-4 h-4 mr-2" />Commands
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 min-h-0 px-6 pb-6">
                  <ScrollArea className="h-full mt-4">
                    <TabsContent value="connection" className="mt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{selectedConfig.name}</h3>
                          <p className="text-sm text-slate-400">{selectedConfig.description}</p>
                        </div>
                        <Button size="sm" onClick={() => handleEdit(selectedConfig)}>
                          Edit
                        </Button>
                      </div>

                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-slate-500">Server</span>
                            <p className="text-sm text-white">{selectedConfig.serverHost}:{selectedConfig.serverPort}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Protocol</span>
                            <p className="text-sm text-white uppercase">{selectedConfig.protocol}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Auth Type</span>
                            <p className="text-sm text-white capitalize">{selectedConfig.authType}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Username</span>
                            <p className="text-sm text-white">{selectedConfig.username || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {selectedConfig.notes && (
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <h4 className="text-sm font-semibold text-cyan-400 mb-2">Notes</h4>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedConfig.notes}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="listeners" className="mt-0 space-y-4">
                      {selectedConfig.listeners.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No listeners configured</p>
                      ) : (
                        selectedConfig.listeners.map((listener, index) => (
                          <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-cyan-400">{listener.name}</h4>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(listener.config, `listener-${index}`)} className="h-7 px-2">
                                {copiedField === `listener-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                              </Button>
                            </div>
                            <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">{listener.config}</pre>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="commands" className="mt-0">
                      {selectedConfig.commands.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No commands configured</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedConfig.commands.map((cmd, index) => (
                            <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(cmd.command, `cmd-${index}`)}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-300">{cmd.name}</span>
                                {copiedField === `cmd-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                              </div>
                              <code className="text-[11px] text-cyan-400 font-mono">{cmd.command}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </div>
              </Tabs>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a C2 configuration or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
