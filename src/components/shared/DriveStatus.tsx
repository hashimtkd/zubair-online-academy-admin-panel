import React, { useState } from 'react';
import { Cloud, CloudOff, Unlink, RefreshCw } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { useAcademySettings } from '../../hooks/useFirestore';
import { useToast } from '../ui/Toast';

export const DriveStatus: React.FC = () => {
  const { driveStatus, connectDrive, disconnectDrive, error } = useDrive();
  const { settings } = useAcademySettings();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const handleConnect = async () => {
    setIsLinking(true);
    try {
      const clientId = settings?.googleClientId;
      await connectDrive(clientId);
      toast('Google Drive linked successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to authorize Google Drive.', 'error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive();
    toast('Google Drive link disconnected.', 'info');
  };

  if (driveStatus === 'connected') {
    return (
      <div className="flex items-center gap-2 group relative">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-200/50 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
          <Cloud className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-xs font-semibold hidden md:inline">Drive Connected</span>
        </div>
        
        {/* Quick disconnect hover tooltip action */}
        <button
          onClick={handleDisconnect}
          title="Disconnect Google Account"
          className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <Unlink className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (driveStatus === 'connecting' || isLinking) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-200/50 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400">
        <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
        <span className="text-xs font-semibold hidden md:inline">Connecting Drive...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      title={error || 'Authorize Google Drive for uploads & backups'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-xs transition-all cursor-pointer font-medium text-xs focus:outline-none"
    >
      <CloudOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span>Link Google Drive</span>
    </button>
  );
};
export default DriveStatus;
