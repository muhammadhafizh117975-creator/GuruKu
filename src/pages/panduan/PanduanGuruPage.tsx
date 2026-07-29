import React, { useState } from 'react';
import {
  HelpCircle,
  LogIn,
  BookOpen,
  School,
  Award,
  CalendarCheck,
  FileText,
  FolderArchive,
  Printer,
  UserCheck,
  Search,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export const PanduanGuruPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const guideSections = [
    {
      id: 'login',
      category: 'Akun & Keamanan',
      icon: <LogIn className="w-5 h-5 text-[#696cff]" />,
      title: '1. Cara Login & Keamanan Akun',
      description:
        'Panduan lengkap cara masuk ke sistem GuruKu dan mengamankan akun Anda.',
      steps: [
        'Buka halaman awal aplikasi GuruKu. Halaman login langsung ditampilkan.',
        'Masukkan Email Sekolah yang telah terdaftar (contoh: budi@guruku.sch.id) dan kata sandi Anda.',
        'Sistem akan memverifikasi hak akses dan otomatis mengenali role Anda sebagai Guru tanpa perlu memilih tombol role.',
        'Untuk mengganti kata sandi atau foto profil, klik menu Profil di pojok kanan atas atau melalui menu navigasi samping.'
      ]
    },
    {
      id: 'master',
      category: 'Data Akademik',
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
      title: '2. Mengelola Mata Pelajaran, Kelas, & Siswa',
      description:
        'Melihat dan meninjau daftar mata pelajaran yang diampu serta daftar siswa per kelas.',
      steps: [
        'Pilih menu Data Master > Mata Pelajaran untuk melihat ringkasan mapel dan kode mapel.',
        'Pilih menu Kelas & Tingkat untuk melihat daftar kelas aktif dan wali kelas yang bertugas.',
        'Pilih menu Data Siswa untuk melihat detail nama siswa, NISN, jenis kelamin, serta status keaktifan.'
      ]
    },
    {
      id: 'akademik',
      category: 'Pembelajaran Harian',
      icon: <Award className="w-5 h-5 text-emerald-500" />,
      title: '3. Input Nilai, Absensi, & Jurnal Mengajar',
      description:
        'Pencatatan harian perkembangan belajar siswa, tingkat kehadiran, dan jurnal kegiatan kelas.',
      steps: [
        'Input Nilai Siswa: Buka menu Nilai Siswa > Pilih Kelas & Mapel > Isikan Nilai Harian, PTS, dan PAS > Klik Simpan Nilai.',
        'Presensi / Absensi Harian: Buka menu Absensi Siswa > Pilih Kelas & Tanggal > Tandai status kehadiran (Hadir, Izin, Sakit, Alfa) > Klik Simpan Presensi.',
        'Jurnal Mengajar Guru: Buka menu Jurnal Mengajar > Klik Tambah Jurnal > Isikan Materi / Ringkasan Pembelajaran & Catatan Kelas > Simpan Jurnal.'
      ]
    },
    {
      id: 'modul',
      category: 'Modul Ajar',
      icon: <FolderArchive className="w-5 h-5 text-amber-500" />,
      title: '4. Mengunggah Arsip Modul Ajar / RPP',
      description:
        'Menyimpan Modul Ajar, RPP, LKPD, dan media pembelajaran secara teratur ke sistem arsip sekolah.',
      steps: [
        'Masuk ke menu Arsip Modul / RPP di sidebar navigasi.',
        'Klik tab Unggah Baru.',
        'Isikan Judul Modul, Mata Pelajaran, Tingkat Kelas, Semester, dan Tahun Ajaran.',
        'Tarik & Lepas file dokumen (PDF, Word .docx, PPT .pptx, Excel .xlsx maks 25MB) pada area Dropzone.',
        'Klik tombol Simpan & Unggah Dokumen. File akan otomatis terunggah ke arsip sekolah dan dapat diakses kapan saja.'
      ]
    },
    {
      id: 'cetak',
      category: 'Laporan & Cetak',
      icon: <Printer className="w-5 h-5 text-rose-500" />,
      title: '5. Mencetak Laporan (Margin & Kop Surat)',
      description:
        'Mencetak rekapitulasi nilai, absensi, dan jurnal dengan format rapi beserta kop surat resmi sekolah.',
      steps: [
        'Buka salah satu menu Laporan (Laporan Nilai, Laporan Absensi, atau Laporan Jurnal).',
        'Pilih filter Kelas, Mata Pelajaran, atau Periode Tanggal yang diinginkan.',
        'Klik tombol Cetak Laporan / Export PDF.',
        'Pratinjau cetak akan otomatis menerapkan Margin Kertas (Top, Bottom, Left, Right) dan Kop Surat Resmi yang telah disetup oleh Administrator Sekolah.'
      ]
    },
    {
      id: 'profil',
      category: 'Profil',
      icon: <UserCheck className="w-5 h-5 text-cyan-500" />,
      title: '6. Mengubah Foto Profil & Password',
      description:
        'Memperbarui data pribadi, nomor HP, foto profil ke Google Drive, dan memperbarui kata sandi.',
      steps: [
        'Klik nama atau foto Anda di kanan atas, pilih Profil Pengguna.',
        'Di halaman Profil, Anda dapat memperbarui Nama Lengkap, NIP/NUPTK, dan Nomor Telepon.',
        'Arahkan kursor ke foto profil Anda, klik ikon Unggah Foto untuk memilih foto baru dari perangkat. Foto akan disimpan di Google Drive.',
        'Pada formulir Ubah Kata Sandi, isikan Kata Sandi Saat Ini, Kata Sandi Baru, dan Konfirmasi Kata Sandi Baru, lalu klik Perbarui Password.'
      ]
    }
  ];

  const filteredGuides = guideSections.filter((g) => {
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#181830] to-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#696cff]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Panduan Penggunaan Guru Pengajar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pusat Bantuan & User Manual GuruKu
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Panduan praktis penggunaan seluruh fitur akademik sekolah untuk mempermudah tugas mengajar, pencatatan presensi, nilai, jurnal, dan arsip modul harian.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari fitur, langkah kerja, atau modul..."
            className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto w-full md:w-auto">
          {['all', 'Akun & Keamanan', 'Data Akademik', 'Pembelajaran Harian', 'Modul Ajar', 'Laporan & Cetak', 'Profil'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#696cff] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua Topik' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGuides.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Topik panduan tidak ditemukan.</p>
            <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
          </div>
        ) : (
          filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {guide.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{guide.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{guide.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] uppercase font-black tracking-wider text-slate-400">Langkah Operasional:</p>
                <ol className="space-y-2">
                  {guide.steps.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#696cff]/10 text-[#696cff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
