import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, Plus, Bell, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TimeAlert {
  id: string;
  thresholdMinutes: number;
  message?: string;
  triggered: boolean;
}

interface TimeManagementProps {
  className?: string;
}

export function TimeManagement({ className = "" }: TimeManagementProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [alerts, setAlerts] = useState<TimeAlert[]>([]);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [newAlertMinutes, setNewAlertMinutes] = useState("30");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<TimeAlert | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved alerts and time from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem("time-management-alerts");
    const savedTime = localStorage.getItem("time-management-elapsed");
    const savedRunning = localStorage.getItem("time-management-running");
    
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error("Failed to load alerts", e);
      }
    }
    if (savedTime) {
      setElapsed(parseInt(savedTime, 10));
    }
    if (savedRunning === "true") {
      setIsRunning(true);
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem("time-management-alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Save elapsed time periodically
  useEffect(() => {
    localStorage.setItem("time-management-elapsed", elapsed.toString());
    localStorage.setItem("time-management-running", isRunning.toString());
  }, [elapsed, isRunning]);

  // Check alerts and auto-restart timer when threshold reached
  useEffect(() => {
    const elapsedMinutes = Math.floor(elapsed / 60);
    
    alerts.forEach((alert) => {
      if (!alert.triggered && elapsedMinutes >= alert.thresholdMinutes) {
        // Trigger alert
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, triggered: true } : a))
        );
        
        // Show notification popup
        setCurrentNotification(alert);
        setShowNotification(true);
        
        // Also show toast
        toast.info(alert.message || getDefaultMessage(alert.thresholdMinutes), {
          duration: 10000,
        });
        
        // Auto-restart: reset timer and mark alert as not triggered for next cycle
        setTimeout(() => {
          setElapsed(0);
          setAlerts((prev) =>
            prev.map((a) => ({ ...a, triggered: false }))
          );
        }, 500);
      }
    });
  }, [elapsed, alerts]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDefaultMessage = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`;
    return `You've spent ${timeStr} on this session.\nConsider taking a break or switching to another target to review the full environment.`;
  };

  const handleReset = () => {
    setElapsed(0);
    setIsRunning(false);
    // Reset triggered status for all alerts
    setAlerts((prev) => prev.map((a) => ({ ...a, triggered: false })));
  };

  const handleAddAlert = () => {
    const minutes = parseInt(newAlertMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error("Please enter a valid number of minutes");
      return;
    }

    const newAlert: TimeAlert = {
      id: crypto.randomUUID(),
      thresholdMinutes: minutes,
      message: newAlertMessage.trim() || undefined,
      triggered: false,
    };

    setAlerts((prev) => [...prev, newAlert].sort((a, b) => a.thresholdMinutes - b.thresholdMinutes));
    setNewAlertMinutes("30");
    setNewAlertMessage("");
    toast.success(`Alert set for ${minutes} minutes`);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const presetTimes = [15, 30, 60, 90, 120];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Timer className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold text-sidebar-foreground tracking-wide uppercase border-b-2 border-primary pb-1">
          Time Management
        </h2>
        <button
          onClick={() => setShowCustomizeDialog(true)}
          className="ml-2 p-1 rounded hover:bg-accent transition-colors"
          title="Customize alerts"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>

      {/* Timer Display */}
      <div
        className={`text-xl font-mono text-center py-2 rounded ${
          isRunning ? "text-success bg-success/10" : "text-foreground bg-muted/30"
        }`}
      >
        {formatTime(elapsed)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            isRunning
              ? "bg-warning/20 text-warning hover:bg-warning/30"
              : "bg-success/20 text-success hover:bg-success/30"
          }`}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          className="px-2 py-1.5 text-xs font-medium rounded bg-muted hover:bg-accent transition-colors text-muted-foreground"
          title="Reset timer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Alerts count indicator (minimal) */}
      {alerts.length > 0 && (
        <div className="text-center text-[10px] text-muted-foreground mt-1">
          {alerts.length} alert{alerts.length > 1 ? "s" : ""} configured
        </div>
      )}

      {/* Customize Dialog */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Time Alerts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preset Quick Add */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Add</Label>
              <div className="flex flex-wrap gap-1.5">
                {presetTimes.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setAlerts((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          thresholdMinutes: mins,
                          triggered: false,
                        },
                      ].sort((a, b) => a.thresholdMinutes - b.thresholdMinutes));
                      toast.success(`Alert set for ${mins} minutes`);
                    }}
                    className="px-2 py-1 text-xs rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Alert */}
            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-xs text-muted-foreground">Custom Alert</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Minutes</Label>
                  <Input
                    type="number"
                    value={newAlertMinutes}
                    onChange={(e) => setNewAlertMinutes(e.target.value)}
                    placeholder="30"
                    min="1"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Custom Message (optional)</Label>
                <Textarea
                  value={newAlertMessage}
                  onChange={(e) => setNewAlertMessage(e.target.value)}
                  placeholder="Leave empty for default message..."
                  className="text-sm min-h-[60px]"
                />
              </div>
              <Button onClick={handleAddAlert} size="sm" className="w-full">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Alert
              </Button>
            </div>

            {/* Current Alerts List */}
            {alerts.length > 0 && (
              <div className="border-t border-border pt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Active Alerts ({alerts.length})
                </Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                        alert.triggered ? "bg-success/10" : "bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bell className={`w-3 h-3 ${alert.triggered ? "text-success" : "text-primary"}`} />
                        <span>
                          {alert.thresholdMinutes >= 60
                            ? `${Math.floor(alert.thresholdMinutes / 60)}h ${alert.thresholdMinutes % 60}m`
                            : `${alert.thresholdMinutes}m`}
                        </span>
                        {alert.triggered && (
                          <span className="text-success text-[10px]">(triggered)</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-1 hover:bg-destructive/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Popup */}
      {showNotification && currentNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowNotification(false)}
          />
          <div className="relative bg-card border-2 border-primary rounded-lg shadow-2xl p-6 max-w-sm animate-slide-in">
            <button
              onClick={() => setShowNotification(false)}
              className="absolute top-2 right-2 p-1 hover:bg-accent rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Bell className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Time Alert
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {currentNotification.message || getDefaultMessage(currentNotification.thresholdMinutes)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => setShowNotification(false)}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
