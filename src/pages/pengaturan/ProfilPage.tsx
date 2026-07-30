import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { showSuccessToast, showErrorToast } from '../../components/common/SweetAlert';
import { User, Shield, Mail, Phone, Upload, Key, Activity, Clock } from 'lucide-react';

export const ProfilPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { activityLogs } = useData();

  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [nipNuptk, setNipNuptk] = useState<string>(user?.nipNuptk || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setNipNuptk(user.nipNuptk || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const userLogs = activityLogs.filter((l) => l.userId === user?.id || user?.role === 'admin');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for NIP / NUPTK
    const cleanNip = nipNuptk.trim();
    if (!cleanNip) {
      showErrorToast('NIP / NUPTK tidak boleh kosong.');
      return;
    }
    if (!/^[\d\s\-]{5,30}$/.test(cleanNip)) {
      showErrorToast('Format NIP / NUPTK tidak valid. Harus berisi 5 - 30 karakter angka, spasi, atau tanda hubung (-).');
      return;
    }

    if (!fullName.trim()) {
      showErrorToast('Nama Lengkap tidak boleh kosong.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showErrorToast('Format Email Sekolah tidak valid.');
      return;
    }

    setIsSaving(true);
    const success = await updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      nipNuptk: cleanNip,
      phone: phone.trim(),
      avatarUrl
    });
    setIsSaving(false);
    if (success) {
      showSuccessToast('Profil dan NIP / NUPTK berhasil diperbarui ke database.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const driveFile = await GoogleDriveService.uploadFile(file, 'Profiles', user?.id);
        setAvatarUrl(driveFile.webViewLink);
        showSuccessToast('Foto profil berhasil diunggah ke Google Drive.');
      } catch (err: any) {
        showErrorToast('Gagal mengunggah foto profil ke Google Drive.');
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showErrorToast('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    showSuccessToast('Kata sandi berhasil diperbarui.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-[#696cff]" /> Profil Pengguna ({user?.role === 'admin' ? 'Administrator' : 'Guru'})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola informasi pribadi, foto profil, dan kata sandi akun Anda</p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-[#696cff]/10 text-[#696cff] font-extrabold text-xs capitalize flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Role: {user?.role}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card & Edit Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#696cff]/20"
                />
                <label
                  htmlFor="avatar-upload-input"
                  className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                </label>
                <input
                  type="file"
                  id="avatar-upload-input"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{user?.fullName}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">NIP / NUPTK:</span>
                  <input
                    type="text"
                    value={nipNuptk}
                    onChange={(e) => setNipNuptk(e.target.value)}
                    placeholder="Masukkan NIP / NUPTK"
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-[#696cff] focus:ring-2 focus:ring-[#696cff] outline-none"
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Informasi Akun</h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Sekolah *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@guruku.sch.id"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={nipNuptk}
                    onChange={(e) => setNipNuptk(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor Telepon / WA</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-md shadow-[#696cff]/20 transition-all"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password / Admin Policy */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#696cff]" /> Ubah Kata Sandi
            </h4>

            {user?.role === 'guru' ? (
              <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#696cff]" /> Kebijakan Keamanan Akun Guru
                </p>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  Guru tidak lagi dapat mereset atau mengubah kata sandi secara mandiri. Reset kata sandi akun Guru dilakukan secara terpusat oleh <strong>Administrator Sekolah</strong> melalui menu <strong>Data Guru</strong>.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-indigo-200/60 dark:border-indigo-800/60">
                  Silakan hubungi Admin / Tim IT Sekolah jika Anda memerlukan reset kata sandi baru.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Saat Ini</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Baru</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Kata Sandi Baru</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs"
                  >
                    Perbarui Password Admin
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#696cff]" /> Log Aktivitas Pengguna
            </h3>
            <p className="text-xs text-slate-400">Riwayat tindakan dan perubahan data yang dilakukan oleh akun Anda</p>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {userLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada catatan aktivitas recorded.</p>
              ) : (
                userLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#696cff]">{log.action}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
