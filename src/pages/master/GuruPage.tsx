import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Modal } from '../../components/common/Modal';
import { Profile } from '../../types';
import {
  Users,
  Plus,
  Search,
  KeyRound,
  ShieldAlert,
  Phone,
  Mail,
  BookOpen,
  UserCheck,
  AtSign,
  Lock,
  RefreshCw
} from 'lucide-react';

export const GuruPage: React.FC = () => {
  const { user, registerGuru, adminResetPasswordGuru } = useAuth();
  const { teachers, subjects } = useData();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Guru Form State
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [nipNuptk, setNipNuptk] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Reset Password Modal State
  const [resetModalTeacher, setResetModalTeacher] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('guru123');

  if (user?.role !== 'admin') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-8 rounded-3xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Akses Terbatas</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Menu Kelola Data Guru hanya dapat diakses oleh Administrator Sistem.
        </p>
      </div>
    );
  }

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.username && t.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.nipNuptk && t.nipNuptk.includes(searchTerm))
  );

  const handleCreateGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !nipNuptk) return;

    const success = await registerGuru(fullName, email, username, nipNuptk, phone);
    if (success) {
      setIsModalOpen(false);
      setFullName('');
      setUsername('');
      setEmail('');
      setNipNuptk('');
      setPhone('');
    }
  };

  const handleOpenResetModal = (teacher: Profile) => {
    setResetModalTeacher(teacher);
    setNewPassword('guru123');
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTeacher || !newPassword) return;

    await adminResetPasswordGuru(resetModalTeacher.id, resetModalTeacher.fullName, newPassword);
    setResetModalTeacher(null);
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#696cff]" /> Kelola Data Guru & Tenaga Pendidik
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Tambah akun guru baru, atur username login, dan reset password terpusat</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Guru Baru
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
        <UserCheck className="w-5 h-5 text-[#696cff] shrink-0" />
        <p>
          <strong>Ketentuan Akses Guru:</strong> Akun Guru melakukan login menggunakan <strong>Username</strong>. Reset password akun Guru kini dilakukan terpusat oleh Admin melalui tombol <strong>Reset Pass</strong> di bawah.
        </p>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari berdasarkan nama, username (@siti_rahma), NIP/NUPTK, atau email..."
          className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => {
          const assignedMapel = subjects.filter((s) => s.teacherIds?.includes(teacher.id));

          return (
            <div
              key={teacher.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt={teacher.fullName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#696cff]/30"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{teacher.fullName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase bg-[#696cff]/10 text-[#696cff] px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <AtSign className="w-2.5 h-2.5" />
                          {teacher.username || 'guru_user'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">NIP: {teacher.nipNuptk || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teacher.phone || 'Tidak ada no HP'}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {assignedMapel.length === 0 ? (
                        <span className="text-[10px] text-slate-400">Belum diampu mapel</span>
                      ) : (
                        assignedMapel.map((m) => (
                          <span key={m.id} className="text-[10px] bg-[#696cff]/10 text-[#696cff] font-semibold px-2 py-0.5 rounded-full">
                            {m.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2.5 py-1 rounded-full">
                  Status: Aktif
                </span>
                <button
                  onClick={() => handleOpenResetModal(teacher)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#696cff]/10 text-slate-700 dark:text-slate-200 hover:text-[#696cff] text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#696cff]" /> Reset Pass
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Guru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Akun Guru Baru"
        subtitle="Buatkan akun Guru dengan Username login unik dan password awal"
      >
        <form onSubmit={handleCreateGuru} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Siti Rahmawati, S.Pd."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Username Login Guru *</label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="contoh: siti_rahma"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff] font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Username digunakan oleh Guru untuk login ke sistem.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIP / NUPTK *</label>
            <input
              type="text"
              required
              value={nipNuptk}
              onChange={(e) => setNipNuptk(e.target.value)}
              placeholder="19850614 201001 2 015"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Sekolah *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guru@guruku.sch.id"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp / HP</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
            >
              Simpan Data Guru
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password by Admin */}
      <Modal
        isOpen={!!resetModalTeacher}
        onClose={() => setResetModalTeacher(null)}
        title="Reset Password Guru (Terpusat)"
        subtitle={resetModalTeacher ? `Set kata sandi baru untuk akun Guru ${resetModalTeacher.fullName}` : ''}
      >
        {resetModalTeacher && (
          <form onSubmit={handleConfirmResetPassword} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-100">{resetModalTeacher.fullName}</p>
              <p className="text-slate-500 dark:text-slate-400">Username Login: <strong className="text-[#696cff] font-mono">@{resetModalTeacher.username || 'guru_user'}</strong></p>
              <p className="text-slate-500 dark:text-slate-400">Email: {resetModalTeacher.email}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Baru
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 shrink-0"
                  title="Generate Pass Acak"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Acak
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Beritahukan kata sandi baru ini kepada Guru bersangkutan.</p>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResetModalTeacher(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
              >
                Simpan & Reset Password
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
