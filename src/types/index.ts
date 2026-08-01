export interface AcademicYearItem {
  id: string;
  year: string; // e.g. "2025/2026"
  semester: '1' | '2';
  isActive: boolean;
  status: 'Aktif' | 'Non-Aktif';
  createdAt: string;
}

export type UserRole = 'admin' | 'guru';

export interface Profile {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: UserRole;
  nipNuptk?: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
  avatarDriveId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  teacherIds?: string[]; // IDs of assigned teachers
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g., "7-A", "10-IPA-1"
  gradeLevel: string; // e.g., "7", "8", "9", "10", "11", "12"
  academicYear: string; // e.g., "2025/2026"
  homeroomTeacherId?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  nis: string;
  fullName: string;
  gender: 'L' | 'P'; // Laki-laki / Perempuan
  birthPlace: string;
  birthDate: string;
  address: string;
  parentPhone: string;
  classId: string;
  className?: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  teacherId: string;
  assignmentScore: number; // Nilai Tugas
  dailyScore: number;      // Nilai Harian
  ptsScore: number;        // Nilai PTS
  pasScore: number;        // Nilai PAS
  finalScore: number;      // Calculated (20% Tugas, 30% Harian, 25% PTS, 25% PAS)
  predicate: 'A' | 'B' | 'C' | 'D';
  notes?: string;
  academicYear: string;
  semester: '1' | '2';
  updatedAt: string;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';

export interface Attendance {
  id: string;
  date: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export interface TeachingJournal {
  id: string;
  date: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  teacherId: string;
  teacherName?: string;
  timeSlot: string; // e.g. "07:30 - 09:00 (Jam 1-2)"
  topic: string; // Materi
  method: string; // Metode Pembelajaran
  attendeeCount: number; // Jumlah Siswa Hadir
  notes?: string; // Catatan Guru
  attachmentName?: string;
  attachmentDriveId?: string;
  attachmentWebViewLink?: string;
  attachmentWebContentLink?: string;
  createdAt: string;
}

export interface TeachingModule {
  id: string;
  title: string; // Judul Modul / RPP
  subjectId: string;
  subjectName?: string;
  classLevel: string; // Kelas / Tingkat
  semester: '1' | '2';
  academicYear: string; // e.g. "2025/2026"
  description: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'other';
  fileName: string;
  fileSize?: string;
  fileDriveId: string;
  webViewLink: string;
  webContentLink: string;
  teacherId: string;
  teacherName?: string;
  createdAt: string;
}

export interface PaperMargin {
  unit: 'mm' | 'cm';
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface LetterheadSettings {
  imageUrl: string;
  driveFileId?: string;
  heightMm: number;
  showInPdf: boolean;
  institutionName?: string;
  address?: string;
}

export interface GradeWeights {
  assignment: number;
  daily: number;
  pts: number;
  pas: number;
}

export interface PredicateThresholds {
  aMin: number;
  bMin: number;
  cMin: number;
  kkmDefault: number;
}

export interface SchoolInfoSettings {
  schoolName: string;
  address: string;
  city?: string;
  email: string;
  phone: string;
  timeZone: string;
  dateFormat: string;
  academicYearActive?: string;
  semesterActive?: '1' | '2';
  headmasterName?: string;
  headmasterNip?: string;
}

export type UserProfile = Profile;

export interface SchoolPrincipal {
  id: string;
  fullName: string;
  title: string;
  nip?: string;
  nuptk: string;
  position: string; // default: 'Kepala Sekolah'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSettings {
  logoUrl?: string;
  digitalSignatureUrl?: string;
  schoolStampUrl?: string;
}

export interface SystemSettings {
  paperMargin: PaperMargin;
  letterhead: LetterheadSettings;
  gradeWeights: GradeWeights;
  predicateThresholds: PredicateThresholds;
  schoolInfo: SchoolInfoSettings;
  documentSettings?: DocumentSettings;
  neonDbUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleDriveConnected?: boolean;
  googleDriveFolderName?: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

