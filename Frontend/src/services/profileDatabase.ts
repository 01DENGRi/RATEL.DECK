// Profile Database Service
// Uses backend server for persistence via /loadProfile and /saveProfile endpoints
// Each profile is stored as a separate JSON file on the server
// Pattern matches CVE and CheatSheets database implementations exactly

import type { ProfileData } from "@/types/profile";

const BACKEND_URL = "http://localhost:3001";

export interface ProfileDatabaseResult {
  success: boolean;
  error?: string;
}

export interface ProfileLoadResult extends ProfileDatabaseResult {
  data?: ProfileData;
}

/**
 * Convert a human profile name to a safe filename key.
 * Example: "Machine 01" -> "machine-01"
 */
export const profileKeyFromName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Normalize profile data to ensure all optional fields have default values
 */
const normalizeProfileData = (data: Partial<ProfileData>): ProfileData => ({
  targets: data.targets || [],
  tasks: data.tasks || [],
  notes: data.notes || "",
  cheatSheets: data.cheatSheets || [],
});

/**
 * Save profile data to backend server
 * POST /saveProfile with { profileName, data }
 * Backend will ONLY overwrite existing file - returns NO_DATABASE if file doesn't exist
 * Matches the pattern used by CVE and CheatSheets
 */
export const saveProfileToServer = async (
  profileName: string,
  data: ProfileData
): Promise<ProfileDatabaseResult> => {
  try {
    const key = profileKeyFromName(profileName);
    console.log("[Profile] Saving to server:", key);
    const normalizedData = normalizeProfileData(data);

    const response = await fetch(`${BACKEND_URL}/saveProfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileName: key, data: normalizedData }),
    });

    if (response.status === 404) {
      return { success: false, error: "NO_DATABASE" };
    }

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    console.log("[Profile] Successfully saved to server");
    return { success: true };
  } catch (error) {
    console.error("[Profile] Failed to save to server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to server",
    };
  }
};

/**
 * Load profile data from backend server
 * GET /loadProfile?profileName=xxx
 * Returns NO_DATABASE if file doesn't exist
 * Matches the pattern used by CVE and CheatSheets
 */
export const loadProfileFromServer = async (
  profileName: string
): Promise<ProfileLoadResult> => {
  try {
    const key = profileKeyFromName(profileName);
    console.log("[Profile] Loading from server:", key);

    const response = await fetch(
      `${BACKEND_URL}/loadProfile?profileName=${encodeURIComponent(key)}`
    );

    if (response.status === 404) {
      return { success: false, error: "NO_DATABASE" };
    }

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[Profile] Successfully loaded from server");
    return { success: true, data: normalizeProfileData(data) };
  } catch (error) {
    console.error("[Profile] Failed to load from server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to server",
    };
  }
};

/**
 * Export profile data to a JSON file (download)
 * File name follows pattern: profile-<name>.json
 */
export const exportProfileToFile = (profileName: string, data: ProfileData): void => {
  const key = profileKeyFromName(profileName);
  const normalizedData = normalizeProfileData(data);
  const blob = new Blob([JSON.stringify(normalizedData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `profile-${key}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Import profile data from a JSON file
 */
export const importProfileFromFile = (
  file: File
): Promise<ProfileLoadResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);

        // Validate structure - must have at least one recognizable field
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          (!Array.isArray(parsed.targets) &&
            !Array.isArray(parsed.tasks) &&
            typeof parsed.notes !== "string" &&
            !Array.isArray(parsed.cheatSheets))
        ) {
          resolve({
            success: false,
            error: "Invalid profile format. Expected targets, tasks, notes, or cheatSheets.",
          });
          return;
        }

        resolve({ success: true, data: normalizeProfileData(parsed) });
      } catch {
        resolve({ success: false, error: "Invalid JSON file" });
      }
    };
    reader.onerror = () => resolve({ success: false, error: "Failed to read file" });
    reader.readAsText(file);
  });
};
