import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  loadGsiScript, 
  initTokenClient, 
  findOrCreateFolder, 
  uploadFile, 
  uploadTextFile, 
  listFilesInFolder, 
  deleteFile 
} from '../services/googleDrive';
import { useAuth } from './AuthContext';
import type { BackupHistoryItem } from '../types';

export type DriveStatus = 'disconnected' | 'connecting' | 'connected';

interface DriveContextType {
  driveStatus: DriveStatus;
  accessToken: string | null;
  connectDrive: (customClientId?: string) => Promise<string>;
  disconnectDrive: () => void;
  upload: (
    file: File, 
    category: 'Teachers' | 'Students' | 'Courses' | 'Achievements', 
    subfolderName?: string
  ) => Promise<{ id: string; url: string; folderId?: string; folderName?: string }>;
  uploadBackup: (
    fileName: string, 
    content: string, 
    mimeType: string, 
    subFolder: 'Firestore' | 'CSV' | 'Source Code'
  ) => Promise<{ id: string; url: string }>;
  listBackups: (subFolder: 'Firestore' | 'CSV' | 'Source Code') => Promise<BackupHistoryItem[]>;
  deleteBackup: (fileId: string) => Promise<void>;
  error: string | null;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export const DriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDemo } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Restore access token from session storage if it exists
  useEffect(() => {
    const savedToken = sessionStorage.getItem('zoa_drive_token');
    if (savedToken) {
      setAccessToken(savedToken);
      setDriveStatus('connected');
    }
  }, []);

  const connectDrive = async (customClientId?: string): Promise<string> => {
    setDriveStatus('connecting');
    setError(null);
    
    try {
      // 1. Load GSI script
      await loadGsiScript();
      
      // 2. Resolve Google Client ID.
      // In a real app, this is retrieved from the Settings Firestore collection or .env.
      const clientId = customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      
      if (!clientId && !isDemo) {
        throw new Error('Google Client ID is not configured. Please set it in Settings first.');
      }

      return new Promise<string>((resolve, reject) => {
        const client = initTokenClient(
          clientId,
          (token) => {
            setAccessToken(token);
            sessionStorage.setItem('zoa_drive_token', token);
            setDriveStatus('connected');
            resolve(token);
          },
          (err) => {
            console.error('Google authorization error:', err);
            setDriveStatus('disconnected');
            const errStr = err?.message || 'Google authentication failed or was cancelled.';
            setError(errStr);
            reject(new Error(errStr));
          }
        );
        
        if (client) {
          client.requestAccessToken();
        } else {
          setDriveStatus('disconnected');
          reject(new Error('Failed to initialize Google Identity client.'));
        }
      });
    } catch (err: any) {
      console.error('Failed to connect Google Drive:', err);
      setDriveStatus('disconnected');
      setError(err.message || 'Failed to connect');
      throw err;
    }
  };

  const disconnectDrive = () => {
    setAccessToken(null);
    sessionStorage.removeItem('zoa_drive_token');
    setDriveStatus('disconnected');
    setError(null);
  };

  /**
   * Internal helper to traverse or create the Zubair Online Academy folder tree.
   * Root (Zubair Online Academy) -> Category (Teachers, Students, etc.) -> Subfolder (optional)
   */
  const getDestinationFolderId = async (
    token: string,
    category: 'Teachers' | 'Students' | 'Courses' | 'Achievements' | 'Backups',
    subfolderName?: string
  ): Promise<{ folderId: string; folderName: string }> => {
    if (isDemo) {
      return {
        folderId: `demo_${category.toLowerCase()}_folder_id`,
        folderName: subfolderName || category
      };
    }

    // 1. Get/Create Root Folder: "Zubair Online Academy"
    const configuredFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';
    let rootId = configuredFolderId;
    let categoryId: string;

    try {
      if (rootId) {
        // Try creating/finding the category folder using the configured rootId
        categoryId = await findOrCreateFolder(category, rootId, token);
      } else {
        // Find or create "Zubair Online Academy" under root, then the category under it
        rootId = await findOrCreateFolder('Zubair Online Academy', 'root', token);
        categoryId = await findOrCreateFolder(category, rootId, token);
      }
    } catch (err: any) {
      // If we used a configured folder ID and it was invalid or deleted (causing a 404/NotFound error),
      // fallback to locating or creating "Zubair Online Academy" folder in Google Drive's root.
      const errMsg = err?.message || '';
      const isNotFoundError = errMsg.includes('404') || errMsg.toLowerCase().includes('notfound') || errMsg.toLowerCase().includes('file not found');
      
      if (configuredFolderId && isNotFoundError) {
        console.warn(`Configured folder ID ${configuredFolderId} is invalid or inaccessible. Falling back to 'Zubair Online Academy' search under root.`, err);
        rootId = await findOrCreateFolder('Zubair Online Academy', 'root', token);
        categoryId = await findOrCreateFolder(category, rootId, token);
      } else {
        throw err;
      }
    }
    
    // 3. Get/Create Subfolder: (e.g. "muhammad_hashim_2026" under "Teachers")
    if (subfolderName) {
      const subFolderId = await findOrCreateFolder(subfolderName, categoryId, token);
      return { folderId: subFolderId, folderName: subfolderName };
    }
    
    return { folderId: categoryId, folderName: category };
  };

  /**
   * Uploads profile pictures, CVs, or ID proofs to the corresponding Google Drive directory structure.
   */
  const upload = async (
    file: File, 
    category: 'Teachers' | 'Students' | 'Courses' | 'Achievements', 
    subfolderName?: string
  ): Promise<{ id: string; url: string; folderId?: string; folderName?: string }> => {
    let activeToken = accessToken;
    
    // Auto-prompt to connect if token is missing
    if (!activeToken) {
      activeToken = await connectDrive();
    }

    try {
      // Resolve folder
      const { folderId, folderName } = await getDestinationFolderId(activeToken, category, subfolderName);
      
      // Upload file
      const fileData = await uploadFile(file, folderId, activeToken);
      
      return {
        id: fileData.id,
        url: fileData.webContentLink, // download URL
        folderId: subfolderName ? folderId : undefined,
        folderName: subfolderName ? folderName : undefined
      };
    } catch (err: any) {
      console.error(`Google Drive upload failed for ${category}:`, err);
      // If token expired, clear it and throw
      if (err.message && (err.message.includes('401') || err.message.includes('unauthorized'))) {
        disconnectDrive();
        throw new Error('Google connection expired. Please reconnect to Google Drive and try again.');
      }
      throw err;
    }
  };

  /**
   * Uploads text data (Firestore JSON or CSV export) to Backups.
   */
  const uploadBackup = async (
    fileName: string, 
    content: string, 
    mimeType: string, 
    subFolder: 'Firestore' | 'CSV' | 'Source Code'
  ): Promise<{ id: string; url: string }> => {
    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await connectDrive();
    }

    try {
      // Root -> Backups
      const { folderId: backupsId } = await getDestinationFolderId(activeToken, 'Backups');
      
      // Backups -> Subfolder (Firestore, CSV, Source Code)
      const subFolderId = await findOrCreateFolder(subFolder, backupsId, activeToken);
      
      // Upload
      const fileData = await uploadTextFile(fileName, content, mimeType, subFolderId, activeToken);
      
      // In Demo Mode, save to local storage history to show on backup list
      if (isDemo) {
        const mockHistoryStr = localStorage.getItem('zoa_backups') || '[]';
        const list: BackupHistoryItem[] = JSON.parse(mockHistoryStr);
        const newItem: BackupHistoryItem = {
          id: fileData.id,
          name: fileName,
          size: content.length, // approximation
          createdTime: new Date().toISOString(),
          mimeType,
          webViewLink: fileData.webViewLink,
          webContentLink: fileData.webViewLink,
          category: subFolder.toLowerCase().replace(' ', '_') as any
        };
        list.unshift(newItem);
        localStorage.setItem('zoa_backups', JSON.stringify(list));
      }

      return {
        id: fileData.id,
        url: fileData.webViewLink
      };
    } catch (err: any) {
      console.error(`Google Drive backup failed for ${subFolder}:`, err);
      if (err.message && (err.message.includes('401') || err.message.includes('unauthorized'))) {
        disconnectDrive();
        throw new Error('Google connection expired. Please reconnect to Google Drive and try again.');
      }
      throw err;
    }
  };

  /**
   * Lists backup files in a category subfolder.
   */
  const listBackups = async (subFolder: 'Firestore' | 'CSV' | 'Source Code'): Promise<BackupHistoryItem[]> => {
    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await connectDrive();
    }

    try {
      const { folderId: backupsId } = await getDestinationFolderId(activeToken, 'Backups');
      const subFolderId = await findOrCreateFolder(subFolder, backupsId, activeToken);
      
      const mappedCategory = subFolder.toLowerCase().replace(' ', '_') as any;
      return await listFilesInFolder(subFolderId, mappedCategory, activeToken);
    } catch (err: any) {
      console.error(`Listing backups failed for ${subFolder}:`, err);
      if (err.message && (err.message.includes('401') || err.message.includes('unauthorized'))) {
        disconnectDrive();
        throw new Error('Google connection expired. Please reconnect to Google Drive and try again.');
      }
      throw err;
    }
  };

  /**
   * Deletes a backup file by ID.
   */
  const deleteBackup = async (fileId: string): Promise<void> => {
    let activeToken = accessToken;
    if (!activeToken) {
      activeToken = await connectDrive();
    }

    try {
      await deleteFile(fileId, activeToken);
    } catch (err: any) {
      console.error('Failed to delete file from Google Drive:', err);
      if (err.message && (err.message.includes('401') || err.message.includes('unauthorized'))) {
        disconnectDrive();
        throw new Error('Google connection expired. Please reconnect to Google Drive and try again.');
      }
      throw err;
    }
  };

  return (
    <DriveContext.Provider value={{
      driveStatus,
      accessToken,
      connectDrive,
      disconnectDrive,
      upload,
      uploadBackup,
      listBackups,
      deleteBackup,
      error
    }}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
};
