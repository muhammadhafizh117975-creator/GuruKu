import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Subject } from '../../types';
import { Modal } from '../../components/common/Modal';
import { showConfirmModal } from '../../components/common/SweetAlert';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users
} from 'lucide-react';

export const MataPelajaranPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, teachers, addSubject, updateSubject, deleteSubject } = useData();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubj, setEditingSubj] = useState<Subject | null>(null);

  // Form State
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const isAdmin = user?.role === 'admin';

  const openCreateModal = () => {
    setEditingSubj(null);
    setCode('');
    setName('');
    setDescription('');
    setSelectedTeachers([]);
    setIsModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setEditingSubj(subj);
    setCode(subj.code);
    setName(subj.name);
    setDescription(subj.description || '');
    setSelectedTeachers(subj.teacherIds || []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    if (editingSubj) {
      updateSubject(editingSubj.id, {
        code,
        name,
        description,
        teacherIds: selectedTeachers
      });
    } else {
      addSubject({
        code,
        name,
        description,
        teacherIds: selectedTeachers
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = await showConfirmModal(
      'Hapus Mata Pelajaran',
      `Apakah Anda yakin ingin menghapus mata pelajaran ${name}?`,
      'Ya, Hapus'
    );
    if (confirm) {
      deleteSubject(id);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#696cff]" /> Data Mata Pelajaran
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola kurikulum dan daftar mata pelajaran sekolah</p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Mapel
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
          placeholder="Cari berdasarkan kode atau nama mata pelajaran..."
          className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Mata Pelajaran</th>
                <th className="px-6 py-4">Deskripsi / Kurikulum</th>
                {!isAdmin && user?.role === 'guru' && <th className="px-6 py-4">Guru Pengampu</th>}
                {isAdmin && <th className="px-6 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : (user?.role === 'guru' ? 4 : 3)} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada mata pelajaran ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subj) => {
                  return (
                    <tr key={subj.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#696cff]">{subj.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{subj.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{subj.description || '-'}</td>
                      {!isAdmin && user?.role === 'guru' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                              {user?.fullName || 'Guru Pengampu'}
                            </span>
                          </div>
                        </td>
                      )}
                      {isAdmin && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(subj)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#696cff] hover:bg-[#696cff]/10 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(subj.id, subj.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubj ? 'Edit Data Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Mapel *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: MTK-01"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Mata Pelajaran *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Matematika Terapan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Keterangan</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan ringkas cakupan materi..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#696cff]" /> Ploting Guru Pengampu Mapel Ini
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {teachers.map((t) => {
                const isChecked = selectedTeachers.includes(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeachers((prev) => [...prev, t.id]);
                        } else {
                          setSelectedTeachers((prev) => prev.filter((id) => id !== t.id));
                        }
                      }}
                      className="rounded text-[#696cff] focus:ring-[#696cff]"
                    />
                    <span>{t.fullName} ({t.nipNuptk})</span>
                  </label>
                );
              })}
            </div>
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
              Simpan Data Mapel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
