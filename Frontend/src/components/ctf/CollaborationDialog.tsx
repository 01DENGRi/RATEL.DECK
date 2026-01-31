import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Terminal, Send, RefreshCw, Upload, Download, Play, Pause, Crosshair, Users, Mail, Globe } from "lucide-react";

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollaborationDialog({ open, onOpenChange }: CollaborationDialogProps) {
  const [activeTab, setActiveTab] = useState("cobalt-strike");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">C2 Framework Integration</DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Conceptual preview of future integrations with external offensive tools.
          </DialogDescription>
        </DialogHeader>

        {/* Global Under Development Warning */}
        <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg bg-red-950/50 border border-red-500/50 animate-pulse">
          <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">
            This Feature is Under Development
          </span>
          <span className="text-xs text-red-400/80">This is only a demo</span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="flex w-full gap-3 bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="cobalt-strike" 
              className="flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200
                bg-slate-900/50 border-slate-700 text-slate-400
                data-[state=active]:bg-red-950/40 data-[state=active]:border-red-500/60 
                data-[state=active]:text-red-300 data-[state=active]:shadow-[0_0_15px_rgba(239,68,68,0.15)]
                hover:border-red-500/40 hover:text-red-400"
            >
              <span className="flex items-center gap-2 justify-center">
                <Crosshair className="w-4 h-4" />
                <span className="font-medium">Cobalt Strike</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="metasploit"
              className="flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200
                bg-slate-900/50 border-slate-700 text-slate-400
                data-[state=active]:bg-purple-950/40 data-[state=active]:border-purple-500/60 
                data-[state=active]:text-purple-300 data-[state=active]:shadow-[0_0_15px_rgba(168,85,247,0.15)]
                hover:border-purple-500/40 hover:text-purple-400"
            >
              <span className="flex items-center gap-2 justify-center">
                <Terminal className="w-4 h-4" />
                <span className="font-medium">Metasploit</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="evilgophish"
              className="flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200
                bg-slate-900/50 border-slate-700 text-slate-400
                data-[state=active]:bg-amber-950/40 data-[state=active]:border-amber-500/60 
                data-[state=active]:text-amber-300 data-[state=active]:shadow-[0_0_15px_rgba(245,158,11,0.15)]
                hover:border-amber-500/40 hover:text-amber-400"
            >
              <span className="flex items-center gap-2 justify-center">
                <Mail className="w-4 h-4" />
                <span className="font-medium">Evilgophish</span>
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Cobalt Strike Tab */}
          <TabsContent value="cobalt-strike" className="mt-4 space-y-4">
            <CobaltStrikePanel />
          </TabsContent>

          {/* Metasploit Tab */}
          <TabsContent value="metasploit" className="mt-4 space-y-4">
            <MetasploitPanel />
          </TabsContent>

          {/* Evilgophish Tab */}
          <TabsContent value="evilgophish" className="mt-4 space-y-4">
            <EvilgophishPanel />
          </TabsContent>
        </Tabs>

        {/* Footer Note */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            This is a <span className="text-slate-400">conceptual preview</span> only. 
            No backend calls, no agent interaction, no real execution.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function CobaltStrikePanel() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed">
          This feature will allow <span className="text-red-400 font-medium">temporary session pivoting</span> to 
          Cobalt Strike for advanced operations (privilege escalation, evasion, pivoting), 
          then returning back here with the updated session.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Connection Settings */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Team Server Connection
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Team Server IP</Label>
              <Input 
                placeholder="10.10.10.5" 
                defaultValue="10.10.10.5"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Port</Label>
              <Input 
                placeholder="50050" 
                defaultValue="50050"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Password</Label>
              <Input 
                type="password"
                placeholder="••••••••" 
                defaultValue="password123"
                className="bg-slate-900 border-slate-700 text-slate-300"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Beacon Configuration */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <Crosshair className="w-4 h-4" /> Beacon Configuration
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Beacon ID</Label>
              <Input 
                placeholder="1234" 
                defaultValue="1234"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Listener</Label>
              <Input 
                placeholder="HTTPS-443" 
                defaultValue="HTTPS-443"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Sleep Time (ms)</Label>
              <Input 
                placeholder="60000" 
                defaultValue="60000"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Command Input/Output */}
      <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
        <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
          <Send className="w-4 h-4" /> Beacon Interaction
        </h4>
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs uppercase tracking-wider">Command</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="shell whoami" 
              defaultValue="shell whoami"
              className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm flex-1"
              disabled
            />
            <DemoButton icon={<Send className="w-4 h-4" />} label="Execute" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs uppercase tracking-wider">Output</Label>
          <Textarea 
            placeholder="Beacon output will appear here..."
            defaultValue={`[*] Tasked beacon to run: whoami
[+] host called home, sent: 48 bytes
[+] received output:
nt authority\\system`}
            className="bg-slate-950 border-slate-700 text-green-400 font-mono text-xs h-24 resize-none"
            disabled
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <DemoButton icon={<RefreshCw className="w-4 h-4" />} label="Sync Session" />
        <DemoButton icon={<Download className="w-4 h-4" />} label="Import Beacon" variant="primary" />
      </div>
    </div>
  );
}


