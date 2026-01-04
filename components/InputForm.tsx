
import React, { useState, useEffect } from 'react';
import { MONTHS, PHOTO_SECTIONS } from '../constants';
import { ReportData, ULPName, ULPData, LoginSession } from '../types';
import { PhotoUpload } from './PhotoUpload';

interface InputFormProps {
  onSubmit: (data: ReportData) => void;
  onCancel: () => void;
  masterData: Record<string, ULPData>;
  sessionData: LoginSession;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, onCancel, masterData, sessionData }) => {
  const [noPenugasan, setNoPenugasan] = useState('');
  const [penyulang, setPenyulang] = useState('');
  const [keypoint, setKeypoint] = useState('');
  const [titikStart, setTitikStart] = useState('');
  const [titikFinish, setTitikFinish] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Photos state
  const [photosSebelum, setPhotosSebelum] = useState<(string | null)[]>(Array(6).fill(null));
  const [photosSesudah, setPhotosSesudah] = useState<(string | null)[]>(Array(6).fill(null));

  const [currentDate, setCurrentDate] = useState(new Date());

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handlePhotoChange = async (index: number, type: 'sebelum' | 'sesudah', file: File) => {
    const resizedImage = await resizeImage(file);
    if (type === 'sebelum') {
      const newPhotos = [...photosSebelum];
      newPhotos[index] = resizedImage;
      setPhotosSebelum(newPhotos);
    } else {
      const newPhotos = [...photosSesudah];
      newPhotos[index] = resizedImage;
      setPhotosSesudah(newPhotos);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData.ulp) return;
    
    setIsSubmitting(true);

    const newReport: ReportData = {
      id: crypto.randomUUID(),
      timestamp: currentDate.toISOString(),
      bulan: MONTHS[currentDate.getMonth()],
      noPenugasan,
      ulp: sessionData.ulp,
      petugas1: sessionData.petugas1 || 'N/A',
      petugas2: sessionData.petugas2 || 'N/A',
      penyulang,
      keypoint,
      titikStart,
      titikFinish,
      photos: {
        sebelum: photosSebelum,
        sesudah: photosSesudah
      }
    };

    setTimeout(() => {
        onSubmit(newReport);
    }, 100);
  };

  const ulpData = sessionData.ulp ? masterData[sessionData.ulp] : null;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h2 className="text-xl font-bold text-white">Input Laporan Patrol</h2>
        <p className="text-primary-100 text-sm">Lokasi Tugas: {sessionData.ulp}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Layanan</label>
                <div className="mt-1 font-bold text-primary">{sessionData.ulp}</div>
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Petugas 1</label>
                <div className="mt-1 font-semibold text-slate-800">{sessionData.petugas1 || '-'}</div>
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Petugas 2</label>
                <div className="mt-1 font-semibold text-slate-800">{sessionData.petugas2 || '-'}</div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No Penugasan Khusus</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="PK-XXXX-XXXX"
              value={noPenugasan}
              onChange={(e) => setNoPenugasan(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penyulang</label>
            {ulpData ? (
              <select 
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                value={penyulang}
                onChange={(e) => setPenyulang(e.target.value)}
              >
                <option value="">-- Pilih Penyulang --</option>
                {ulpData.penyulang.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input 
                required
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="Masukkan penyulang"
                value={penyulang}
                onChange={(e) => setPenyulang(e.target.value)}
              />
            )}
          </div>

          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">Nama Keypoint</label>
             <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nama Titik Keypoint"
              value={keypoint}
              onChange={(e) => setKeypoint(e.target.value)}
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Titik Start</label>
             <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Lokasi Mulai"
              value={titikStart}
              onChange={(e) => setTitikStart(e.target.value)}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Titik Finish</label>
             <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Lokasi Selesai"
              value={titikFinish}
              onChange={(e) => setTitikFinish(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800">Dokumentasi Lapangan</h3>
             <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Foto Dokumentasi</span>
          </div>
          
          <div className="space-y-6">
            {PHOTO_SECTIONS.map((num, idx) => (
              <div key={num} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3 border-b border-slate-200 pb-2">Area {num}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhotoUpload 
                    id={`sebelum-${num}`}
                    label={`Sebelum`}
                    imageSrc={photosSebelum[idx]}
                    onImageChange={(file) => handlePhotoChange(idx, 'sebelum', file)}
                  />
                  <PhotoUpload 
                    id={`sesudah-${num}`}
                    label={`Sesudah`}
                    imageSrc={photosSesudah[idx]}
                    onImageChange={(file) => handlePhotoChange(idx, 'sesudah', file)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur py-4 z-10">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Mengirim...' : 'Simpan Laporan'}
          </button>
        </div>

      </form>
    </div>
  );
};
