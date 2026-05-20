export type UserRole = 'super_admin' | 'admin';
export type AdminStatus = 'active' | 'disabled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AdminUser {
  id: string; // matches Firebase UID
  fullName: string;
  email: string;
  role: UserRole;
  status: AdminStatus;
  createdAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  course: string;
  photoUrl: string;
  photoFileId: string;
  idProofUrl: string;
  idProofFileId: string;
  driveFolderId: string;
  driveFolderName: string;
  status: ApprovalStatus;
  createdAt: string;
  dateOfBirth?: string;
  educationLevel?: string;
  gender?: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  qualification: string;
  experience: string;
  photoUrl: string;
  photoFileId: string;
  cvUrl: string;
  cvFileId: string;
  idProofUrl: string;
  idProofFileId: string;
  driveFolderId: string;
  driveFolderName: string;
  status: ApprovalStatus;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "3 Months"
  fee: number | string;
  imageUrl: string;
  imageFileId: string;
  driveFolderId?: string;
  driveFolderName?: string;
  level: CourseLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Achievement {
  id: string;
  studentName: string;
  country: string;
  achievementTitle: string;
  detail: string;
  imageUrl: string;
  imageFileId: string;
  driveFolderId?: string;
  driveFolderName?: string;
  initials: string;
  isActive: boolean;
  createdAt: string;
  sortOrder: number;
}

export interface AcademySettings {
  academyName: string;
  tagline: string;
  aboutUs: string;
  whatsappNumber: string;
  email: string;
  address: string;
  logoUrl: string;
  logoFileId: string;
  heroImageUrl: string;
  heroImageFileId: string;
  googleClientId: string;
}

export interface BackupHistoryItem {
  id: string; // Google Drive file ID
  name: string; // File name
  size: number; // File size in bytes
  createdTime: string; // ISO string
  mimeType: string;
  webContentLink?: string; // Direct download link
  webViewLink?: string; // Google Drive view link
  category: 'firestore' | 'csv' | 'source_code';
}
