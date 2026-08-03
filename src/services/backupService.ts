import { getSupabaseClient, generateSupabaseSQLScript } from './supabase';
import {
  Profile,
  Subject,
  ClassRoom,
  Student,
  Grade,
  Attendance,
  TeachingJournal,
  TeachingModule,
  SystemSettings,
  ActivityLog,
  SchoolPrincipal,
  AcademicYearItem
} from '../types';

export interface BackupMetadata {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  type: 'FULL_SYSTEM' | 'MANUAL_JSON' | 'MANUAL_SQL';
  status: 'COMPLETED' | 'RESTORED' | 'FAILED';
  appName: string;
  appVersion: string;
  dbVersion: string;
  backupDate: string;
  backupTimestamp: number;
  createdBy: string;
  createdByName: string;
  tableCount: number;
  totalRecords: number;
  recordCounts: Record<string, number>;
}

export interface FullBackupPayload {
  metadata: BackupMetadata;
  schemaSql: string;
  data: {
    profiles: Profile[];
    subjects: Subject[];
    classes: ClassRoom[];
    teacherAssignments: any[];
    students: Student[];
    schoolPrincipals: SchoolPrincipal[];
    academicYears: AcademicYearItem[];
    grades: Grade[];
    attendance: Attendance[];
    teachingJournals: TeachingJournal[];
    teachingModules: TeachingModule[];
    moduleArchives: any[];
    systemSettings: SystemSettings;
    notifications: any[];
    activityLogs: ActivityLog[];
  };
}

export interface BackupHistoryRecord {
  id: string;
  name: string;
  file_name: string;
  file_size: string;
  type: string;
  status: string;
  created_by: string;
  created_by_name: string;
  app_version: string;
  db_version: string;
  record_counts: Record<string, number>;
  backup_data?: any;
  created_at: string;
}

const LOCAL_BACKUP_STORAGE_KEY = 'guruku_system_backups_history';

// Helper to format file size
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Generate SQL Insert script from JSON data
export function convertPayloadToSQLScript(payload: FullBackupPayload): string {
  const schema = payload.schemaSql || generateSupabaseSQLScript();
  let sql = `-- ============================================================
-- FULL SYSTEM BACKUP DATA EXPORT - GURUKU APP
-- Date: ${payload.metadata.backupDate}
-- Created By: ${payload.metadata.createdByName} (${payload.metadata.createdBy})
-- Total Tables: ${payload.metadata.tableCount} | Total Records: ${payload.metadata.totalRecords}
-- ============================================================

${schema}

-- ============================================================
-- DATA INSERTS
-- ============================================================

`;

  const escapeSql = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') return `${val}`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  // 1. Profiles
  if (payload.data.profiles && payload.data.profiles.length > 0) {
    sql += `-- Profiles (${payload.data.profiles.length} records)\n`;
    for (const p of payload.data.profiles) {
      sql += `INSERT INTO public.profiles (id, email, username, full_name, role, nip_nuptk, phone, avatar_url) VALUES (${escapeSql(p.id)}, ${escapeSql(p.email)}, ${escapeSql(p.username)}, ${escapeSql(p.fullName)}, ${escapeSql(p.role)}, ${escapeSql(p.nipNuptk)}, ${escapeSql(p.phone)}, ${escapeSql(p.avatarUrl)}) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, email = EXCLUDED.email;\n`;
    }
    sql += '\n';
  }

  // 2. Subjects
  if (payload.data.subjects && payload.data.subjects.length > 0) {
    sql += `-- Subjects (${payload.data.subjects.length} records)\n`;
    for (const s of payload.data.subjects) {
      sql += `INSERT INTO public.subjects (id, code, name, description, teacher_ids) VALUES (${escapeSql(s.id)}, ${escapeSql(s.code)}, ${escapeSql(s.name)}, ${escapeSql(s.description)}, ${escapeSql(s.teacherIds)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;\n`;
    }
    sql += '\n';
  }

  // 3. Classes
  if (payload.data.classes && payload.data.classes.length > 0) {
    sql += `-- Classes (${payload.data.classes.length} records)\n`;
    for (const c of payload.data.classes) {
      sql += `INSERT INTO public.classes (id, name, grade_level, academic_year, homeroom_teacher_id, teacher_ids) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.gradeLevel)}, ${escapeSql(c.academicYear)}, ${escapeSql(c.homeroomTeacherId)}, ${escapeSql(c.teacherIds)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n`;
    }
    sql += '\n';
  }

  // 4. Students
  if (payload.data.students && payload.data.students.length > 0) {
    sql += `-- Students (${payload.data.students.length} records)\n`;
    for (const st of payload.data.students) {
      sql += `INSERT INTO public.students (id, nis, full_name, gender, birth_place, birth_date, religion, address, parent_name, parent_phone, class_id) VALUES (${escapeSql(st.id)}, ${escapeSql(st.nis)}, ${escapeSql(st.fullName)}, ${escapeSql(st.gender)}, ${escapeSql(st.birthPlace)}, ${escapeSql(st.birthDate)}, ${escapeSql(st.religion)}, ${escapeSql(st.address)}, ${escapeSql(st.parentName)}, ${escapeSql(st.parentPhone)}, ${escapeSql(st.classId)}) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;\n`;
    }
    sql += '\n';
  }

  // 5. System Settings
  if (payload.data.systemSettings) {
    sql += `-- System Settings\n`;
    sql += `INSERT INTO public.system_settings (key, value) VALUES ('main_config', '${JSON.stringify(payload.data.systemSettings).replace(/'/g, "''")}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;\n\n`;
  }

  return sql;
}

