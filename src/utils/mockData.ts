import type { Student, Teacher, Course, Achievement, AcademySettings, AdminUser } from '../types';

export const MOCK_ADMINS: AdminUser[] = [
  {
    id: 'super_admin_uid',
    fullName: 'Zubair Ahmad',
    email: 'superadmin@zubair.com',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-01-01T12:00:00Z',
  },
  {
    id: 'admin_uid',
    fullName: 'Muhammad Hashim',
    email: 'admin@zubair.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    id: 'disabled_admin_uid',
    fullName: 'Suspended Staff',
    email: 'suspended@zubair.com',
    role: 'admin',
    status: 'disabled',
    createdAt: '2026-03-10T14:00:00Z',
  }
];

export const MOCK_SETTINGS: AcademySettings = {
  academyName: 'Zubair Online Academy',
  tagline: 'Empowering Minds, Shaping Futures',
  aboutUs: 'Zubair Online Academy is a leading provider of online Quranic, Islamic, and academic courses. With experienced teachers and structured curriculum, we provide high-quality education to students worldwide.',
  whatsappNumber: '+923001234567',
  email: 'info@zubairacademy.com',
  address: 'Sector F-8, Islamabad, Pakistan',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
  logoFileId: 'demo_logo_id_123',
  heroImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200',
  heroImageFileId: 'demo_hero_id_456',
  googleClientId: '123456789-demo-client-id.apps.googleusercontent.com'
};

