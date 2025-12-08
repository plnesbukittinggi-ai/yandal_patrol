
import React, { useState } from 'react';
import { ULPName, ULPData } from '../types';

interface AdminSettingsProps {
  masterData: Record<string, ULPData>;
  onAddPetugas: (ulp: ULPName, names: string[]) => void;
  onDeletePetugas: (ulp: ULPName, name: string) => void;
  onAddPenyulang: (ulp: ULPName, names: string[]) => void;
  onDeletePenyulang: (ulp: ULPName, name: string) => void;
  onInitDefault?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  masterData, 
  onAddPetugas, 
  onDeletePetugas, 
  onAddPenyulang,
  onDeletePenyulang,
  onInitDefault
}) => {
  const [selectedUlp, setSelectedUlp] = useState<ULPName | ''>('');
  const [newPetugas, setNewPetugas] = useState('');
  const [newPenyulang, setNewPenyulang] = useState('');

  const handleAddPetugasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUlp && newPetugas.trim()) {
      const names = newPetugas.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        onAddPetugas(selectedUlp, names);
        setNewPetugas('');
      }
    }
  };

  const handleAddPenyulangSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUlp && newPenyulang.trim()) {
      const names = newPenyulang.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        onAddPenyulang(selectedUlp, names);
        setNewPenyulang('');
      }
    }
  };

  const currentData = selectedUlp ? masterData[selectedUlp] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold text-blue-800">Petunjuk Pengisian Database</h3>
          <p className="text-sm text-blue-700 mt-1">
            Data yang Anda tambah atau hapus di sini akan <strong>otomatis tersimpan ke Google Spreadsheet</strong>. 
            Anda tidak perlu mengedit file Excel/Spreadsheet secara manual.
          </p>
          <p className="text-sm text-blue-700 mt-1">
             Gunakan fitur ini untuk menambah atau menghapus daftar Petugas dan Penyulang.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kelola Data Master</h2>
            <p className="text-slate-500">Edit daftar Petugas & Penyulang per ULP</p>
          </div>
          {onInitDefault && (
             <button 
              onClick={() => {
                if(window.confirm("Ini akan menimpa data di Spreadsheet dengan Data Default Aplikasi. Lanjutkan?")) {
                  onInitDefault();
                }
              }}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded border border-slate-300 transition-colors"
             >
               Inisialisasi Database ke Server
             </button>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih ULP</label>
          <select
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            value={selectedUlp}
            onChange={(e) => setSelectedUlp(e.target.value as ULPName)}
          >
            <option value="">-- Pilih Unit Layanan Pelanggan --</option>
            {Object.values(masterData).map((data: ULPData) => (
              <option key={data.name} value={data.name}>
                {data.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedUlp && (
          <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-400">Silahkan pilih ULP terlebih dahulu untuk melihat dan mengedit data.</p>
          </div>
        )}

        {selectedUlp && currentData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {/* Manage Petugas */}
            <div className="space-y-4">
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                <h3 className="font-semibold text-cyan-800 mb-2">Tambah Petugas</h3>
                <form onSubmit={handleAddPetugasSubmit} className="flex flex-col gap-2">
                  <textarea
                    placeholder="Masukkan nama petugas baru...&#10;Bisa input banyak sekaligus (pisahkan dengan Enter atau Koma)"
                    className="w-full px-3 py-2 border border-cyan-200 rounded text-sm focus:outline-none focus:border-cyan-500 min-h-[80px]"
                    value={newPetugas}
                    onChange={(e) => setNewPetugas(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newPetugas.trim()}
                    className="self-end bg-cyan-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    + Simpan ke Spreadsheet
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Daftar Petugas ({currentData.petugas.length})</h4>
                <div className="bg-white border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                  <ul className="divide-y divide-slate-100">
                    {currentData.petugas.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-slate-400 italic text-center">Belum ada data petugas</li>
                    ) : (
                      currentData.petugas.map((p, idx) => (
                        <li key={`${p}-${idx}`} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            {p}
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus petugas "${p}"? Data di spreadsheet juga akan terhapus.`)) {
                                onDeletePetugas(selectedUlp, p);
                              }
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Hapus Petugas"
                            aria-label={`Hapus petugas ${p}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Manage Penyulang */}
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h3 className="font-semibold text-amber-800 mb-2">Tambah Penyulang</h3>
                <form onSubmit={handleAddPenyulangSubmit} className="flex flex-col gap-2">
                  <textarea
                    placeholder="Masukkan nama penyulang baru...&#10;Bisa input banyak sekaligus (pisahkan dengan Enter atau Koma)"
                    className="w-full px-3 py-2 border border-amber-200 rounded text-sm focus:outline-none focus:border-amber-500 min-h-[80px]"
                    value={newPenyulang}
                    onChange={(e) => setNewPenyulang(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newPenyulang.trim()}
                    className="self-end bg-amber-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                     + Simpan ke Spreadsheet
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Daftar Penyulang ({currentData.penyulang.length})</h4>
                <div className="bg-white border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                  <ul className="divide-y divide-slate-100">
                    {currentData.penyulang.length === 0 ? (
                       <li className="px-4 py-3 text-sm text-slate-400 italic text-center">Belum ada data penyulang</li>
                    ) : (
                      currentData.penyulang.map((p, idx) => (
                        <li key={`${p}-${idx}`} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {p}
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus penyulang "${p}"? Data di spreadsheet juga akan terhapus.`)) {
                                onDeletePenyulang(selectedUlp, p);
                              }
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Hapus Penyulang"
                            aria-label={`Hapus penyulang ${p}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
