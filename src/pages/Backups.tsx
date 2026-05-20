import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  Upload, 
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  RefreshCw,
  Clock,
  HardDrive
} from 'lucide-react';
import { useDrive } from '../context/DriveContext';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';
import { convertToCSV } from '../utils/csv';
import type { BackupHistoryItem } from '../types';
import { getMockCollection } from '../utils/mockData';
import { collection, getDocs } from 'firebase/firestore';
import { db, IS_DEMO_MODE } from '../services/firebase';

type BackupTab = 'firestore' | 'csv' | 'source_code';

export const Backups: React.FC = () => {
  const { toast } = useToast();
  const { driveStatus, connectDrive, upload, uploadBackup, listBackups, deleteBackup } = useDrive();

  // Tab State
  const [activeTab, setActiveTab] = useState<BackupTab>('firestore');
  const [backups, setBackups] = useState<BackupHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Backup Trigger States
  const [backingUpJson, setBackingUpJson] = useState(false);
  const [backingUpCsv, setBackingUpCsv] = useState(false);
  const [uploadingSource, setUploadingSource] = useState(false);
  const [selectedSourceFile, setSelectedSourceFile] = useState<File | null>(null);

  // Deletion Confirm States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Backup files inside active category
  const fetchBackupHistory = async (tab: BackupTab) => {
    if (driveStatus !== 'connected') return;
    setLoadingHistory(true);
    try {
      const folderName = 
        tab === 'firestore' ? 'Firestore' : 
        tab === 'csv' ? 'CSV' : 'Source Code';
      
      const historyList = await listBackups(folderName);
      setBackups(historyList);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load backup history from Google Drive.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Trigger fetch when tab or Drive status changes
  useEffect(() => {
    fetchBackupHistory(activeTab);
  }, [activeTab, driveStatus]);

  // Direct helper to query Firestore raw collection (bypassing TanStack Query cache)
  const queryRawCollection = async (colName: string): Promise<any[]> => {
    if (IS_DEMO_MODE) {
      return getMockCollection(colName);
    }
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, colName));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn(`Failed to export raw collection ${colName}:`, e);
      return [];
    }
  };

  // FIRESTORE JSON BACKUP CREATION
  const handleCreateJsonBackup = async () => {
    if (driveStatus !== 'connected') {
      toast('Please connect your Google Drive first.', 'warning');
      return;
    }

    setBackingUpJson(true);
    try {
      toast('Gathering database collections...', 'info');
      
      // Export all collections
      const [students, teachers, courses, achievements, settings, admins] = await Promise.all([
        queryRawCollection('students'),
        queryRawCollection('teachers'),
        queryRawCollection('courses'),
        queryRawCollection('achievements'),
        queryRawCollection('settings'),
        queryRawCollection('admins')
      ]);

      const backupObj = {
        metadata: {
          academyName: settings[0]?.academyName || 'Zubair Online Academy',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          totalRecords: {
            students: students.length,
            teachers: teachers.length,
            courses: courses.length,
            achievements: achievements.length,
            admins: admins.length
          }
        },
        collections: {
          students,
          teachers,
          courses,
          achievements,
          settings,
          admins
        }
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `firestore_backup_${timestamp}.json`;

      toast('Uploading JSON file to Google Drive...', 'info');
      await uploadBackup(fileName, jsonStr, 'application/json', 'Firestore');
      toast('Firestore JSON backup generated and uploaded.', 'success');
      
      // Refresh active history
      fetchBackupHistory(activeTab);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to complete JSON backup.', 'error');
    } finally {
      setBackingUpJson(false);
    }
  };

  // STUDENTS & TEACHERS CSV BACKUP CREATION
  const handleCreateCsvBackup = async () => {
    if (driveStatus !== 'connected') {
      toast('Please connect your Google Drive first.', 'warning');
      return;
    }

    setBackingUpCsv(true);
    try {
      toast('Exporting Students & Teachers registry...', 'info');
      
      const studentsList = await queryRawCollection('students');
      const teachersList = await queryRawCollection('teachers');

      const dateStr = new Date().toISOString().split('T')[0];

      // Export students CSV
      const studentHeaders = [
        { key: 'fullName' as const, label: 'Full Name' },
        { key: 'email' as const, label: 'Email' },
        { key: 'whatsapp' as const, label: 'WhatsApp' },
        { key: 'country' as const, label: 'Country' },
        { key: 'course' as const, label: 'Course' },
        { key: 'status' as const, label: 'Status' },
        { key: 'createdAt' as const, label: 'Date Joined' }
      ];
      const studentsCsv = convertToCSV(studentsList, studentHeaders);
      const studentsFileName = `students_backup_${dateStr}.csv`;
      await uploadBackup(studentsFileName, studentsCsv, 'text/csv', 'CSV');

      // Export teachers CSV
      const teacherHeaders = [
        { key: 'fullName' as const, label: 'Full Name' },
        { key: 'email' as const, label: 'Email' },
        { key: 'whatsapp' as const, label: 'WhatsApp' },
        { key: 'country' as const, label: 'Country' },
        { key: 'qualification' as const, label: 'Qualification' },
        { key: 'experience' as const, label: 'Experience' },
        { key: 'status' as const, label: 'Status' },
        { key: 'createdAt' as const, label: 'Date Joined' }
      ];
      const teachersCsv = convertToCSV(teachersList, teacherHeaders);
      const teachersFileName = `teachers_backup_${dateStr}.csv`;
      await uploadBackup(teachersFileName, teachersCsv, 'text/csv', 'CSV');

      toast('CSV backups generated and uploaded to Google Drive.', 'success');
      fetchBackupHistory(activeTab);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to complete CSV backups.', 'error');
    } finally {
      setBackingUpCsv(false);
    }
  };

  // SOURCE CODE MANUAL ZIP UPLOAD
  const handleSourceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceFile) {
      toast('Please choose a file first.', 'warning');
      return;
    }

    setUploadingSource(true);
    try {
      toast('Uploading source code archive to Google Drive...', 'info');
      // Pass category 'Backups' and subfolder 'Source Code' to utilize the binary uploader!
      await upload(selectedSourceFile, 'Backups' as any, 'Source Code');
      
      // In Demo Mode, save to local storage history to show on backup list
      if (IS_DEMO_MODE) {
        const mockHistoryStr = localStorage.getItem('zoa_backups') || '[]';
        const list: BackupHistoryItem[] = JSON.parse(mockHistoryStr);
        const newItem: BackupHistoryItem = {
          id: 'demo_source_id_' + Math.random().toString(36).substr(2, 9),
          name: selectedSourceFile.name,
          size: selectedSourceFile.size,
          createdTime: new Date().toISOString(),
          mimeType: selectedSourceFile.type || 'application/zip',
          webViewLink: 'https://drive.google.com',
          webContentLink: 'https://drive.google.com',
          category: 'source_code'
        };
        list.unshift(newItem);
        localStorage.setItem('zoa_backups', JSON.stringify(list));
      }

      toast('Source code backup archived successfully.', 'success');
      setSelectedSourceFile(null);
      fetchBackupHistory(activeTab);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to archive source code.', 'error');
    } finally {
      setUploadingSource(false);
    }
  };

  // BACKUP DELETION
  const handleDeleteBackup = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteBackup(confirmDeleteId);
      toast('Backup file permanently deleted.', 'success');
      setBackups(prev => prev.filter(item => item.id !== confirmDeleteId));
    } catch (err) {
      toast('Failed to delete backup file.', 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const getFormatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Super Admin Controls</p>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">System Backups</h2>
      </div>

      {/* Google Drive Status Alert Box */}
      {driveStatus !== 'connected' ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-red-200/50 dark:border-red-950/40 bg-red-50/20 dark:bg-red-950/5 text-red-700 dark:text-red-400 text-xs">
          <div className="flex gap-3 leading-relaxed items-start">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <div className="space-y-1">
              <span className="font-bold">Google Drive Connection Required</span>
              <p>
                The backup dashboard writes files directly to Google Drive storage to allow database migrations and archives. Connect your Google account using the button below or settings.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 font-bold border-red-300 dark:border-red-900/50 hover:bg-red-100/30 text-red-700 dark:text-red-400"
            onClick={() => connectDrive().then(() => toast('Connected!', 'success'))}
          >
            Link Google Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Firestore Card Trigger */}
          <Card 
            title="Database Backup" 
            subtitle="Full metadata archive in JSON format"
            className="flex flex-col border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-900/10"
          >
            <div className="flex flex-col gap-4 flex-1 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-xs text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Collection schemas</span>
                  <span>Students, Tutors, Courses, Achievements, Logs</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateJsonBackup}
                isLoading={backingUpJson}
                className="w-full mt-4"
              >
                Generate JSON Backup
              </Button>
            </div>
          </Card>

          {/* CSV Card Trigger */}
          <Card 
            title="Directory Reports" 
            subtitle="Export registers as CSV datasets"
            className="flex flex-col border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-900/10"
          >
            <div className="flex flex-col gap-4 flex-1 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-xs text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">CSV Sheet Data</span>
                  <span>Independent sheets for Students and Teachers</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCsvBackup}
                isLoading={backingUpCsv}
                className="w-full mt-4"
              >
                Generate CSV Backups
              </Button>
            </div>
          </Card>

          {/* Source Code Archive Card */}
          <Card 
            title="Source Code Backup" 
            subtitle="Archive project file repositories"
            className="flex flex-col border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-900/10"
          >
            <form onSubmit={handleSourceUpload} className="flex flex-col gap-4 flex-1 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-slate-850 dark:text-slate-200 truncate cursor-pointer hover:underline">
                    {selectedSourceFile ? selectedSourceFile.name : 'Select repository ZIP...'}
                    <input 
                      type="file" 
                      accept=".zip,.rar,.tar,.gz" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setSelectedSourceFile(e.target.files[0]);
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">Zip file containing source codes</span>
                </div>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedSourceFile}
                isLoading={uploadingSource}
                className="w-full mt-4"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload Source ZIP
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* BACKUP HISTORY VIEW */}
      {driveStatus === 'connected' && (
        <Card className="flex flex-col mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 dark:border-slate-850/40 pb-4 mb-4 gap-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Google Drive History</h3>
            </div>
            
            {/* Tab switchers */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 self-start">
              {(['firestore', 'csv', 'source_code'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  {tab === 'source_code' ? 'Source Code' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Backup history list */}
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
              <span className="text-sm font-semibold">Listing files from Google Drive...</span>
            </div>
          ) : backups.length === 0 ? (
            <EmptyState
              title="No Backups Recorded"
              description={`There are currently no files recorded in the Zubair Online Academy/Backups/${activeTab === 'firestore' ? 'Firestore' : activeTab === 'csv' ? 'CSV' : 'Source Code'} folder.`}
              actionText="Sync History"
              onAction={() => fetchBackupHistory(activeTab)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850/60 pb-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">File Name</th>
                    <th className="pb-3 pr-4 font-semibold">Size</th>
                    <th className="pb-3 pr-4 font-semibold">Created Time</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850/30">
                  {backups.map((file) => (
                    <tr key={file.id} className="text-sm text-slate-600 dark:text-slate-350 hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                      <td className="py-3.5 pr-4 font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={file.name}>
                        {file.name}
                      </td>
                      <td className="py-3.5 pr-4 text-xs font-medium text-slate-500">
                        {getFormatSize(file.size)}
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(file.createdTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={file.webContentLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Download backup file"
                            className="p-1.5 rounded-lg border border-slate-100 hover:border-slate-250 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-green-600 dark:hover:text-green-455 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          
                          <button
                            onClick={() => setConfirmDeleteId(file.id)}
                            title="Delete backup file from Drive"
                            className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 dark:border-slate-800 dark:hover:border-red-900/30 bg-white dark:bg-slate-900 text-slate-450 hover:text-red-650 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteBackup}
        title="Delete Google Drive Backup File"
        description="Are you sure you want to permanently delete this backup file from Google Drive? This action is permanent and cannot be undone."
        confirmText="Delete Backup"
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
};
export default Backups;
