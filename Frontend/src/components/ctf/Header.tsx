import { Network, Shield, Bug, Route, Server, User, Lock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollaborationDialog } from "./CollaborationDialog";

interface VPNStatus {
  isConnected: boolean;
  isConnecting: boolean;
  ipAddress: string | null;
}

interface HeaderProps {
  onOpenNetworkMap?: () => void;
  onOpenVPN?: () => void;
  onOpenCVE?: () => void;
  onOpenTunneling?: () => void;
  onOpenHTTPServer?: () => void;
  onOpenProfiles?: () => void;
  isNetworkMapOpen?: boolean;
  vpnStatus?: VPNStatus;
  httpServerRunning?: boolean;
  tunnelingActive?: boolean;
  activeProfileName?: string | null;
}

export function Header({
  onOpenNetworkMap,
  onOpenVPN,
  onOpenCVE,
  onOpenTunneling,
  onOpenHTTPServer,
  onOpenProfiles,
  isNetworkMapOpen = false,
  vpnStatus = { isConnected: false, isConnecting: false, ipAddress: null },
  httpServerRunning = false,
  tunnelingActive = false,
  activeProfileName = null,
}: HeaderProps) {
  const navigate = useNavigate();
  const [collaborationOpen, setCollaborationOpen] = useState(false);

  const handleLockApp = () => {
    localStorage.removeItem("ctf-active-profile");
    navigate("/");
  };

  const getVPNStatusColor = () => {
    if (vpnStatus.isConnected) return "bg-emerald-500 shadow-emerald-500/50";
    if (vpnStatus.isConnecting) return "bg-amber-500 shadow-amber-500/50 animate-pulse";
    return "bg-red-500/80";
  };

  const getStatusDot = (isActive: boolean) =>
    isActive ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-red-500/70";

  return (
    <header className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b-2 border-cyan-500/40 shadow-[0_4px_30px_rgba(6,182,212,0.15)]">
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          
          {/* Left: Clean Text Branding */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white tracking-tight">RATEL</span>
                <span className="text-xl font-bold text-cyan-400 tracking-tight">.DECK</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-[0.15em] uppercase">Cyber Operations Platform</span>
            </div>
          </div>

          {/* Center: Collaboration Button */}
          <div className="hidden md:flex items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCollaborationOpen(true)}
              className="bg-purple-950/40 border-purple-500/40 hover:border-purple-400 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200"
            >
              <Users className="w-4 h-4 mr-2" />
              Collaboration
            </Button>
          </div>

          {/* Right: Action Toolbar */}
          <div className="flex items-center gap-1">
            
            {/* Profile Button */}
            <button 
              onClick={onOpenProfiles} 
              className="group flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-200"
              title="Profiles"
            >
              <User className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="hidden sm:inline text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                {activeProfileName || "Profile"}
              </span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-700/50 mx-1" />

            {/* VPN */}
            <button 
              onClick={onOpenVPN} 
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all duration-200"
              title="VPN"
            >
              <div className={`w-2 h-2 rounded-full ${getVPNStatusColor()} transition-all`} />
              <Shield className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              <span className="hidden md:inline text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">VPN</span>
              {vpnStatus.isConnected && vpnStatus.ipAddress && (
                <span className="hidden lg:inline text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {vpnStatus.ipAddress}
                </span>
              )}
            </button>

            {/* CVE */}
            <button 
              onClick={onOpenCVE} 
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-amber-500/40 hover:bg-slate-800/80 transition-all duration-200"
              title="CVE Checker"
            >
              <Bug className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
              <span className="hidden md:inline text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">CVE</span>
            </button>

            {/* Server (HTTP) */}
            <button 
              onClick={onOpenHTTPServer} 
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all duration-200"
              title="Server"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusDot(httpServerRunning)} transition-all`} />
              <Server className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="hidden md:inline text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Server</span>
            </button>

            {/* Tunneling */}
            <button 
              onClick={onOpenTunneling} 
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-purple-500/40 hover:bg-slate-800/80 transition-all duration-200"
              title="Tunneling"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusDot(tunnelingActive)} transition-all`} />
              <Route className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span className="hidden md:inline text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Tunnel</span>
            </button>

            {/* Network Map */}
            <button 
              onClick={onOpenNetworkMap} 
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all duration-200"
              title="Network Map"
            >
              <Network className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="hidden md:inline text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Map</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-700/50 mx-1" />

            {/* Lock Button - Prominent */}
            <button 
              onClick={handleLockApp} 
              className="group flex items-center gap-2 px-3 py-2 rounded-md bg-red-950/40 border border-red-500/30 hover:border-red-500/70 hover:bg-red-900/40 transition-all duration-200"
              title="Lock Application"
            >
              <Lock className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="hidden sm:inline text-xs font-semibold text-red-400 group-hover:text-red-300 transition-colors uppercase tracking-wide">Lock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Collaboration Dialog */}
      <CollaborationDialog open={collaborationOpen} onOpenChange={setCollaborationOpen} />
    </header>
  );
}