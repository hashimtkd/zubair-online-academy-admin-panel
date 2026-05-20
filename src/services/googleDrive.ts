import { IS_DEMO_MODE } from './firebase';
import type { BackupHistoryItem } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Dynamically loads the Google Identity Services (GSI) script.
 */
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load Google GSI script: ' + err));
    document.head.appendChild(script);
  });
}

/**
 * Initiates the GIS token client to request an access token.
 */
export function initTokenClient(
  clientId: string,
  onTokenReceived: (accessToken: string) => void,
  onError: (err: any) => void
): any {
  if (IS_DEMO_MODE) {
    // Return a dummy client in Demo Mode
    return {
      requestAccessToken: () => {
        console.log('Demo Mode: Simulating Google login and generating token.');
        onTokenReceived('demo_google_access_token_' + Date.now());
      }
    };
  }

  if (!window.google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services SDK is not loaded.'));
    return null;
  }

  try {
    return window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          onError(response);
        } else if (response.access_token) {
          onTokenReceived(response.access_token);
        }
      },
    });
  } catch (error) {
    onError(error);
    return null;
  }
}

/**
 * Helper to check response and throw HTTP errors.
 */
async function checkResponse(res: Response, message: string) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${message}: ${res.statusText} (${res.status}) - ${text}`);
  }
  return res.json();
}

/**
 * Search for a folder by name under a parent directory.
 */
export async function findFolder(
  folderName: string,
  parentId: string = 'root',
  accessToken: string
): Promise<string | null> {
  if (IS_DEMO_MODE) return 'demo_folder_id_' + folderName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await checkResponse(res, 'Find folder failed');
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

/**
 * Create a folder in Google Drive under a parent directory.
 */
export async function createFolder(
  folderName: string,
  parentId: string = 'root',
  accessToken: string
): Promise<string> {
  if (IS_DEMO_MODE) return 'demo_folder_id_' + folderName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId === 'root' ? [] : [parentId]
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  const data = await checkResponse(res, 'Create folder failed');
  return data.id;
}

/**
 * Retrieve a folder ID or create it if it does not exist.
 */
export async function findOrCreateFolder(
  folderName: string,
  parentId: string = 'root',
  accessToken: string
): Promise<string> {
  const existingId = await findFolder(folderName, parentId, accessToken);
  if (existingId) return existingId;
  return createFolder(folderName, parentId, accessToken);
}

/**
 * Grants public read permissions to a Google Drive file.
 */
export async function makeFilePublic(fileId: string, accessToken: string): Promise<void> {
  if (IS_DEMO_MODE) return;

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });
  
  await checkResponse(res, 'Make file public failed');
}

/**
 * Uploads a file (blob) to Google Drive.
 */
export async function uploadFile(
  file: File,
  folderId: string,
  accessToken: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  if (IS_DEMO_MODE) {
    const fileId = 'demo_file_id_' + Math.random().toString(36).substr(2, 9);
    // Return direct link or unsplash placeholder for demo compatibility
    const demoUrl = file.type.startsWith('image/') 
      ? 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600'
      : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    return {
      id: fileId,
      webViewLink: demoUrl,
      webContentLink: demoUrl
    };
  }

  // Create multipart/form-data payload
  const metadata = {
    name: file.name,
    parents: [folderId]
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  });

  const data = await checkResponse(res, 'Upload file failed');
  
  // Make the file public-read so it can be previewed/downloaded directly
  try {
    await makeFilePublic(data.id, accessToken);
  } catch (err) {
    console.warn('Could not set public permissions on file ' + data.id, err);
  }

  const isImage = file.type.startsWith('image/');
  const webContentLink = isImage 
    ? `https://lh3.googleusercontent.com/d/${data.id}` 
    : (data.webContentLink || `https://drive.google.com/uc?id=${data.id}&export=download`);

  return {
    id: data.id,
    // Google Drive webContentLink is a direct download link.
    // For images, we can construct the thumbnail URL or direct link for embedding.
    webViewLink: data.webViewLink,
    webContentLink
  };
}

/**
 * Uploads text/data (e.g. JSON backups, CSV exports) directly as a file.
 */
export async function uploadTextFile(
  fileName: string,
  content: string,
  mimeType: string,
  folderId: string,
  accessToken: string
): Promise<{ id: string; webViewLink: string }> {
  if (IS_DEMO_MODE) {
    const fileId = 'demo_backup_id_' + Math.random().toString(36).substr(2, 9);
    return {
      id: fileId,
      webViewLink: 'https://drive.google.com/file/d/' + fileId
    };
  }

  const metadata = {
    name: fileName,
    parents: [folderId]
  };

  const fileBlob = new Blob([content], { type: mimeType });
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', fileBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  });

  const data = await checkResponse(res, 'Upload backup file failed');
  
  try {
    await makeFilePublic(data.id, accessToken);
  } catch (err) {
    console.warn('Could not make backup file public ' + data.id, err);
  }

  return {
    id: data.id,
    webViewLink: data.webViewLink
  };
}

/**
 * Lists files in a specific Google Drive folder.
 */
export async function listFilesInFolder(
  folderId: string,
  category: 'firestore' | 'csv' | 'source_code',
  accessToken: string
): Promise<BackupHistoryItem[]> {
  if (IS_DEMO_MODE) {
    // Load from local storage history for simulation
    const mockHistoryStr = localStorage.getItem('zoa_backups') || '[]';
    const list: any[] = JSON.parse(mockHistoryStr);
    return list.filter(item => item.category === category);
  }

  const query = `'${folderId}' in parents and trashed = false`;
  const fields = 'files(id,name,size,createdTime,mimeType,webViewLink,webContentLink)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime%20desc&fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const data = await checkResponse(res, 'List backup files failed');
  
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    size: parseInt(file.size || '0'),
    createdTime: file.createdTime,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`,
    category
  }));
}

/**
 * Deletes a file in Google Drive.
 */
export async function deleteFile(fileId: string, accessToken: string): Promise<void> {
  if (IS_DEMO_MODE) {
    // Delete from mock backup history if it exists there
    const mockHistoryStr = localStorage.getItem('zoa_backups') || '[]';
    let list: any[] = JSON.parse(mockHistoryStr);
    list = list.filter(item => item.id !== fileId);
    localStorage.setItem('zoa_backups', JSON.stringify(list));
    return;
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Delete file failed: ${res.statusText} (${res.status}) - ${text}`);
  }
}

/**
 * Formats a Google Drive URL into a direct preview image URL that works in <img> tags without cookies.
 */
export function getGoogleDriveImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  if (url.includes('lh3.googleusercontent.com') || url.includes('drive.google.com/thumbnail')) {
    return url;
  }

  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return url;
}
