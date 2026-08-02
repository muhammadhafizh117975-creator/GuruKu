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
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
  Calendar,
  PhoneCall,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GuideSection {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  notes?: string;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const PanduanGuruPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const guideSections: GuideSection[] = [
    {
      id: 'login-rbac',
      category: 'Akun & Akses',
      icon: <LogIn className="w-5 h-5 text-[#696cff]" />,
      title: '1. Login & Hak Akses Guru (RBAC)',
      description: 'Panduan otentikasi masuk dan pembatasan data berbasis peran (Role-Based Access Control).',
      steps: [
        'Buka halaman utama sistem akademik GuruKu. Anda akan diarahkan ke form Login.',
        'Masukkan Email Sekolah yang telah diregistrasikan oleh Administrator (contoh: guru@guruku.sch.id) dan password Anda.',
        'Sistem akan memverifikasi akun Anda dan mengarahkan ke Dashboard Guru dengan hak akses terisolasi (RBAC).',
        'Jika data kelas atau mata pelajaran tidak muncul setelah login, artinya Administrator belum membuat Penugasan Mengajar untuk akun Anda. Hubungi Administrator Sekolah.'
      ],
      notes: 'Keamanan Data: Anda hanya dapat mengakses dan mengelola siswa pada kelas dan mata pelajaran yang ditugaskan kepada Anda.'
    },
    {
      id: 'dashboard-nav',
      category: 'Akun & Akses',
      icon: <Building2 className="w-5 h-5 text-indigo-500" />,
      title: '2. Navigasi Dashboard Guru',
      description: 'Penjelasan ringkasan data otomatis berbasis penugasan mengajar resmi.',
      steps: [
        'Setelah login, Dashboard secara otomatis menyajikan widget statistik: Total Kelas Diampu, Total Siswa, dan Jam Mengajar.',
        'Tinjau Jadwal Mengajar Harian pada panel utama untuk melihat urutan kelas dan jam pelajaran yang harus diampu.',
        'Gunakan menu Quick Access (Akses Cepat) untuk berpindah dengan satu klik ke Input Nilai, Absensi Siswa, atau Jurnal Mengajar.',
        'Dashboard guru terbebas dari data kelas atau mata pelajaran lain yang bukan merupakan penugasan resmi Anda.'
      ]
    },
    {
      id: 'profile-pwd',
      category: 'Profil & Keamanan',
      icon: <UserCheck className="w-5 h-5 text-cyan-500" />,
      title: '3. Kelola Profil & Kata Sandi (Password)',
      description: 'Memperbarui informasi pribadi, NUPTK, foto profil, dan mengganti kata sandi.',
      steps: [
        'Klik nama atau foto Anda pada sudut kanan atas header, lalu pilih Profil Pengguna.',
        'Untuk mengubah foto profil: Arahkan kursor ke avatar, klik tombol Unggah Foto, lalu pilih berkas foto dari perangkat Anda.',
        'Perbarui Nama Lengkap, NUPTK, Nomor Telepon, dan Alamat jika terdapat penyesuaian data.',
        'Untuk mengganti kata sandi: Masukkan Kata Sandi Saat Ini, ketik Kata Sandi Baru (minimal 6 karakter), lalu konfirmasi dan simpan.'
      ]
    },
    {
      id: 'class-student',
      category: 'Data Akademik',
      icon: <School className="w-5 h-5 text-sky-500" />,
      title: '4. Manajemen Kelas & Data Siswa',
      description: 'Cara meninjau daftar kelas yang diampu dan mencari informasi siswa.',
      steps: [
        'Masuk ke menu Data Master > Kelas & Tingkat untuk melihat daftar kelas yang ditugaskan kepada Anda.',
        'Klik menu Data Siswa untuk melihat seluruh daftar siswa pada kelas diampu.',
        'Gunakan kolom Pencarian Siswa (Ketik Nama atau NIS/NISN) untuk menemukan data siswa secara presisi.',
        'Filter siswa berdasarkan Kelas untuk mempermudah pengecekan status keaktifan dan jenis kelamin.'
      ]
    },
    {
      id: 'grades-mgmt',
      category: 'Pembelajaran & Nilai',
      icon: <Award className="w-5 h-5 text-emerald-500" />,
      title: '5. Input & Kelola Nilai Siswa',
      description: 'Cara memilih mapel/kelas, input nilai komponen, perhitungan otomatis, dan ekspor dokumen.',
      steps: [
        'Buka menu Akademik > Nilai Siswa.',
        'Pilih Mata Pelajaran dan Kelas Diampu pada dropdown filter di bagian atas.',
        'Isikan komponen nilai: Nilai Tugas (20%), Nilai Harian (30%), Nilai PTS (25%), dan Nilai PAS (25%).',
        'Sistem akan menghitung Nilai Akhir (0-100) dan Predikat (A, B, C, D) secara real-time berdasarkan bobot sekolah.',
        'Klik tombol Simpan Nilai untuk menyimpan ke database.',
        'Gunakan tombol Cetak PDF atau Export Excel untuk mengunduh rekapitulasi nilai yang sudah dilengkapi Kop Surat & Blok Tanda Tangan Resmi.'
      ]
    },
    {
      id: 'attendance-mgmt',
      category: 'Pembelajaran & Nilai',
      icon: <CalendarCheck className="w-5 h-5 text-teal-500" />,
      title: '6. Presensi & Absensi Siswa',
      description: 'Pencatatan presensi harian siswa per kelas dan rekapitulasi keikutsertaan.',
      steps: [
        'Masuk ke menu Akademik > Absensi Siswa.',
        'Pilih Mata Pelajaran, Kelas, dan Tanggal Pertemuan.',
        'Secara default seluruh siswa diset Hadir. Klik tombol status untuk mengubah menjadi Izin, Sakit, atau Alfa.',
        'Berikan catatan khusus pada kolom Keterangan jika siswa izin/sakit dengan surat pendukung.',
        'Klik Simpan Presensi. Data rekap harian dan bulanan akan otomatis terakumulasi.'
      ]
    },
    {
      id: 'journal-mgmt',
      category: 'Pembelajaran & Nilai',
      icon: <FileText className="w-5 h-5 text-amber-500" />,
      title: '7. Jurnal Mengajar Guru',
      description: 'Pencatatan materi pembelajaran harian, metode, jam pelajaran, dan lampiran berkas.',
      steps: [
        'Masuk ke menu Akademik > Jurnal Mengajar.',
        'Klik tombol + Tambah Jurnal Mengajar Baru.',
        'Isikan Tanggal, Jam Pelajaran, Materi/Topik Pembelajaran, Metode Mengajar, dan Jumlah Siswa Hadir.',
        'Opsional: Sematkan Google Drive File ID jika memiliki materi digital atau dokumentasi kelas.',
        'Klik Simpan. Jurnal mengajar siap dicetak dalam format landscape PDF untuk supervisi akademik.'
      ]
    },
    {
      id: 'module-archive',
      category: 'Dokumen & Modul',
      icon: <FolderArchive className="w-5 h-5 text-purple-500" />,
      title: '8. Pengarsipan Modul Ajar / RPP',
      description: 'Mengunggah, mengategorikan, dan menyimpan perangkat ajar guru.',
      steps: [
        'Masuk ke menu Akademik > Arsip Modul / RPP.',
        'Klik tab Unggah Modul Baru.',
        'Isi Judul Perangkat Ajar, Mata Pelajaran, Kelas, dan Deskripsi singkat.',
        'Unggah berkas dokumen (PDF, DOCX, PPTX maks 25MB) melalui area Dropzone.',
        'Modul yang diunggah akan tersimpan rapi dan dapat diunduh kembali kapan saja untuk kebutuhan akreditasi.'
      ]
    },
    {
      id: 'academic-year',
      category: 'Dokumen & Modul',
      icon: <Calendar className="w-5 h-5 text-rose-500" />,
      title: '9. Pengaturan Tahun Ajaran & Semester',
      description: 'Penjelasan mekanisme pendeteksian Tahun Ajaran dan Semester aktif.',
      steps: [
        'Sistem GuruKu secara otomatis menerapkan Tahun Ajaran (contoh: 2025/2026) dan Semester (Ganjil/Genap) aktif.',
        'Tahun Ajaran aktif ditetapkan secara terpusat oleh Administrator Sekolah pada Pengaturan Sistem.',
        'Seluruh input nilai, absensi, dan jurnal yang Anda masukkan secara otomatis diberi label Tahun Ajaran aktif tersebut.',
        'Anda dapat melihat status Tahun Ajaran aktif pada bagian atas header aplikasi.'
      ]
    }
  ];

  const faqItems: FaqItem[] = [
    {
      category: 'Akun & Akses',
      question: 'Mengapa mata pelajaran atau kelas diampu tidak muncul saat mengisi nilai/absensi?',
      answer: 'Hal ini terjadi karena Administrator Sekolah belum mengaitkan akun Guru Anda dengan Penugasan Mengajar (Mata Pelajaran & Kelas). Silakan hubungi Tim IT / Admin Sekolah untuk mengisikan penugasan mengajar Anda di menu Penugasan Guru.'
    },
    {
      category: 'Keamanan',
      question: 'Bagaimana jika saya lupa kata sandi (password) akun GuruKu?',
      answer: 'Hubungi Administrator Sekolah untuk meminta reset kata sandi akun Anda. Administrator memiliki kewenangan untuk mengatur ulang password guru melalui menu Manajemen Pengguna.'
    },
    {
      category: 'Cetak Dokumen',
      question: 'Mengapa dokumen PDF yang diunduh tidak memiliki Kop Surat atau Tanda Tangan?',
      answer: 'Pastikan Administrator Sekolah telah mengunggah Gambar Kop Surat dan mengaktifkan opsi "Tampilkan Kop Surat pada Hasil Cetak PDF" di Pengaturan Sistem. Untuk tanda tangan, pastikan data NUPTK Anda di halaman Profil sudah terisi.'
    },
    {
      category: 'Data Siswa',
      question: 'Bagaimana cara menambahkan siswa baru atau memperbaiki nama siswa yang salah?',
      answer: 'Data master siswa (Nama, NIS, NISN, Kelas) dikelola penuh oleh Administrator Sekolah. Jika terdapat kesalahan penulisan nama atau data siswa yang belum masuk, laporkan ke Bagian Kurikulum/Admin Sekolah.'
    },
    {
      category: 'Modul Ajar',
      question: 'Berapa batas ukuran maksimal berkas Modul Ajar / RPP yang dapat diunggah?',
      answer: 'Batas ukuran maksimal per berkas modul adalah 25 Megabyte (MB) dengan format yang didukung meliputi PDF, Word (.docx), PowerPoint (.pptx), dan Excel (.xlsx).'
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#181830] to-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#696cff]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Panduan & Bantuan Guru Pengajar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pusat Bantuan & Petunjuk Operasional GuruKu
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Panduan lengkap penggunaan sistem informasi akademik bagi Guru Pengajar. Temukan petunjuk langkah demi langkah pengisian nilai, absensi, jurnal mengajar, pengarsipan modul, serta penyelesaian kendala teknis.
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
            placeholder="Cari topik panduan, modul, atau cara kerja..."
            className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto w-full md:w-auto">
          {['all', 'Akun & Akses', 'Profil & Keamanan', 'Data Akademik', 'Pembelajaran & Nilai', 'Dokumen & Modul'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#696cff] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
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
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {guide.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{guide.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{guide.description}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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

              {guide.notes && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{guide.notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-[#696cff]/10 text-[#696cff] rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Pertanyaan Sering Diajukan (FAQ & Kendala Teknis)
            </h2>
            <p className="text-xs text-slate-400">
              Solusi cepat untuk kendala operasional yang sering ditemui saat mengajar
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#696cff] shrink-0" />
                    {item.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Contact Box */}
      <div className="bg-gradient-to-r from-[#696cff]/10 via-indigo-500/10 to-purple-500/10 dark:from-[#696cff]/20 dark:via-indigo-950/40 dark:to-purple-950/40 p-8 rounded-3xl border border-[#696cff]/20 dark:border-[#696cff]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#696cff] text-white text-[10px] font-extrabold uppercase tracking-wider">
            Kontak Bantuan Administrator
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
            Butuh Bantuan Lebih Lanjut atau Penugasan Khusus?
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Jika kendala Anda tidak terselesaikan melalui panduan di atas atau Anda memerlukan perubahan jadwal/penugasan kelas, hubungi tim IT Administrator Sekolah Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#696cff]" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Email Tim IT Admin</p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">admin@guruku.sch.id</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Helpdesk / WhatsApp</p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">(021) 555-0192</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
