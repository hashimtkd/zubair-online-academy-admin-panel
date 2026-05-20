import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Clock, 
  DollarSign, 
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
import type { Course, CourseLevel } from '../types';
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

export const Courses: React.FC = () => {
  const { toast } = useToast();
  const { upload, driveStatus } = useDrive();

  // Queries & Mutations
  const { data: courses = [], isLoading } = useCollectionQuery<Course>('courses');
  const addMutation = useAddMutation<Course>('courses');
  const updateMutation = useUpdateMutation('courses');
  const deleteMutation = useDeleteMutation('courses');

  // Modal Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [fee, setFee] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Sort by sortOrder ascending, then by title
  const sortedCourses = [...courses].sort((a, b) => {
    const diff = (a.sortOrder || 0) - (b.sortOrder || 0);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });

  const openAddModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setDuration('3 Months');
    setFee('50');
    setLevel('beginner');
    setIsActive(true);
    setSortOrder(String(courses.length + 1));
    setImageFile(null);
    setImagePreview(null);
    setIsFormOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setDuration(course.duration);
    setFee(String(course.fee));
    setLevel(course.level);
    setIsActive(course.isActive);
    setSortOrder(String(course.sortOrder || 0));
    setImageFile(null);
    setImagePreview(course.imageUrl || null);
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

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || !fee) {
      toast('Please enter course title, duration and pricing fee.', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      let imageUrl = editingCourse?.imageUrl || '';
      let imageFileId = editingCourse?.imageFileId || '';
      let driveFolderId = editingCourse?.driveFolderId || '';
      let driveFolderName = editingCourse?.driveFolderName || '';

      // Upload image to Google Drive if a new file is chosen
      if (imageFile) {
        if (driveStatus !== 'connected') {
          toast('Google Drive authorization required to upload media. Attempting to link...', 'info');
        }
        
        const subfolderName = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const uploadResult = await upload(imageFile, 'Courses', subfolderName);
        imageUrl = uploadResult.url;
        imageFileId = uploadResult.id;
        driveFolderId = uploadResult.folderId || '';
        driveFolderName = uploadResult.folderName || '';
      } else if (!imageUrl) {
        // Fallback placeholder image if none uploaded
        imageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600';
        imageFileId = 'default_placeholder';
      }

      const courseData = {
        title,
        description,
        duration,
        fee: isNaN(Number(fee)) || fee === '' ? fee : Number(fee),
        level,
        isActive,
        sortOrder: Number(sortOrder),
        imageUrl,
        imageFileId,
        driveFolderId,
        driveFolderName,
        updatedAt: new Date().toISOString()
      };

      if (editingCourse) {
        await updateMutation.mutateAsync({
          id: editingCourse.id,
          data: courseData
        });
        toast('Course updated successfully.', 'success');
      } else {
        await addMutation.mutateAsync({
          ...courseData,
          createdAt: new Date().toISOString()
        });
        toast('New course created successfully.', 'success');
      }
      
      setIsFormOpen(false);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to save course. Check Google Drive connection.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusToggle = async (course: Course) => {
    try {
      await updateMutation.mutateAsync({
        id: course.id,
        data: { isActive: !course.isActive }
      });
      toast(`Course '${course.title}' ${!course.isActive ? 'activated' : 'deactivated'} successfully.`, 'success');
    } catch (err) {
      toast('Failed to update course status.', 'error');
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast('Course deleted from catalog.', 'success');
    } catch (err) {
      toast('Failed to delete course.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'beginner': return <Badge variant="info">Beginner</Badge>;
      case 'intermediate': return <Badge variant="warning">Intermediate</Badge>;
      default: return <Badge variant="purple">Advanced</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title / Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Curriculum Catalog</p>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">Courses</h2>
        </div>
        
        <Button
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Course
        </Button>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <CardGridSkeleton cards={3} />
      ) : sortedCourses.length === 0 ? (
        <EmptyState
          title="No Courses Listed"
          description="There are currently no learning courses configured in the academy catalog."
          actionText="Add First Course"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course) => (
            <Card 
              key={course.id} 
              className={`flex flex-col overflow-hidden border p-0 transition-all duration-300 hover:shadow-md ${
                !course.isActive ? 'opacity-70 saturate-50' : ''
              }`}
            >
              {/* Course Image */}
              <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-850/60">
                <img 
                  src={getGoogleDriveImageUrl(course.imageUrl)} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                
                {/* Float badges */}
                <div className="absolute top-3.5 left-3.5 flex gap-2">
                  {getLevelBadge(course.level)}
                  <Badge variant={course.isActive ? 'success' : 'neutral'}>
                    {course.isActive ? 'Active' : 'Draft'}
                  </Badge>
                </div>
              </div>

              {/* Course Details */}
              <div className="p-5 flex flex-col flex-1 gap-2.5">
                <div className="flex items-center gap-1.5 justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-50 line-clamp-1" title={course.title}>
                    {course.title}
                  </h3>
                </div>
                
                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                  {course.description || 'No description provided.'}
                </p>

                {/* Info row */}
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850/40 pt-4 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.duration}
                  </span>
                  
                  <span className="flex items-center gap-0.5 text-slate-900 dark:text-slate-100 text-sm font-extrabold">
                    <DollarSign className="w-3.5 h-3.5 shrink-0 text-slate-400 font-normal" />
                    {course.fee}
                    <span className="text-[10px] text-slate-450 font-normal">/mo</span>
                  </span>
                </div>
              </div>

              {/* Card actions */}
              <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850/60 flex items-center justify-between">
                <button
                  onClick={() => handleStatusToggle(course)}
                  className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
                  title={course.isActive ? 'Deactivate course' : 'Activate course'}
                >
                  {course.isActive ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-green-500" />
                      <span className="font-bold">Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-slate-450">Inactive</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(course)}
                    title="Edit course details"
                    className="p-1.5 rounded-lg border border-slate-150 hover:border-slate-250 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(course.id)}
                    title="Delete course"
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

      {/* COURSE FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          <span className="font-extrabold text-base text-slate-900 dark:text-slate-50">
            {editingCourse ? `Edit Catalog Course: ${editingCourse.title}` : 'Add New Catalog Course'}
          </span>
        }
        size="md"
      >
        <form onSubmit={handleSaveCourse} className="flex flex-col gap-5">
          <Input
            label="Course Title"
            placeholder="Quran Memorization (Hifz)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 tracking-wide uppercase">
              Description
            </label>
            <textarea
              className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 px-4 py-2.5 min-h-[90px]"
              placeholder="Provide a comprehensive summary of the course syllabus and expectations."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (e.g. '3 Months')"
              placeholder="3 Months"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Input
              label="Monthly Fee"
              type="text"
              placeholder="e.g. 50 or 2000 INR"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 tracking-wide uppercase">
                Difficulty Level
              </label>
              <select
                className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 px-4 py-2.5"
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <Input
              label="Sorting Order"
              type="number"
              placeholder="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          {/* Image Upload Row */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 tracking-wide uppercase">
              Course Image banner (Stores in Google Drive)
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
              id="course-active"
              type="checkbox" 
              className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="course-active" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Publish as active course
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
              Save Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteCourse}
        title="Delete Course Catalog Record"
        description="Are you sure you want to remove this course from the Zubair Online Academy catalog? This deletes all catalog metadata."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

    </div>
  );
};
export default Courses;
