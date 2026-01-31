import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Plus, ChevronRight, User, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import type { Profile, StoredProfile } from "@/types/profile";

const PROFILES_STORAGE_KEY = "ctf-profiles";
const ACTIVE_PROFILE_KEY = "ctf-active-profile";

const Login = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredProfile[] = JSON.parse(stored);
        setProfiles(parsed.map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt })));
      } catch (e) {
        console.error("Failed to parse profiles:", e);
      }
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProfileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    const existingProfiles: StoredProfile[] = stored ? JSON.parse(stored) : [];

    // Check for duplicate name
    if (existingProfiles.some(p => p.name.toLowerCase() === newProfileName.trim().toLowerCase())) {
      toast.error("A profile with this name already exists");
      return;
    }

    const now = new Date().toISOString();
    const newProfile: StoredProfile = {
      id: crypto.randomUUID(),
      name: newProfileName.trim(),
      createdAt: now,
      updatedAt: now,
      data: {
        targets: [],
        tasks: [],
        notes: "",
        cheatSheets: [],
      },
    };

    existingProfiles.push(newProfile);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(existingProfiles));
    
    // Set as active and enter
    localStorage.setItem(ACTIVE_PROFILE_KEY, newProfile.id);
    toast.success(`Profile "${newProfile.name}" created`);
    navigate("/dashboard");
  };

  const handleEnterProfile = (profileId: string) => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    const profile = profiles.find(p => p.id === profileId);
    toast.success(`Entering ${profile?.name || "profile"}`);
    navigate("/dashboard");
  };

  const handleDeleteProfile = (profileId: string) => {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!stored) return;

    const existingProfiles: StoredProfile[] = JSON.parse(stored);
    const filtered = existingProfiles.filter(p => p.id !== profileId);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(filtered));
    
    // Clear active if it was the deleted one
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeId === profileId) {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }

    setDeleteConfirmId(null);
    loadProfiles();
    toast.success("Profile deleted");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Logo & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background via-muted/20 to-background border-r border-primary/20 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* Animated Scan Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" 
               style={{ top: '30%', animationDuration: '3s' }} />
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse" 
               style={{ top: '60%', animationDuration: '4s', animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="mb-8 relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
            <img 
              src={logo} 
              alt="Ratel Deck Security" 
              className="w-48 h-48 object-contain relative z-10 drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
            />
          </div>

          {/* Company Name */}
          <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
            <span className="text-primary">RATEL</span> DECK
          </h1>
          <p className="text-lg text-muted-foreground mb-8 font-mono">
            PENTEST COMMAND CENTER
          </p>

          {/* Info */}
          <div className="text-center max-w-sm">
            <p className="text-sm text-muted-foreground">
              Each profile maintains its own isolated workspace with targets, tasks, notes, and cheat sheets.
            </p>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              v2.0 • PROFILE ISOLATION
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Profile Selection */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20 shadow-2xl shadow-primary/5 relative z-10">
          <CardContent className="p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <img 
                src={logo} 
                alt="Ratel Deck Security" 
                className="w-24 h-24 object-contain mb-4"
              />
              <h1 className="text-2xl font-bold">
                <span className="text-primary">RATEL</span> DECK
              </h1>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Select Profile</h2>
              <p className="text-sm text-muted-foreground">
                Choose an existing profile or create a new one
              </p>
            </div>

            {/* Profiles List */}
            {profiles.length > 0 && !showCreateForm && (
              <div className="space-y-4 mb-6">
                <Label className="text-sm font-medium text-muted-foreground">Your Profiles</Label>
                <ScrollArea className="h-[200px] rounded-lg border border-border/50">
                  <div className="p-2 space-y-2">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedProfileId === profile.id
                            ? "bg-primary/10 border-primary/50"
                            : "bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedProfileId(profile.id)}
                      >
                        {deleteConfirmId === profile.id ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-destructive">Delete this profile?</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProfile(profile.id);
                                }}
                              >
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                              >
                                No
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{profile.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(profile.updatedAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(profile.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Enter Button */}
                <Button
                  onClick={() => selectedProfileId && handleEnterProfile(selectedProfileId)}
                  disabled={!selectedProfileId}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base group"
                >
                  <div className="flex items-center gap-2">
                    Enter Profile
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full h-10 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Profile
                </Button>
              </div>
            )}

            {/* Create Form */}
            {(showCreateForm || profiles.length === 0) && (
              <form onSubmit={handleCreateProfile} className="space-y-6">
                {profiles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                    className="mb-2 -ml-2 text-muted-foreground"
                  >
                    ← Back to profiles
                  </Button>
                )}

                <div className="space-y-2">
                  <Label htmlFor="profileName" className="text-sm font-medium text-foreground">
                    Profile Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="profileName"
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Enter profile name (e.g., HTB Labs)"
                      className="pl-10 bg-background/50 border-primary/20 focus:border-primary/50 h-12"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will create an isolated workspace for your engagement
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base group"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create & Enter Profile
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              </form>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Each profile is completely isolated. Data from other profiles is never visible.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
