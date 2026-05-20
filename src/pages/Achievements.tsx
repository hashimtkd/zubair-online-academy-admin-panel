import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  MapPin, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  useCollectionQuery, 
  useAddMutation, 
  useUpdateMutation, 
  useDeleteMutation 
} from '../hooks/useFirestore';
import type { Achievement } from '../types';
import { useDrive } from '../context/DriveContext';
import { getGoogleDriveImageUrl } from '../services/googleDrive';
import { CardGridSkeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';
import { useToast } from '../components/ui/Toast';

export const Achievements: React.FC = () => {
  const { toast } = useToast();
  const { upload, driveStatus } = useDrive();

  // Queries & Mutations
  const { data: achievements = [], isLoading } = useCollectionQuery<Achievement>('achievements');
  const addMutation = useAddMutation<Achievement>('achievements');
  const updateMutation = useUpdateMutation('achievements');
  const deleteMutation = useDeleteMutation('achievements');

  // Modal Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [country, setCountry] = useState('');
  const [achievementTitle, setAchievementTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [initials, setInitials] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Sort by sortOrder ascending, then by date
  const sortedAchievements = [...achievements].sort((a, b) => {
    const diff = (a.sortOrder || 0) - (b.sortOrder || 0);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const openAddModal = () => {
    setEditingAchievement(null);
    setStudentName('');
    setCountry('');
    setAchievementTitle('');
    setDetail('');
    setInitials('');
    setIsActive(true);
    setSortOrder(String(achievements.length + 1));
    setImageFile(null);
    setImagePreview(null);
    setIsFormOpen(true);
  };

  const openEditModal = (ach: Achievement) => {
    setEditingAchievement(ach);
    setStudentName(ach.studentName);
    setCountry(ach.country);
    setAchievementTitle(ach.achievementTitle);
    setDetail(ach.detail);
    setInitials(ach.initials || '');
    setIsActive(ach.isActive);
    setSortOrder(String(ach.sortOrder || 0));
    setImageFile(null);
    setImagePreview(ach.imageUrl || null);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !achievementTitle || !detail) {
      toast('Please enter student name, title, and achievement details.', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      let imageUrl = editingAchievement?.imageUrl || '';
      let imageFileId = editingAchievement?.imageFileId || '';
      let driveFolderId = editingAchievement?.driveFolderId || '';
      let driveFolderName = editingAchievement?.driveFolderName || '';

      // Upload image to Google Drive if selected
      if (imageFile) {
        if (driveStatus !== 'connected') {
          toast('Google Drive authorization required to upload media. Attempting connection...', 'info');
        }
        
        const subfolderName = achievementTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + '_' + new Date().getFullYear();
        const uploadResult = await upload(imageFile, 'Achievements', subfolderName);
        imageUrl = uploadResult.url;
        imageFileId = uploadResult.id;
        driveFolderId = uploadResult.folderId || '';
        driveFolderName = uploadResult.folderName || '';
      } else if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600';
        imageFileId = 'default_placeholder';
      }

      // Generate initials if empty
      const generatedInitials = initials || studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      const achData = {
        studentName,
        country,
        achievementTitle,
        detail,
        initials: generatedInitials,
        isActive,
        sortOrder: Number(sortOrder),
        imageUrl,
        imageFileId,
        driveFolderId,
        driveFolderName,
        updatedAt: new Date().toISOString()
      };

      if (editingAchievement) {
        await updateMutation.mutateAsync({
          id: editingAchievement.id,
          data: achData
        });
        toast('Achievement updated successfully.', 'success');
      } else {
        await addMutation.mutateAsync({
          ...achData,
          createdAt: new Date().toISOString()
        });
        toast('New achievement added to catalog.', 'success');
      }
      
      setIsFormOpen(false);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to save achievement. Check Google Drive connection.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusToggle = async (ach: Achievement) => {
    try {
      await updateMutation.mutateAsync({
        id: ach.id,
        data: { isActive: !ach.isActive }
      });
      toast(`Achievement status updated successfully.`, 'success');
    } catch (err) {
      toast('Failed to update achievement status.', 'error');
    }
  };

  const handleDeleteAchievement = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast('Achievement record deleted.', 'success');
    } catch (err) {
      toast('Failed to delete achievement.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title / Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hall of Fame</p>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">Achievements</h2>
        </div>
        
        <Button
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Achievement
        </Button>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <CardGridSkeleton cards={3} />
      ) : sortedAchievements.length === 0 ? (
        <EmptyState
          title="No Achievements Listed"
          description="There are currently no achievements recorded in the academy registry."
          actionText="Record First Achievement"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map((ach) => (
            <Card 
              key={ach.id} 
              className={`flex flex-col overflow-hidden border p-0 transition-all duration-300 hover:shadow-md ${
                !ach.isActive ? 'opacity-70 saturate-50' : ''
              }`}
            >
              {/* Achievement Image */}
              <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-850/60">
                <img 
                  src={getGoogleDriveImageUrl(ach.imageUrl)} 
                  alt={ach.studentName} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                
                {/* Float Badge */}
                <div className="absolute top-3.5 left-3.5 flex gap-2">
                  <Badge variant={ach.isActive ? 'success' : 'neutral'}>
                    {ach.isActive ? 'Published' : 'Hidden'}
                  </Badge>
                </div>

                {/* Floating Initials Badge */}
                <div className="absolute bottom-3.5 right-3.5 w-10 h-10 rounded-xl bg-green-600 border border-green-550 flex items-center justify-center font-extrabold text-slate-100 text-xs shadow-md">
                  {ach.initials}
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-5 flex flex-col flex-1 gap-2.5">
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-50 line-clamp-1" title={ach.achievementTitle}>
                    {ach.achievementTitle}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{ach.studentName}</span>
                    <span>•</span>
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{ach.country}</span>
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed mt-1">
                  {ach.detail}
                </p>
              </div>

              {/* Actions row */}
              <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850/60 flex items-center justify-between">
                <button
                  onClick={() => handleStatusToggle(ach)}
                  className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
                  title={ach.isActive ? 'Hide achievement' : 'Publish achievement'}
                >
                  {ach.isActive ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-green-500" />
                      <span className="font-bold">Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-slate-450">Hidden</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(ach)}
                    title="Edit achievement details"
                    className="p-1.5 rounded-lg border border-slate-150 hover:border-slate-250 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(ach.id)}
                    title="Delete achievement"
                    className="p-1.5 rounded-lg border border-slate-150 hover:border-red-200 dark:border-slate-800 dark:hover:border-red-900/30 bg-white dark:bg-slate-900 text-slate-450 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ACHIEVEMENT FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          <span className="font-extrabold text-base text-slate-900 dark:text-slate-55">
            {editingAchievement ? `Edit Achievement: ${editingAchievement.studentName}` : 'Record Student Achievement'}
          </span>
        }
        size="md"
      >
        <form onSubmit={handleSaveAchievement} className="flex flex-col gap-5">
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Student Name"
              placeholder="Omar Farooq"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
            <Input
              label="Country"
              placeholder="United Kingdom"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>

          <Input
            label="Achievement Title"
            placeholder="Completed Hifz-e-Quran"
            value={achievementTitle}
            onChange={(e) => setAchievementTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 tracking-wide uppercase">
              Achievement Details
            </label>
            <textarea
              className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 px-4 py-2.5 min-h-[90px]"
              placeholder="Detail the achievements, milestones passed, or rewards earned."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Student Initials (Optional)"
              placeholder="OF"
              maxLength={3}
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              helperText="E.g., OF for Omar Farooq"
            />
            <Input
              label="Sort Order"
              type="number"
              placeholder="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          {/* Image Upload Row */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 tracking-wide uppercase">
              Achievement Photo (Stores in Google Drive)
            </label>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={getGoogleDriveImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              
              <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 p-3 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Upload className="w-4 h-4 text-green-500" />
                  <span>Choose file...</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </label>
            </div>
            
            {driveStatus !== 'connected' && imageFile && (
              <span className="text-[10px] text-amber-500 flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Google Drive will authorize automatically before uploading.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              id="ach-publish"
              type="checkbox" 
              className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="ach-publish" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Publish achievement publicly
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-850/60 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={formLoading}
            >
              Save Achievement
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteAchievement}
        title="Delete Achievement Record"
        description="Are you sure you want to delete this student achievement record from the registry?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

    </div>
  );
};
export default Achievements;
