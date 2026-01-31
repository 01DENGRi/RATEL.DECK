import { useState, useCallback, useRef, useEffect } from "react";
import type { Target, TargetTerminal, TargetTerminalSession, TerminalLine } from "@/types/ctf";

const STORAGE_KEY = "target-terminals";

export function useTargetTerminals() {
  const [terminals, setTerminals] = useState<TargetTerminal[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Map<string, TargetTerminalSession>>(new Map());
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTerminals(data.terminals || []);
        setActiveTerminalId(data.activeTerminalId || null);
        
        // Restore sessions (lines and history)
        const restoredSessions = new Map<string, TargetTerminalSession>();
        (data.terminals || []).forEach((terminal: TargetTerminal) => {
          const sessionData = data.sessions?.[terminal.id];
          restoredSessions.set(terminal.id, {
            terminal,
            lines: sessionData?.lines || [],
            commandHistory: sessionData?.commandHistory || [],
            isConnected: false, // Always start disconnected
          });
        });
        setSessions(restoredSessions);
      } catch (e) {
        console.error("Failed to load target terminals:", e);
      }
    }
  }, []);
  
  // Save to localStorage when terminals change
  useEffect(() => {
    const sessionsObj: Record<string, { lines: TerminalLine[]; commandHistory: string[] }> = {};
    sessions.forEach((session, id) => {
      sessionsObj[id] = {
        lines: session.lines.slice(-100), // Keep last 100 lines per terminal
        commandHistory: session.commandHistory.slice(-50), // Keep last 50 commands
      };
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      terminals,
      activeTerminalId,
      sessions: sessionsObj,
    }));
  }, [terminals, activeTerminalId, sessions]);

  // Create a new target terminal
  const createTargetTerminal = useCallback((target: Target, listenerContext?: string) => {
    const existingForTarget = terminals.filter(t => t.targetId === target.id);
    const terminalNumber = existingForTarget.length + 1;
    
    const newTerminal: TargetTerminal = {
      id: crypto.randomUUID(),
      targetId: target.id,
      targetHostname: target.hostname,
      targetIp: target.ip,
      displayName: terminalNumber === 1 
        ? target.hostname 
        : `${target.hostname} (${terminalNumber})`,
      listenerContext,
      createdAt: new Date().toISOString(),
    };
    
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(newTerminal.id);
    
    // Initialize session
    setSessions(prev => {
      const next = new Map(prev);
      next.set(newTerminal.id, {
        terminal: newTerminal,
        lines: [{
          id: crypto.randomUUID(),
          content: `[*] Target terminal for ${target.hostname} (${target.ip})`,
          type: "system",
          timestamp: Date.now(),
        }],
        commandHistory: [],
        isConnected: false,
      });
      return next;
    });
    
    return newTerminal;
  }, [terminals]);

  // Close a target terminal
  const closeTerminal = useCallback((terminalId: string) => {
    setTerminals(prev => prev.filter(t => t.id !== terminalId));
    setSessions(prev => {
      const next = new Map(prev);
      next.delete(terminalId);
      return next;
    });
    
    // If closing active terminal, switch to another
    if (activeTerminalId === terminalId) {
      setActiveTerminalId(prev => {
        const remaining = terminals.filter(t => t.id !== terminalId);
        return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      });
    }
  }, [activeTerminalId, terminals]);

  // Switch active terminal
  const switchToTerminal = useCallback((terminalId: string) => {
    setActiveTerminalId(terminalId);
  }, []);

  // Add line to terminal
  const addLine = useCallback((terminalId: string, content: string, type: TerminalLine["type"]) => {
    setSessions(prev => {
      const next = new Map(prev);
      const session = next.get(terminalId);
      if (session) {
        next.set(terminalId, {
          ...session,
          lines: [...session.lines, {
            id: crypto.randomUUID(),
            content,
            type,
            timestamp: Date.now(),
          }],
        });
      }
      return next;
    });
  }, []);

  // Add command to history
  const addToHistory = useCallback((terminalId: string, command: string) => {
    setSessions(prev => {
      const next = new Map(prev);
      const session = next.get(terminalId);
      if (session) {
        next.set(terminalId, {
          ...session,
          commandHistory: [...session.commandHistory, command],
        });
      }
      return next;
    });
  }, []);

  // Update connection status
  const setConnected = useCallback((terminalId: string, connected: boolean) => {
    setSessions(prev => {
      const next = new Map(prev);
      const session = next.get(terminalId);
      if (session) {
        next.set(terminalId, {
          ...session,
          isConnected: connected,
        });
      }
      return next;
    });
  }, []);

  // Clear terminal output
  const clearTerminal = useCallback((terminalId: string) => {
    setSessions(prev => {
      const next = new Map(prev);
      const session = next.get(terminalId);
      if (session) {
        next.set(terminalId, {
          ...session,
          lines: [{
            id: crypto.randomUUID(),
            content: "[*] Terminal cleared",
            type: "system",
            timestamp: Date.now(),
          }],
        });
      }
      return next;
    });
  }, []);

  // Get terminals for a specific target
  const getTerminalsForTarget = useCallback((targetId: string) => {
    return terminals.filter(t => t.targetId === targetId);
  }, [terminals]);

  // Get active session
  const activeSession = activeTerminalId ? sessions.get(activeTerminalId) : null;
  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  return {
    terminals,
    activeTerminalId,
    activeTerminal,
    activeSession,
    sessions,
    createTargetTerminal,
    closeTerminal,
    switchToTerminal,
    addLine,
    addToHistory,
    setConnected,
    clearTerminal,
    getTerminalsForTarget,
  };
}
