import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ClassRoom } from '../../types';
import { Modal } from '../../components/common/Modal';
import { showConfirmModal } from '../../components/common/SweetAlert';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck
} from 'lucide-react';

export const KelasPage: React.FC = () => {
  const { user } = useAuth();
  const { classes, teachers, students, addClass, updateClass, deleteClass } = useData();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCls, setEditingCls] = useState<ClassRoom | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('7');
  const [academicYear, setAcademicYear] = useState<string>('2025/2026');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  const openCreateModal = () => {
    setEditingCls(null);
    setName('');
    setGradeLevel('7');
    setAcademicYear('2025/2026');
    setHomeroomTeacherId('');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassRoom) => {
    setEditingCls(cls);
    setName(cls.name);
    setGradeLevel(cls.gradeLevel);
    setAcademicYear(cls.academicYear);
    setHomeroomTeacherId(cls.homeroomTeacherId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gradeLevel) return;

    if (editingCls) {
      updateClass(editingCls.id, {
        name,
        gradeLevel,
        academicYear,
        homeroomTeacherId
      });
    } else {
      addClass({
        name,
        gradeLevel,
        academicYear,
        homeroomTeacherId
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = await showConfirmModal(
      'Hapus Kelas',
      `Apakah Anda yakin ingin menghapus Rombongan Belajar ${name}?`,
      'Ya, Hapus'
    );
    if (confirm) {
      deleteClass(id);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.academicYear.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <School className="w-6 h-6 text-[#696cff]" /> Data Kelas & Rombongan Belajar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola data kelas, tingkat pendidikan, dan wali kelas</p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Kelas Baru
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama kelas atau tahun ajaran..."
          className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => {
          const homeroom = teachers.find((t) => t.id === cls.homeroomTeacherId);
          const studentCount = students.filter((s) => s.classId === cls.id).length;

          return (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase bg-[#696cff]/10 text-[#696cff] px-3 py-1 rounded-full">
                    Tingkat {cls.gradeLevel}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{cls.academicYear}</span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{cls.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Total Siswa Terdaftar: <strong className="text-[#696cff]">{studentCount} siswa</strong></p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Wali Kelas:</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>{homeroom ? homeroom.fullName : 'Belum Ditentukan'}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(cls)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#696cff]/10 text-slate-700 dark:text-slate-200 hover:text-[#696cff] text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id, cls.name)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-700 dark:text-slate-200 hover:text-rose-500 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal CRUD */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCls ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Rombel / Kelas *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: 7-A, 10-MIPA-1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat *</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
                <option value="10">Kelas 10</option>
                <option value="11">Kelas 11</option>
                <option value="12">Kelas 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tahun Ajaran *</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Wali Kelas</label>
            <select
              value={homeroomTeacherId}
              onChange={(e) => setHomeroomTeacherId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            >
              <option value="">-- Pilih Wali Kelas --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.nipNuptk})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
