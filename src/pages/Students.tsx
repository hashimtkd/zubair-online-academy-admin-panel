import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  Check, 
  X as CloseIcon, 
  Eye, 
  ExternalLink,
  Smartphone,
  Mail,
  MapPin,
  Calendar,
  FolderOpen,
  Plus,
  Upload,
  AlertCircle
} from 'lucide-react';
import { 
  useCollectionQuery, 
  useUpdateMutation, 
  useDeleteMutation, 
  useBulkDeleteMutation,
  useAddMutation
} from '../hooks/useFirestore';
import type { Student, Course } from '../types';
import { useDrive } from '../context/DriveContext';
import { getGoogleDriveImageUrl } from '../services/googleDrive';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';
import { convertToCSV, downloadCSV } from '../utils/csv';
import { useToast } from '../components/ui/Toast';

export const Students: React.FC = () => {
  const { toast } = useToast();
  
  // Queries & Mutations
  const { data: students = [], isLoading } = useCollectionQuery<Student>('students');
  const { data: courses = [] } = useCollectionQuery<Course>('courses');
  const { upload, driveStatus } = useDrive();

  const addMutation = useAddMutation<Student>('students');
  const updateMutation = useUpdateMutation('students');
  const deleteMutation = useDeleteMutation('students');
  const bulkDeleteMutation = useBulkDeleteMutation('students');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal & Confirm States
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Add Student Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');
  const [course, setCourse] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setWhatsapp('');
    setCountry('');
    setCourse('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setIdProofFile(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !whatsapp || !country || !course) {
      toast('All text fields are required.', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      let photoUrl = '';
      let photoFileId = '';
      let idProofUrl = '';
      let idProofFileId = '';
      let driveFolderId = '';
      let driveFolderName = '';

      const formatSubfolderName = (name: string) => {
        return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + '_' + new Date().getFullYear();
      };
      const subfolderName = formatSubfolderName(fullName);

      // 1. Upload Photo to Drive if provided
      if (photoFile) {
        const photoResult = await upload(photoFile, 'Students', subfolderName);
        photoUrl = photoResult.url;
        photoFileId = photoResult.id;
        driveFolderId = photoResult.folderId || '';
        driveFolderName = photoResult.folderName || '';
      }

      // 2. Upload ID Proof to Drive if provided
      if (idProofFile) {
        const idResult = await upload(idProofFile, 'Students', subfolderName);
        idProofUrl = idResult.url;
        idProofFileId = idResult.id;
        if (!driveFolderId) {
          driveFolderId = idResult.folderId || '';
          driveFolderName = idResult.folderName || '';
        }
      }

      // Default placeholders if files are omitted
      if (!photoUrl) {
        photoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
      }

      const newStudentData = {
        fullName,
        email,
        whatsapp,
        country,
        course,
        photoUrl,
        photoFileId,
        idProofUrl,
        idProofFileId,
        driveFolderId,
        driveFolderName,
        status: 'approved' as const,
        createdAt: new Date().toISOString()
      };

      await addMutation.mutateAsync(newStudentData);
      toast('Student profile added successfully.', 'success');
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to save student profile.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Sorting
  const sortedStudents = [...students].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter Logic
  const filteredStudents = sortedStudents.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.whatsapp.includes(searchTerm) ||
      s.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Status Handlers
  const triggerStatusAction = (id: string, type: 'approve' | 'reject') => {
    setActioningId(id);
    setActionType(type);
  };

  const confirmStatusAction = async () => {
    if (!actioningId || !actionType) return;
    const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
    
    try {
      await updateMutation.mutateAsync({
        id: actioningId,
        data: { status: newStatus }
      });
      toast(`Student registration ${newStatus} successfully.`, 'success');
      
      // Update local viewing object if open
      if (viewingStudent && viewingStudent.id === actioningId) {
        setViewingStudent(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      toast('Failed to update student status.', 'error');
    } finally {
      setActioningId(null);
      setActionType(null);
    }
  };

  // Delete Handlers
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast('Student deleted successfully.', 'success');
      setSelectedIds(prev => prev.filter(id => id !== confirmDeleteId));
      if (viewingStudent?.id === confirmDeleteId) setViewingStudent(null);
    } catch (err) {
      toast('Failed to delete student.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      toast(`${selectedIds.length} students deleted successfully.`, 'success');
      setSelectedIds([]);
    } catch (err) {
      toast('Failed to execute bulk delete.', 'error');
    } finally {
      setConfirmBulkDelete(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      toast('No data to export.', 'warning');
      return;
    }
    
    const headers = [
      { key: 'fullName' as const, label: 'Full Name' },
      { key: 'email' as const, label: 'Email' },
      { key: 'whatsapp' as const, label: 'WhatsApp' },
      { key: 'country' as const, label: 'Country' },
      { key: 'course' as const, label: 'Course' },
      { key: 'status' as const, label: 'Status' },
      { key: 'driveFolderName' as const, label: 'Drive Folder' },
      { key: 'createdAt' as const, label: 'Registered Date' }
    ];
    
    const csvContent = convertToCSV(filteredStudents, headers);
    downloadCSV(csvContent, `zoa_students_${new Date().toISOString().split('T')[0]}.csv`);
    toast('CSV downloaded successfully.', 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title / Action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Academic Registrations</p>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">Students</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Student
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850/80 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 w-full md:w-auto overflow-x-auto shrink-0">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:max-w-xs shrink-0">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description={searchTerm ? "No students matching your search criteria were found." : "There are currently no students in this directory."}
          actionText={searchTerm ? "Reset Search" : undefined}
          onAction={searchTerm ? () => setSearchTerm('') : undefined}
        />
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-100 dark:border-slate-850/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850/60">
                  <th className="py-4 pl-6 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-4 pr-4 font-semibold">Student</th>
                  <th className="py-4 pr-4 font-semibold">Contact Info</th>
                  <th className="py-4 pr-4 font-semibold">Course</th>
                  <th className="py-4 pr-4 font-semibold">Status</th>
                  <th className="py-4 pr-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/20">
                {filteredStudents.map((stud) => {
                  const isChecked = selectedIds.includes(stud.id);
                  return (
                    <tr key={stud.id} className={`text-sm text-slate-600 dark:text-slate-350 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors ${isChecked ? 'bg-green-50/10 dark:bg-green-950/5' : ''}`}>
                      <td className="py-4.5 pl-6">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(stud.id, e.target.checked)}
                        />
                      </td>
                      <td className="py-4.5 pr-4 flex items-center gap-3">
                        {/* Avatar */}
                        <div 
                          onClick={() => setViewingStudent(stud)}
                          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-green-500/30 transition-all"
                        >
                          {stud.photoUrl ? (
                            <img src={getGoogleDriveImageUrl(stud.photoUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                              {stud.fullName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Name Info */}
                        <div className="flex flex-col min-w-0">
                          <span 
                            onClick={() => setViewingStudent(stud)}
                            className="font-bold text-slate-900 dark:text-slate-100 truncate hover:text-green-600 dark:hover:text-green-400 cursor-pointer"
                          >
                            {stud.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {stud.country}
                          </span>
                        </div>
                      </td>
                      <td className="py-4.5 pr-4">
                        <div className="flex flex-col text-xs gap-0.5">
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                            {stud.email}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Smartphone className="w-3.5 h-3.5" />
                            {stud.whatsapp}
                          </span>
                        </div>
                      </td>
                      <td className="py-4.5 pr-4 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {stud.course}
                      </td>
                      <td className="py-4.5 pr-4">
                        {getStatusBadge(stud.status)}
                      </td>
                      <td className="py-4.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingStudent(stud)}
                            title="View student profile details"
                            className="p-1.5 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {stud.status === 'pending' && (
                            <>
                              <button
                                onClick={() => triggerStatusAction(stud.id, 'approve')}
                                title="Approve registration"
                                className="p-1.5 rounded-lg border border-green-200/50 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400 transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => triggerStatusAction(stud.id, 'reject')}
                                title="Reject registration"
                                className="p-1.5 rounded-lg border border-red-200/50 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                              >
                                <CloseIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => setConfirmDeleteId(stud.id)}
                            title="Delete Student Record"
                            className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 dark:border-slate-800 dark:hover:border-red-900/30 text-slate-450 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* STUDENT PROFILE VIEW MODAL */}
      <Modal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        title={
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-base text-slate-900 dark:text-slate-50">Student Profile Summary</span>
            {viewingStudent && getStatusBadge(viewingStudent.status)}
          </div>
        }
        size="lg"
      >
        {viewingStudent && (
          <div className="flex flex-col gap-6">
            
            {/* Header Profiler Row */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-850/50">
              <div className="w-20 h-20 rounded-full border-2 border-green-500/20 overflow-hidden bg-slate-100 shrink-0">
                {viewingStudent.photoUrl ? (
                  <img src={getGoogleDriveImageUrl(viewingStudent.photoUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                    {viewingStudent.fullName[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-center sm:text-left min-w-0 flex-1 gap-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {viewingStudent.fullName}
                </h3>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                  {viewingStudent.course}
                </p>
                <p className="text-xs text-slate-450 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {viewingStudent.country}
                </p>
              </div>
              
              {/* Profile Details Actions */}
              {viewingStudent.status === 'pending' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setViewingStudent(null); triggerStatusAction(viewingStudent.id, 'reject'); }}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => { setViewingStudent(null); triggerStatusAction(viewingStudent.id, 'approve'); }}>
                    Approve
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Grid Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Registration Information</h4>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-850/40 pb-2">
                    <span className="text-slate-400">Email Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingStudent.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-850/40 pb-2">
                    <span className="text-slate-400">WhatsApp Contact</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingStudent.whatsapp}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-850/40 pb-2">
                    <span className="text-slate-400">Registered Date</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-250 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(viewingStudent.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Storage & Verification Documents</h4>
                <div className="flex flex-col gap-2.5">
                  {/* Google Drive Folder link */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <FolderOpen className="w-4 h-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="font-bold">Google Drive Folder</span>
                        <span className="text-slate-400 mt-0.5">{viewingStudent.driveFolderName || 'Generating folder...'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ID Proof Action */}
                  <a
                    href={viewingStudent.idProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      View ID Verification Document
                    </span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer delete */}
            <div className="border-t border-slate-100 dark:border-slate-850/60 pt-4 flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewingStudent(null)}
              >
                Close Profile
              </Button>
              <Button 
                variant="danger" 
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  setConfirmDeleteId(viewingStudent.id);
                }}
              >
                Delete Student
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* CONFIRM STATUS DIALOGS */}
      <ConfirmDialog
        isOpen={!!actioningId && !!actionType}
        onClose={() => { setActioningId(null); setActionType(null); }}
        onConfirm={confirmStatusAction}
        title={actionType === 'approve' ? 'Approve Registration' : 'Reject Registration'}
        description={`Are you sure you want to ${actionType} this student registration? This will update their registry status.`}
        confirmText={actionType === 'approve' ? 'Approve' : 'Reject'}
        variant={actionType === 'approve' ? 'primary' : 'warning'}
        isLoading={updateMutation.isPending}
      />

      {/* CONFIRM DELETE DIALOGS */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Student Record"
        description="Are you sure you want to delete this student record? This operation is permanent and deletes all local data for this student."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* CONFIRM BULK DELETE */}
      <ConfirmDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Records"
        description={`Are you sure you want to bulk-delete these ${selectedIds.length} students? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Records`}
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
      />

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { if (!formLoading) setIsFormOpen(false); }}
        title="Add New Student Profile"
      >
        <form onSubmit={handleSaveStudent} className="flex flex-col gap-5">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={formLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={formLoading}
            />
            <Input
              label="WhatsApp Number"
              placeholder="+923001234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              disabled={formLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Country"
              placeholder="Pakistan"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              disabled={formLoading}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-755 dark:text-slate-350 tracking-wide uppercase">
                Enrolled Course
              </label>
              <select
                className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 px-4 py-2.5 h-[42px]"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
                disabled={formLoading}
              >
                <option value="">Select a Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Upload section */}
          <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Profile Assets (Stored on Google Drive)
            </h4>

            {driveStatus !== 'connected' && (
              <div className="flex gap-2 p-3 rounded-lg border border-amber-200/50 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-955/10 text-amber-700 dark:text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <p>
                  Google Drive is not linked. Uploads will prompt Google authorization, or run in fallback simulator mode.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo Upload */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Profile Photo
                </span>
                <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-900/50 p-4 rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 min-h-[90px]">
                  {photoPreview ? (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate max-w-[120px]">{photoFile?.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-4 h-4 text-green-500" />
                      <span>Select Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    disabled={formLoading}
                  />
                </label>
              </div>

              {/* ID Proof Upload */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  National ID Proof / Passport
                </span>
                <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-900/50 p-4 rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 min-h-[90px]">
                  {idProofFile ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">{idProofFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-4 h-4 text-green-500" />
                      <span>Select ID Document</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setIdProofFile(e.target.files[0]);
                      }
                    }}
                    disabled={formLoading}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850/60 pt-4 flex items-center justify-end gap-3 mt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => { resetForm(); setIsFormOpen(false); }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={formLoading}
            >
              Save Student Profile
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
export default Students;
