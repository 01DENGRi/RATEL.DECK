import type { Target, Task } from "./ctf";
import type { CheatSheetData } from "@/data/cheatsheets";

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  targets: Target[];
  tasks: Task[];
  notes: string;
  cheatSheets: CheatSheetData[];
}

export interface StoredProfile extends Profile {
  data: ProfileData;
}