// Create Full Backup Payload from current context/app state
export async function createFullBackupPayload(
  currentAdmin: { id: string; fullName: string },
  dataContextState: {
    profiles: Profile[];
    subjects: Subject[];
    classes: ClassRoom[];
    students: Student[];
    schoolPrincipals: SchoolPrincipal[];
    academicYears: AcademicYearItem[];
    grades: Grade[];
    attendance: Attendance[];
    teachingJournals: TeachingJournal[];
    teachingModules: TeachingModule[];
    systemSettings: SystemSettings;
    notifications: any[];
    activityLogs: ActivityLog[];
  },
  onProgress?: (status: string, pct: number) => void
): Promise<FullBackupPayload> {
  if (onProgress) onProgress('Menyiapkan pencadangan data...', 10);

  const client = getSupabaseClient();
  let profiles = [...dataContextState.profiles];
  let subjects = [...dataContextState.subjects];
  let classes = [...dataContextState.classes];
  let students = [...dataContextState.students];
  let schoolPrincipals = [...dataContextState.schoolPrincipals];
  let academicYears = [...dataContextState.academicYears];
  let grades = [...dataContextState.grades];
  let attendance = [...dataContextState.attendance];
  let teachingJournals = [...dataContextState.teachingJournals];
  let teachingModules = [...dataContextState.teachingModules];
  let moduleArchives: any[] = [];
  let teacherAssignments: any[] = [];
  let systemSettings = { ...dataContextState.systemSettings };
  let notifications = [...dataContextState.notifications];
  let activityLogs = [...dataContextState.activityLogs];

  if (onProgress) onProgress('Membaca data master & akademik dari database...', 40);

  if (client) {
    try {
      const [
        resProf,
        resSub,
        resCls,
        resStud,
        resPrn,
        resGrd,
        resAtt,
        resJrn,
        resMod,
        resArch,
        resAssg,
        resNotif,
        resAct
      ] = await Promise.all([
        client.from('profiles').select('*'),
        client.from('subjects').select('*'),
        client.from('classes').select('*'),
        client.from('students').select('*'),
        client.from('school_principals').select('*'),
        client.from('grades').select('*'),
        client.from('attendance').select('*'),
        client.from('teaching_journals').select('*'),
        client.from('teaching_modules').select('*'),
        client.from('module_archives').select('*'),
        client.from('teacher_assignments').select('*'),
        client.from('notifications').select('*'),
        client.from('activity_logs').select('*')
      ]);

      if (resProf.data) {
        profiles = resProf.data.map((p) => ({
          id: p.id,
          email: p.email,
          username: p.username || '',
          fullName: p.full_name,
          role: p.role,
          nipNuptk: p.nip_nuptk || '',
          phone: p.phone || '',
          avatarUrl: p.avatar_url || '',
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      }

      if (resSub.data) {
        subjects = resSub.data.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          description: s.description || '',
          teacherIds: s.teacher_ids || [],
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
      }

      if (resCls.data) {
        classes = resCls.data.map((c) => ({
          id: c.id,
          name: c.name,
          gradeLevel: c.grade_level,
          academicYear: c.academic_year,
          homeroomTeacherId: c.homeroom_teacher_id || '',
          teacherIds: c.teacher_ids || [],
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }));
      }

      if (resStud.data) {
        students = resStud.data.map((st) => ({
          id: st.id,
          nis: st.nis,
          fullName: st.full_name,
          gender: st.gender,
          birthPlace: st.birth_place || '',
          birthDate: st.birth_date || '',
          religion: st.religion || 'Islam',
          address: st.address || '',
          parentName: st.parent_name || '',
          parentPhone: st.parent_phone || '',
          classId: st.class_id,
          createdAt: st.created_at,
          updatedAt: st.updated_at
        }));
      }

      if (resGrd.data) {
        grades = resGrd.data.map((g) => ({
          id: g.id,
          studentId: g.student_id,
          subjectId: g.subject_id,
          classId: g.class_id,
          teacherId: g.teacher_id,
          semester: g.semester,
          academicYear: g.academic_year,
          assignmentScore: g.assignment_score || 0,
          dailyScore: g.daily_score || 0,
          ptsScore: g.pts_score || 0,
          pasScore: g.pas_score || 0,
          finalScore: g.final_score || 0,
          predicate: g.predicate || 'B',
          notes: g.notes || '',
          updatedAt: g.updated_at
        }));
      }

      if (resAtt.data) {
        attendance = resAtt.data.map((a) => ({
          id: a.id,
          studentId: a.student_id,
          classId: a.class_id,
          subjectId: a.subject_id,
          date: a.date,
          status: a.status,
          notes: a.notes || '',
          teacherId: a.teacher_id,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        }));
      }

      if (resJrn.data) {
        teachingJournals = resJrn.data.map((j) => ({
          id: j.id,
          date: j.date,
          subjectId: j.subject_id,
          classId: j.class_id,
          teacherId: j.teacher_id,
          timeSlot: j.time_slot,
          topic: j.topic,
          method: j.method,
          attendeeCount: j.attendee_count || 0,
          notes: j.notes || '',
          attachmentName: j.attachment_name || '',
          attachmentDriveId: j.attachment_drive_id || '',
          attachmentWebViewLink: j.attachment_web_view_link || '',
          attachmentWebContentLink: j.attachment_web_content_link || '',
          createdAt: j.created_at,
          updatedAt: j.updated_at
        }));
      }

      if (resMod.data) {
        teachingModules = resMod.data.map((m) => ({
          id: m.id,
          title: m.title,
          subjectId: m.subject_id,
          classLevel: m.class_level,
          semester: m.semester,
          academicYear: m.academic_year,
          description: m.description || '',
          fileType: m.file_type || 'PDF',
          fileName: m.file_name,
          fileSize: m.file_size || '',
          fileDriveId: m.file_drive_id,
          webViewLink: m.web_view_link,
          webContentLink: m.web_content_link,
          teacherId: m.teacher_id,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        }));
      }

      if (resArch.data) moduleArchives = resArch.data;
      if (resAssg.data) teacherAssignments = resAssg.data;
      if (resPrn.data) {
        schoolPrincipals = resPrn.data.map((p) => ({
          id: p.id,
          fullName: p.full_name,
          title: p.title || '',
          nuks: p.nuks || '',
          position: p.position || 'Kepala Sekolah',
          isActive: Boolean(p.is_active),
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      }
      if (resNotif.data) notifications = resNotif.data;
      if (resAct.data) activityLogs = resAct.data;
    } catch (err) {
      console.warn('Fallback to local state during backup fetch:', err);
    }
  }

  if (onProgress) onProgress('Mengompresi data & membuat metadata backup...', 80);

  const recordCounts: Record<string, number> = {
    Pengguna: profiles.length,
    Guru: profiles.filter((p) => p.role === 'guru').length,
    'Mata Pelajaran': subjects.length,
    'Kelas / Rombel': classes.length,
    Siswa: students.length,
    'Kepala Sekolah': schoolPrincipals.length,
    Nilai: grades.length,
    Absensi: attendance.length,
    'Jurnal Mengajar': teachingJournals.length,
    'Modul Ajar': teachingModules.length,
    'Notifikasi System': notifications.length,
    'Audit Log': activityLogs.length
  };

  const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);
  const now = new Date();
  const backupId = `bkp_${Date.now()}`;
  const timestampStr = now.toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
  const fileName = `Backup_GuruKu_Full_${timestampStr}.json`;

  const metadata: BackupMetadata = {
    id: backupId,
    name: `Full System Backup ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`,
    fileName,
    fileSize: '0 Bytes',
    type: 'FULL_SYSTEM',
    status: 'COMPLETED',
    appName: 'GuruKu - Sistem Informasi Akademik',
    appVersion: 'v2.5.0',
    dbVersion: 'v2.5.0',
    backupDate: `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID')} WIB`,
    backupTimestamp: now.getTime(),
    createdBy: currentAdmin.id,
    createdByName: currentAdmin.fullName,
    tableCount: 13,
    totalRecords,
    recordCounts
  };

  const schemaSql = generateSupabaseSQLScript();

  const rawPayload: FullBackupPayload = {
    metadata,
    schemaSql,
    data: {
      profiles,
      subjects,
      classes,
      teacherAssignments,
      students,
      schoolPrincipals,
      academicYears,
      grades,
      attendance,
      teachingJournals,
      teachingModules,
      moduleArchives,
      systemSettings,
      notifications,
      activityLogs
    }
  };

  const jsonStr = JSON.stringify(rawPayload);
  const sizeBytes = new Blob([jsonStr]).size;
  rawPayload.metadata.fileSize = formatBytes(sizeBytes);

  if (onProgress) onProgress('Menyimpan riwayat backup ke database Supabase...', 95);

  // Save history record to Supabase
  await saveBackupHistoryRecord({
    id: backupId,
    name: rawPayload.metadata.name,
    file_name: fileName,
    file_size: rawPayload.metadata.fileSize,
    type: 'FULL_SYSTEM',
    status: 'COMPLETED',
    created_by: currentAdmin.id,
    created_by_name: currentAdmin.fullName,
    app_version: 'v2.5.0',
    db_version: 'v2.5.0',
    record_counts: recordCounts,
    backup_data: rawPayload,
    created_at: now.toISOString()
  });

  if (onProgress) onProgress('Backup selesai!', 100);

  return rawPayload;
}

// Save backup record into Supabase system_backups table & localStorage
export async function saveBackupHistoryRecord(record: BackupHistoryRecord): Promise<boolean> {
  const client = getSupabaseClient();
  let savedToSupabase = false;

  if (client) {
    try {
      const { error } = await client.from('system_backups').insert([{
        id: record.id,
        name: record.name,
        file_name: record.file_name,
        file_size: record.file_size,
        type: record.type,
        status: record.status,
        created_by: record.created_by,
        created_by_name: record.created_by_name,
        app_version: record.app_version,
        db_version: record.db_version,
        record_counts: record.record_counts,
        backup_data: record.backup_data,
        created_at: record.created_at
      }]);
      if (!error) savedToSupabase = true;
    } catch (err) {
      console.warn('Could not insert backup into Supabase system_backups:', err);
    }
  }

  // Also store in localStorage history list
  try {
    const existingStr = localStorage.getItem(LOCAL_BACKUP_STORAGE_KEY);
    let list: BackupHistoryRecord[] = existingStr ? JSON.parse(existingStr) : [];
    // Strip heavy backup_data in list view to conserve localStorage
    const recordSummary = { ...record };
    delete recordSummary.backup_data;
    list = [recordSummary, ...list.filter((r) => r.id !== record.id)].slice(0, 30);
    localStorage.setItem(LOCAL_BACKUP_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed saving backup history to localStorage:', err);
  }

  return savedToSupabase;
}

// Fetch Backup History Records
export async function fetchBackupHistoryRecords(): Promise<BackupHistoryRecord[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('system_backups')
        .select('id, name, file_name, file_size, type, status, created_by, created_by_name, app_version, db_version, record_counts, created_at')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as BackupHistoryRecord[];
      }
    } catch (err) {
      console.warn('Error fetching backup history from Supabase:', err);
    }
  }

  // Fallback to localStorage
  try {
    const existingStr = localStorage.getItem(LOCAL_BACKUP_STORAGE_KEY);
    if (existingStr) return JSON.parse(existingStr);
  } catch (err) {
    console.warn('Error reading local backup history:', err);
  }

  return [];
}

// Delete Backup Record
export async function deleteBackupHistoryRecord(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('system_backups').delete().eq('id', id);
    } catch (err) {
      console.warn('Error deleting backup from Supabase:', err);
    }
  }

  try {
    const existingStr = localStorage.getItem(LOCAL_BACKUP_STORAGE_KEY);
    if (existingStr) {
      let list: BackupHistoryRecord[] = JSON.parse(existingStr);
      list = list.filter((r) => r.id !== id);
      localStorage.setItem(LOCAL_BACKUP_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.warn('Error deleting backup from localStorage:', err);
  }

  return true;
}

// Trigger browser file download
export function triggerDownloadBackupFile(payload: FullBackupPayload, format: 'JSON' | 'SQL' = 'JSON') {
  let blob: Blob;
  let extension = 'json';

  if (format === 'SQL') {
    const sqlContent = convertPayloadToSQLScript(payload);
    blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    extension = 'sql';
  } else {
    const jsonContent = JSON.stringify(payload, null, 2);
    blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    extension = 'json';
  }

  const baseName = payload.metadata.fileName.replace(/\.json$/, '');
  const downloadName = `${baseName}.${extension}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Validate Backup Payload Integrity
export function validateBackupFileContent(jsonContent: string): { isValid: boolean; payload?: FullBackupPayload; message: string } {
  try {
    const obj = JSON.parse(jsonContent);
    if (!obj || typeof obj !== 'object') {
      return { isValid: false, message: 'Format file tidak valid (Bukan JSON object).' };
    }

    if (!obj.metadata || !obj.data) {
      return { isValid: false, message: 'Struktur file backup tidak lengkap (Atribut metadata / data hilang).' };
    }

    if (!obj.data.profiles || !Array.isArray(obj.data.profiles)) {
      return { isValid: false, message: 'Data profiles/pengguna tidak ditemukan dalam file backup.' };
    }

    return { isValid: true, payload: obj as FullBackupPayload, message: 'File backup valid dan siap dipulihkan.' };
  } catch (err: any) {
    return { isValid: false, message: 'Gagal menguraikan file JSON: ' + (err.message || err) };
  }
}

// Restore Full Backup Payload into Database & Context State
export async function restoreFullBackupData(
  payload: FullBackupPayload,
  onProgress?: (status: string, pct: number, processed: number, total: number) => void
): Promise<{ success: boolean; message: string; recordCounts: Record<string, number> }> {
  const client = getSupabaseClient();
  const data = payload.data;
  let processed = 0;

  const totalItemCount =
    (data.profiles?.length || 0) +
    (data.subjects?.length || 0) +
    (data.classes?.length || 0) +
    (data.students?.length || 0) +
    (data.schoolPrincipals?.length || 0) +
    (data.grades?.length || 0) +
    (data.attendance?.length || 0) +
    (data.teachingJournals?.length || 0) +
    (data.teachingModules?.length || 0) +
    1; // Settings

  const updateProgress = (stepName: string, addCount = 0) => {
    processed += addCount;
    const pct = Math.min(Math.round((processed / Math.max(totalItemCount, 1)) * 100), 100);
    if (onProgress) onProgress(stepName, pct, processed, totalItemCount);
  };

  updateProgress('Menyiapkan koneksi pemulihan database...', 0);

  if (client) {
    try {
      // 1. Profiles
      if (data.profiles && data.profiles.length > 0) {
        updateProgress('Memulihkan Master Data Pengguna & Guru...', 0);
        const rows = data.profiles.map((p) => ({
          id: p.id,
          email: p.email,
          username: p.username,
          full_name: p.fullName,
          role: p.role,
          nip_nuptk: p.nipNuptk,
          phone: p.phone,
          avatar_url: p.avatarUrl,
          created_at: p.createdAt || new Date().toISOString()
        }));
        await client.from('profiles').upsert(rows);
        updateProgress('Master Data Pengguna dipulihkan', data.profiles.length);
      }

      // 2. Subjects
      if (data.subjects && data.subjects.length > 0) {
        updateProgress('Memulihkan Data Mata Pelajaran...', 0);
        const rows = data.subjects.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          description: s.description,
          teacher_ids: s.teacherIds || []
        }));
        await client.from('subjects').upsert(rows);
        updateProgress('Data Mata Pelajaran dipulihkan', data.subjects.length);
      }

      // 3. Classes
      if (data.classes && data.classes.length > 0) {
        updateProgress('Memulihkan Data Kelas & Rombel...', 0);
        const rows = data.classes.map((c) => ({
          id: c.id,
          name: c.name,
          grade_level: c.gradeLevel,
          academic_year: c.academicYear,
          homeroom_teacher_id: c.homeroomTeacherId || null,
          teacher_ids: c.teacherIds || []
        }));
        await client.from('classes').upsert(rows);
        updateProgress('Data Kelas dipulihkan', data.classes.length);
      }

      // 4. Students
      if (data.students && data.students.length > 0) {
        updateProgress('Memulihkan Data Siswa...', 0);
        // Batch in chunks of 50 to avoid payload size limit
        const chunkSize = 50;
        for (let i = 0; i < data.students.length; i += chunkSize) {
          const chunk = data.students.slice(i, i + chunkSize);
          const rows = chunk.map((st) => ({
            id: st.id,
            nis: st.nis,
            full_name: st.fullName,
            gender: st.gender,
            birth_place: st.birthPlace,
            birth_date: st.birthDate,
            religion: st.religion,
            address: st.address,
            parent_name: st.parentName,
            parent_phone: st.parentPhone,
            class_id: st.classId
          }));
          await client.from('students').upsert(rows);
          updateProgress('Memulihkan Batch Siswa...', chunk.length);
        }
      }

      // 5. School Principals
      if (data.schoolPrincipals && data.schoolPrincipals.length > 0) {
        const rows = data.schoolPrincipals.map((p) => ({
          id: p.id,
          full_name: p.fullName,
          title: p.title,
          nuks: p.nuks,
          position: p.position,
          is_active: p.isActive
        }));
        await client.from('school_principals').upsert(rows);
        updateProgress('Data Kepala Sekolah dipulihkan', data.schoolPrincipals.length);
      }

      // 6. Grades
      if (data.grades && data.grades.length > 0) {
        updateProgress('Memulihkan Data Nilai & Evaluasi...', 0);
        const chunkSize = 50;
        for (let i = 0; i < data.grades.length; i += chunkSize) {
          const chunk = data.grades.slice(i, i + chunkSize);
          const rows = chunk.map((g) => ({
            id: g.id,
            student_id: g.studentId,
            subject_id: g.subjectId,
            class_id: g.classId,
            teacher_id: g.teacherId,
            semester: g.semester,
            academic_year: g.academicYear,
            assignment_score: g.assignmentScore,
            daily_score: g.dailyScore,
            pts_score: g.ptsScore,
            pas_score: g.pasScore,
            final_score: g.finalScore,
            predicate: g.predicate,
            notes: g.notes
          }));
          await client.from('grades').upsert(rows);
          updateProgress('Memulihkan Batch Nilai...', chunk.length);
        }
      }

      // 7. Attendance
      if (data.attendance && data.attendance.length > 0) {
        updateProgress('Memulihkan Data Absensi Harian...', 0);
        const chunkSize = 50;
        for (let i = 0; i < data.attendance.length; i += chunkSize) {
          const chunk = data.attendance.slice(i, i + chunkSize);
          const rows = chunk.map((a) => ({
            id: a.id,
            student_id: a.studentId,
            class_id: a.classId,
            subject_id: a.subjectId,
            date: a.date,
            status: a.status,
            notes: a.notes,
            teacher_id: a.teacherId
          }));
          await client.from('attendance').upsert(rows);
          updateProgress('Memulihkan Batch Absensi...', chunk.length);
        }
      }

      // 8. Teaching Journals
      if (data.teachingJournals && data.teachingJournals.length > 0) {
        updateProgress('Memulihkan Jurnal Mengajar Guru...', 0);
        const rows = data.teachingJournals.map((j) => ({
          id: j.id,
          date: j.date,
          subject_id: j.subjectId,
          class_id: j.classId,
          teacher_id: j.teacherId,
          time_slot: j.timeSlot,
          topic: j.topic,
          method: j.method,
          attendee_count: j.attendeeCount,
          notes: j.notes
        }));
        await client.from('teaching_journals').upsert(rows);
        updateProgress('Jurnal Mengajar dipulihkan', data.teachingJournals.length);
      }

      // 9. Teaching Modules
      if (data.teachingModules && data.teachingModules.length > 0) {
        updateProgress('Memulihkan Arsip Modul Ajar / RPP...', 0);
        const rows = data.teachingModules.map((m) => ({
          id: m.id,
          title: m.title,
          subject_id: m.subjectId,
          class_level: m.classLevel,
          semester: m.semester,
          academic_year: m.academicYear,
          description: m.description,
          file_type: m.fileType,
          file_name: m.fileName,
          file_size: m.fileSize,
          file_drive_id: m.fileDriveId,
          web_view_link: m.webViewLink,
          web_content_link: m.webContentLink,
          teacher_id: m.teacherId
        }));
        await client.from('teaching_modules').upsert(rows);
        updateProgress('Modul Ajar dipulihkan', data.teachingModules.length);
      }

      // 10. System Settings
      if (data.systemSettings) {
        await client.from('system_settings').upsert([
          { key: 'main_config', value: data.systemSettings, updated_at: new Date().toISOString() }
        ]);
        if (data.academicYears && data.academicYears.length > 0) {
          await client.from('system_settings').upsert([
            { key: 'academic_years', value: data.academicYears, updated_at: new Date().toISOString() }
          ]);
        }
        updateProgress('Pengaturan Sistem dipulihkan', 1);
      }
    } catch (err: any) {
      console.error('Error restoring data to Supabase:', err);
      return {
        success: false,
        message: 'Gagal memulihkan data ke Supabase: ' + (err.message || err),
        recordCounts: payload.metadata.recordCounts || {}
      };
    }
  }

  updateProgress('Proses pemulihan data selesai 100%!', totalItemCount);

  return {
    success: true,
    message: 'Seluruh data aplikasi & database berhasil dipulihkan dari file backup!',
    recordCounts: payload.metadata.recordCounts || {}
  };
}
