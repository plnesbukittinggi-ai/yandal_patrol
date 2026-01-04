
import React, { useState } from 'react';
import { UserRole, ULPName, ULPData, LoginSession } from '../types';

interface LoginConfigProps {
  role: UserRole;
  masterData: Record<string, ULPData>;
  onConfirm: (session: LoginSession) => void;
  onBack: () => void;
  appLogo: string;
}

export const LoginConfig: React.FC<LoginConfigProps> = ({ role, masterData, onConfirm, onBack, appLogo }) => {
  const [ulp, setUlp] = useState<ULPName | ''>('');
  const [petugas1, setPetugas1] = useState('');
  const [petugas2, setPetugas2] = useState('');

  const isGuest = role === UserRole.GUEST;
  const ulpData = ulp ? masterData[ulp] : null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ulp) return;
    if (!isGuest && (!petugas1 || !petugas2)) return;

    onConfirm({
      ulp: ulp as ULPName,
      petugas1: isGuest ? null : petugas1,
      petugas2: isGuest ? null : petugas2
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 animate-fade-in">
        <div className="text-center mb-6">
          <img src={appLogo} alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
          <h2 className="text-xl font-bold text-slate-800">Konfigurasi Akses</h2>
          <p className="text-slate-500 text-sm">
            {isGuest ? 'Pilih Unit untuk menampilkan data' : 'Pilih Unit dan Nama Petugas'}
          </p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih ULP</label>
            <select
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              value={ulp}
              onChange={(e) => {
                setUlp(e.target.value as ULPName);
                setPetugas1('');
                setPetugas2('');
              }}
            >
              <option value="">-- Pilih ULP --</option>
              {Object.values(masterData).map((u) => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          {!isGuest && ulpData && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Petugas 1</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  value={petugas1}
                  onChange={(e) => setPetugas1(e.target.value)}
                >
                  <option value="">-- Pilih Petugas 1 --</option>
                  {ulpData.petugas.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Petugas 2</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  value={petugas2}
                  onChange={(e) => setPetugas2(e.target.value)}
                >
                  <option value="">-- Pilih Petugas 2 --</option>
                  {ulpData.petugas.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={!ulp || (!isGuest && (!petugas1 || !petugas2))}
              className="flex-[2] py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-cyan-800 transition-colors shadow-lg shadow-cyan-100 disabled:opacity-50"
            >
              Masuk Aplikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
