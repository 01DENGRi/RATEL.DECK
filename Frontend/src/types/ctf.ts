export type OSType = "Windows" | "Linux" | "macOS" | "Unknown" | string;

export type TicketType = "TGT" | "TGS" | "ADCS" | "Golden" | "Silver" | "Other";
export type HashType =
  | "NTLM"
  | "NTLMv2"
  | "LM"
  | "Kerberos"
  | "ASREP"
  | "SHA1"
  | "SHA256"
  | "MD5"
  | "NetNTLMv1"
  | "NetNTLMv2"
  | "Other";

export interface TargetColors {
  os: string;
  hostname: string;
  ip: string;
  credentials: string;
  tickets: string;
  hashes: string;
}

export type TaskCategory = "ports" | "service" | "host" | "exploit" | "privesc" | "other";

export type TaskStatus = "verified" | "low-priority" | "important" | "no-findings";

export interface Credential {
  id: string;
  username: string;
  password: string;
  note?: string;
}

export interface Ticket {
  id: string;
  type: TicketType;
  value: string;
  note?: string;
}

export interface Hash {
  id: string;
  type: HashType;
  value: string;
  note?: string;
}

export interface Target {
  id: string;
  os: OSType;
  customOs?: string;
  hostname: string;
  ip: string;
  credentials: Credential[];
  tickets?: Ticket[];
  hashes?: Hash[];
  color: string;
  colors?: TargetColors;
}

export interface CheatSheet {
  id: string;
  name: string;
  content: string;
  color: string;
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  important: boolean;
  category: TaskCategory;
  status: TaskStatus;
  details?: string;
  notes?: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
}

// Target-bound terminal types
export interface TargetTerminal {
  id: string;
  targetId: string;
  targetHostname: string;
  targetIp: string;
  displayName: string;
  listenerContext?: string; // Optional C2/listener context
  createdAt: string;
}

export interface TargetTerminalSession {
  terminal: TargetTerminal;
  lines: TerminalLine[];
  commandHistory: string[];
  isConnected: boolean;
}

export interface TerminalLine {
  id: string;
  content: string;
  type: "input" | "output" | "error" | "system";
  timestamp: number;
}
