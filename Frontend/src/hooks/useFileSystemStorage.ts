// File System Access API Hook for persistent JSON file storage
// This allows reading/writing to a local JSON file chosen by the user

import { useState, useCallback, useEffect } from 'react';

export interface FileSystemStorageState {
  isSupported: boolean;
  isConnected: boolean;
  fileName: string | null;
  error: string | null;
}

export interface UseFileSystemStorageReturn<T> {
  state: FileSystemStorageState;
  data: T | null;
  pickFile: () => Promise<boolean>;
  createNewFile: () => Promise<boolean>;
  saveData: (data: T) => Promise<boolean>;
  disconnect: () => void;
}

// Check if File System Access API is supported
const isFileSystemAccessSupported = (): boolean => {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};

// Store file handle in memory (can't persist across sessions due to security)
let fileHandle: FileSystemFileHandle | null = null;

export function useFileSystemStorage<T>(
  storageKey: string,
  defaultData: T
): UseFileSystemStorageReturn<T> {
  const [state, setState] = useState<FileSystemStorageState>({
    isSupported: isFileSystemAccessSupported(),
    isConnected: false,
    fileName: null,
    error: null,
  });
  const [data, setData] = useState<T | null>(null);

  // Read data from file
  const readFromFile = useCallback(async (handle: FileSystemFileHandle): Promise<T | null> => {
    try {
      const file = await handle.getFile();
      const text = await file.text();
      if (!text.trim()) {
        return defaultData;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }, [defaultData]);

  // Write data to file
  const writeToFile = useCallback(async (handle: FileSystemFileHandle, content: T): Promise<boolean> => {
    try {
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(content, null, 2));
      await writable.close();
      return true;
    } catch (error) {
      console.error('Error writing to file:', error);
      setState(prev => ({ ...prev, error: 'Failed to save to file' }));
      return false;
    }
  }, []);

  // Pick an existing JSON file
  const pickFile = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'File System Access API not supported' }));
      return false;
    }

    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false,
      });

      fileHandle = handle;
      const fileData = await readFromFile(handle);
      
      if (fileData !== null) {
        setData(fileData);
        setState({
          isSupported: true,
          isConnected: true,
          fileName: handle.name,
          error: null,
        });
        
        // Store file name in localStorage for reference
        localStorage.setItem(`${storageKey}_fileName`, handle.name);
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error picking file:', error);
        setState(prev => ({ ...prev, error: 'Failed to open file' }));
      }
      return false;
    }
  }, [state.isSupported, readFromFile, storageKey]);

  // Create a new JSON file
  const createNewFile = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'File System Access API not supported' }));
      return false;
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'cve-database.json',
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      fileHandle = handle;
      
      // Write default data to new file
      const success = await writeToFile(handle, defaultData);
      
      if (success) {
        setData(defaultData);
        setState({
          isSupported: true,
          isConnected: true,
          fileName: handle.name,
          error: null,
        });
        
        localStorage.setItem(`${storageKey}_fileName`, handle.name);
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error creating file:', error);
        setState(prev => ({ ...prev, error: 'Failed to create file' }));
      }
      return false;
    }
  }, [state.isSupported, defaultData, writeToFile, storageKey]);

  // Save data to file
  const saveData = useCallback(async (newData: T): Promise<boolean> => {
    if (!fileHandle) {
      setState(prev => ({ ...prev, error: 'No file connected' }));
      return false;
    }

    const success = await writeToFile(fileHandle, newData);
    if (success) {
      setData(newData);
    }
    return success;
  }, [writeToFile]);

  // Disconnect from file
  const disconnect = useCallback(() => {
    fileHandle = null;
    setData(null);
    setState({
      isSupported: isFileSystemAccessSupported(),
      isConnected: false,
      fileName: null,
      error: null,
    });
    localStorage.removeItem(`${storageKey}_fileName`);
  }, [storageKey]);

  // Check for previously used file name on mount
  useEffect(() => {
    const savedFileName = localStorage.getItem(`${storageKey}_fileName`);
    if (savedFileName && state.isSupported) {
      // Note: We can't automatically reconnect due to security restrictions
      // User must re-pick the file after page refresh
      setState(prev => ({ 
        ...prev, 
        error: `Previously used: ${savedFileName}. Click "Open File" to reconnect.` 
      }));
    }
  }, [storageKey, state.isSupported]);

  return {
    state,
    data,
    pickFile,
    createNewFile,
    saveData,
    disconnect,
  };
}

// Utility to get current file handle (for use in other modules)
export const getFileHandle = (): FileSystemFileHandle | null => fileHandle;
export const setFileHandle = (handle: FileSystemFileHandle | null) => { fileHandle = handle; };