export const MOCK_COURSES: Course[] = [
  {
    id: 'course_1',
    title: 'Norani Qaida for Beginners',
    description: 'Learn the basic rules of Quran reading with correct pronunciation (Tajweed). Perfect for kids and complete beginners.',
    duration: '2 Months',
    fee: 40,
    imageUrl: 'https://images.unsplash.com/photo-1584697964400-2af67273907a?auto=format&fit=crop&q=80&w=600',
    imageFileId: 'demo_course_img_1',
    level: 'beginner',
    isActive: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
    sortOrder: 1,
  },
  {
    id: 'course_2',
    title: 'Quran Recitation with Tajweed',
    description: 'Improve your Quran recitation skills. Focus on advanced rules of Tajweed, stopping signs, and beautiful voice tone training.',
    duration: '4 Months',
    fee: 60,
    imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600',
    imageFileId: 'demo_course_img_2',
    level: 'intermediate',
    isActive: true,
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z',
    sortOrder: 2,
  },
  {
    id: 'course_3',
    title: 'Quran Memorization (Hifz)',
    description: 'Structured Quran memorization program guided by certified Huffaz. Includes revision schedules and tracking.',
    duration: '24 Months',
    fee: 80,
    imageUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
    imageFileId: 'demo_course_img_3',
    level: 'advanced',
    isActive: true,
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-01-20T12:00:00Z',
    sortOrder: 3,
  },
  {
    id: 'course_4',
    title: 'Islamic Studies & Fiqh',
    description: 'Comprehensive study of Islamic beliefs, acts of worship, history, and Hadith. Essential guide for daily life.',
    duration: '6 Months',
    fee: 50,
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    imageFileId: 'demo_course_img_4',
    level: 'beginner',
    isActive: false,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
    sortOrder: 4,
  }
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_1',
    studentName: 'Omar Farooq',
    country: 'United Kingdom',
    achievementTitle: 'Completed Hifz-e-Quran',
    detail: 'Omar successfully memorized the entire Quran in 18 months under the guidance of Sheikh Abdullah.',
    imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600',
    imageFileId: 'demo_ach_img_1',
    initials: 'OF',
    isActive: true,
    createdAt: '2026-03-01T15:00:00Z',
    sortOrder: 1,
  },
  {
    id: 'ach_2',
    studentName: 'Sarah Fatima',
    country: 'Canada',
    achievementTitle: 'Best Tajweed Reciter 2026',
    detail: 'Awarded first position in the annual international Quran recitation competition for online academies.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    imageFileId: 'demo_ach_img_2',
    initials: 'SF',
    isActive: true,
    createdAt: '2026-04-10T12:00:00Z',
    sortOrder: 2,
  }
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stud_1',
    fullName: 'Fathima Fidha',
    email: 'fidha@example.com',
    whatsapp: '+447911123456',
    country: 'United Kingdom',
    course: 'Quran Recitation with Tajweed',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_stud_photo_1',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_stud_id_1',
    driveFolderId: 'demo_stud_folder_1',
    driveFolderName: 'fathima_fidha_2026',
    status: 'pending',
    createdAt: '2026-05-18T10:20:00Z',
  },
  {
    id: 'stud_2',
    fullName: 'Zainab Ahmed',
    email: 'zainab@example.com',
    whatsapp: '+14155552671',
    country: 'United States',
    course: 'Norani Qaida for Beginners',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_stud_photo_2',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_stud_id_2',
    driveFolderId: 'demo_stud_folder_2',
    driveFolderName: 'zainab_ahmed_2026',
    status: 'approved',
    createdAt: '2026-05-12T14:35:00Z',
  },
  {
    id: 'stud_3',
    fullName: 'Hamza Khan',
    email: 'hamza@example.com',
    whatsapp: '+971501234567',
    country: 'United Arab Emirates',
    course: 'Quran Memorization (Hifz)',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_stud_photo_3',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_stud_id_3',
    driveFolderId: 'demo_stud_folder_3',
    driveFolderName: 'hamza_khan_2026',
    status: 'approved',
    createdAt: '2026-05-02T16:10:00Z',
  },
  {
    id: 'stud_4',
    fullName: 'Bilal Mustafa',
    email: 'bilal@example.com',
    whatsapp: '+61298765432',
    country: 'Australia',
    course: 'Islamic Studies & Fiqh',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_stud_photo_4',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_stud_id_4',
    driveFolderId: 'demo_stud_folder_4',
    driveFolderName: 'bilal_mustafa_2026',
    status: 'rejected',
    createdAt: '2026-04-28T11:45:00Z',
  }
];

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 'teach_1',
    fullName: 'Sheikh Abdullah',
    email: 'abdullah@zubairacademy.com',
    whatsapp: '+923335556677',
    country: 'Egypt',
    qualification: 'B.A. in Islamic Studies, Al-Azhar University',
    experience: '8 Years teaching Quran and Tajweed to international students',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_teach_photo_1',
    cvUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    cvFileId: 'demo_teach_cv_1',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_teach_id_1',
    driveFolderId: 'demo_teach_folder_1',
    driveFolderName: 'sheikh_abdullah_2026',
    status: 'approved',
    createdAt: '2026-05-01T09:00:00Z',
  },
  {
    id: 'teach_2',
    fullName: 'Qari Yasir Arafat',
    email: 'yasir@zubairacademy.com',
    whatsapp: '+923214445566',
    country: 'Pakistan',
    qualification: 'Shahadat-ul-Almiya (M.A. Islamic Studies), Hafiz-e-Quran',
    experience: '12 Years Quran memorization coaching, certified in ten recitations (Qira\'at)',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_teach_photo_2',
    cvUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    cvFileId: 'demo_teach_cv_2',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_teach_id_2',
    driveFolderId: 'demo_teach_folder_2',
    driveFolderName: 'qari_yasir_arafat_2026',
    status: 'pending',
    createdAt: '2026-05-19T08:15:00Z',
  },
  {
    id: 'teach_3',
    fullName: 'Ustadha Ayesha Siddiqua',
    email: 'ayesha@zubairacademy.com',
    whatsapp: '+923126667788',
    country: 'Saudi Arabia',
    qualification: 'Ijazah in Tajweed & Quran Memorization, Umm Al-Qura University',
    experience: '5 Years teaching Quran online to kids and female students',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    photoFileId: 'demo_teach_photo_3',
    cvUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    cvFileId: 'demo_teach_cv_3',
    idProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
    idProofFileId: 'demo_teach_id_3',
    driveFolderId: 'demo_teach_folder_3',
    driveFolderName: 'ustadha_ayesha_2026',
    status: 'approved',
    createdAt: '2026-04-15T10:45:00Z',
  }
];

export function initializeMockDatabase() {
  if (!localStorage.getItem('zoa_database_initialized')) {
    localStorage.setItem('zoa_students', JSON.stringify(MOCK_STUDENTS));
    localStorage.setItem('zoa_teachers', JSON.stringify(MOCK_TEACHERS));
    localStorage.setItem('zoa_courses', JSON.stringify(MOCK_COURSES));
    localStorage.setItem('zoa_achievements', JSON.stringify(MOCK_ACHIEVEMENTS));
    localStorage.setItem('zoa_settings', JSON.stringify(MOCK_SETTINGS));
    localStorage.setItem('zoa_admins', JSON.stringify(MOCK_ADMINS));
    localStorage.setItem('zoa_backups', JSON.stringify([]));
    localStorage.setItem('zoa_database_initialized', 'true');
  }
}

export function getMockCollection<T>(collectionName: string): T[] {
  initializeMockDatabase();
  const data = localStorage.getItem(`zoa_${collectionName}`);
  return data ? JSON.parse(data) : [];
}

export function saveMockCollection<T>(collectionName: string, data: T[]): void {
  localStorage.setItem(`zoa_${collectionName}`, JSON.stringify(data));
}
