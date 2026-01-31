import { useState, useCallback, useEffect } from 'react';
import type { Profile, ProfileData, StoredProfile } from '@/types/profile';

const PROFILES_STORAGE_KEY = 'ctf-profiles';
const ACTIVE_PROFILE_KEY = 'ctf-active-profile';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Load profiles list on mount
  useEffect(() => {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredProfile[] = JSON.parse(stored);
        setProfiles(parsed.map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt })));
      } catch (e) {
        console.error('Failed to parse profiles:', e);
      }
    }

    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeId) {
      setActiveProfileId(activeId);
    }
  }, []);

  const getStoredProfiles = useCallback((): StoredProfile[] => {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  const saveStoredProfiles = useCallback((storedProfiles: StoredProfile[]) => {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(storedProfiles));
    setProfiles(storedProfiles.map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt })));
  }, []);

  const createProfile = useCallback((name: string, data: ProfileData): Profile => {
    const now = new Date().toISOString();
    const newProfile: StoredProfile = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
      data,
    };

    const storedProfiles = getStoredProfiles();
    storedProfiles.push(newProfile);
    saveStoredProfiles(storedProfiles);

    return { id: newProfile.id, name: newProfile.name, createdAt: newProfile.createdAt, updatedAt: newProfile.updatedAt };
  }, [getStoredProfiles, saveStoredProfiles]);

  const updateProfile = useCallback((id: string, data: ProfileData, newName?: string): boolean => {
    const storedProfiles = getStoredProfiles();
    const index = storedProfiles.findIndex(p => p.id === id);
    if (index === -1) return false;

    storedProfiles[index] = {
      ...storedProfiles[index],
      data,
      updatedAt: new Date().toISOString(),
      ...(newName && { name: newName }),
    };

    saveStoredProfiles(storedProfiles);
    return true;
  }, [getStoredProfiles, saveStoredProfiles]);

  const deleteProfile = useCallback((id: string): boolean => {
    const storedProfiles = getStoredProfiles();
    const filtered = storedProfiles.filter(p => p.id !== id);
    if (filtered.length === storedProfiles.length) return false;

    saveStoredProfiles(filtered);

    if (activeProfileId === id) {
      setActiveProfileId(null);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }

    return true;
  }, [getStoredProfiles, saveStoredProfiles, activeProfileId]);

  const loadProfile = useCallback((id: string): ProfileData | null => {
    const storedProfiles = getStoredProfiles();
    const profile = storedProfiles.find(p => p.id === id);
    if (!profile) return null;

    setActiveProfileId(id);
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);

    return profile.data;
  }, [getStoredProfiles]);

  const getActiveProfile = useCallback((): Profile | null => {
    if (!activeProfileId) return null;
    return profiles.find(p => p.id === activeProfileId) || null;
  }, [activeProfileId, profiles]);

  const renameProfile = useCallback((id: string, newName: string): boolean => {
    const storedProfiles = getStoredProfiles();
    const index = storedProfiles.findIndex(p => p.id === id);
    if (index === -1) return false;

    storedProfiles[index].name = newName;
    storedProfiles[index].updatedAt = new Date().toISOString();
    saveStoredProfiles(storedProfiles);
    return true;
  }, [getStoredProfiles, saveStoredProfiles]);

  return {
    profiles,
    activeProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    loadProfile,
    getActiveProfile,
    renameProfile,
    setActiveProfileId,
  };
}