function MetasploitPanel() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed">
          This feature will enable <span className="text-purple-400 font-medium">launching exploits and post-exploitation modules</span> in 
          Metasploit, then syncing the resulting session back into this platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Exploit Configuration */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Exploit Configuration
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Exploit Module</Label>
              <Input 
                placeholder="exploit/windows/smb/ms17_010_eternalblue" 
                defaultValue="exploit/windows/smb/ms17_010_eternalblue"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-xs"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">RHOSTS</Label>
              <Input 
                placeholder="10.10.10.2" 
                defaultValue="10.10.10.2"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">RPORT</Label>
              <Input 
                placeholder="445" 
                defaultValue="445"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Payload Configuration */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Payload Configuration
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Payload</Label>
              <Input 
                placeholder="windows/x64/meterpreter/reverse_tcp" 
                defaultValue="windows/x64/meterpreter/reverse_tcp"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-xs"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">LHOST</Label>
              <Input 
                placeholder="10.10.14.1" 
                defaultValue="10.10.14.1"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">LPORT</Label>
              <Input 
                placeholder="4444" 
                defaultValue="4444"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
        <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Metasploit Console
        </h4>
        <Textarea 
          placeholder="MSF console output..."
          defaultValue={`msf6 exploit(windows/smb/ms17_010_eternalblue) > exploit

[*] Started reverse TCP handler on 10.10.14.1:4444
[*] 10.10.10.2:445 - Connecting to target for exploitation.
[+] 10.10.10.2:445 - Connection established for exploitation.
[+] 10.10.10.2:445 - Target OS selected: Windows 7
[*] 10.10.10.2:445 - Sending exploit packet...
[*] Sending stage (200774 bytes) to 10.10.10.2
[*] Meterpreter session 1 opened at 2024-01-15 14:32:01

meterpreter > getuid
Server username: NT AUTHORITY\\SYSTEM`}
          className="bg-slate-950 border-slate-700 text-green-400 font-mono text-xs h-40 resize-none"
          disabled
        />
      </div>

      {/* Session Info & Actions */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-950/30 border border-purple-500/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-300">Session 1: Meterpreter</span>
          </div>
          <span className="text-xs text-slate-500">10.10.10.2 → NT AUTHORITY\SYSTEM</span>
        </div>
        <div className="flex gap-2">
          <DemoButton icon={<Play className="w-4 h-4" />} label="Run" size="sm" />
          <DemoButton icon={<RefreshCw className="w-4 h-4" />} label="Sync" size="sm" variant="primary" />
        </div>
      </div>
    </div>
  );
}


function EvilgophishPanel() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed">
          This feature will integrate <span className="text-amber-400 font-medium">Evilgophish to simulate phishing-based access</span> and 
          route resulting shells or sessions directly into a target terminal.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Campaign Settings */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Campaign Settings
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Campaign Name</Label>
              <Input 
                placeholder="htb-internal" 
                defaultValue="htb-internal"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Sender Email</Label>
              <Input 
                placeholder="support@corp-mail.com" 
                defaultValue="support@corp-mail.com"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Subject Line</Label>
              <Input 
                placeholder="Urgent: Password Reset Required" 
                defaultValue="Urgent: Password Reset Required"
                className="bg-slate-900 border-slate-700 text-slate-300 text-sm"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Landing Page Settings */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Landing Page
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Template</Label>
              <Input 
                placeholder="login-office365" 
                defaultValue="login-office365"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Phishing URL</Label>
              <Input 
                placeholder="https://login-microsoft.com/auth" 
                defaultValue="https://login-microsoft.com/auth"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-xs"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Redirect After</Label>
              <Input 
                placeholder="https://office.com" 
                defaultValue="https://office.com"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Listener & Payload */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Listener Configuration
          </h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Listener Port</Label>
              <Input 
                placeholder="4444" 
                defaultValue="4444"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Payload Type</Label>
              <Input 
                placeholder="reverse_shell" 
                defaultValue="reverse_shell"
                className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Target List */}
        <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> Target List
          </h4>
          <Textarea 
            placeholder="target@corp.com"
            defaultValue={`john.doe@megacorp.com
jane.smith@megacorp.com
admin@megacorp.com
hr.support@megacorp.com`}
            className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-xs h-20 resize-none"
            disabled
          />
        </div>
      </div>

      {/* Campaign Status */}
      <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
        <h4 className="text-sm font-semibold text-amber-400">Campaign Status</h4>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded bg-slate-800/50">
            <div className="text-2xl font-bold text-slate-300">4</div>
            <div className="text-xs text-slate-500">Emails Sent</div>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="text-2xl font-bold text-amber-400">2</div>
            <div className="text-xs text-slate-500">Opened</div>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="text-2xl font-bold text-green-400">1</div>
            <div className="text-xs text-slate-500">Clicked</div>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="text-2xl font-bold text-red-400">1</div>
            <div className="text-xs text-slate-500">Credentials</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <DemoButton icon={<Pause className="w-4 h-4" />} label="Pause Campaign" />
        <DemoButton icon={<Play className="w-4 h-4" />} label="Launch Campaign" variant="primary" />
      </div>
    </div>
  );
}


function DemoButton({ 
  icon, 
  label, 
  variant = "default",
  size = "default"
}: { 
  icon?: React.ReactNode; 
  label: string; 
  variant?: "default" | "primary";
  size?: "default" | "sm";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            disabled 
            className={`
              ${size === "sm" ? "px-2 py-1 text-xs h-7" : "px-3 py-1.5"}
              ${variant === "primary" 
                ? "bg-slate-700 text-slate-400 border-slate-600" 
                : "bg-slate-800 text-slate-500 border-slate-700"
              }
              cursor-not-allowed border
            `}
          >
            {icon}
            <span className={icon ? "ml-1.5" : ""}>{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-slate-300">
          <p className="text-xs">Demo only — no real execution</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
