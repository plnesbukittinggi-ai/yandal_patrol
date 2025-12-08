
import React, { useState, useEffect } from 'react';
import { MONTHS, PHOTO_SECTIONS } from '../constants';
import { ReportData, ULPName, ULPData } from '../types';
import { PhotoUpload } from './PhotoUpload';

interface InputFormProps {
  onSubmit: (data: ReportData) => void;
  onCancel: () => void;
  masterData: Record<string, ULPData>;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, onCancel, masterData }) => {
  const [ulp, setUlp] = useState<ULPName | ''>('');
  const [noPenugasan, setNoPenugasan] = useState('');
  const [petugas1, setPetugas1] = useState('');
  const [petugas2, setPetugas2] = useState('');
  const [penyulang, setPenyulang] = useState('');
  const [keypoint, setKeypoint] = useState('');
  const [titikStart, setTitikStart] = useState('');
  const [titikFinish, setTitikFinish] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Photos state
  const [photosSebelum, setPhotosSebelum] = useState<(string | null)[]>(Array(6).fill(null));
  const [photosSesudah, setPhotosSesudah] = useState<(string | null)[]>(Array(6).fill(null));

  const [currentDate, setCurrentDate] = useState(new Date());

  // Update dependent dropdowns when ULP changes
  useEffect(() => {
    setPetugas1('');
    setPetugas2('');
    setPenyulang('');
  }, [ulp]);

  // Utility to resize image (Kompresi Gambar agar Upload Cepat)
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
          
          // Compress to JPEG 70% quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handlePhotoChange = async (index: number, type: 'sebelum' | 'sesudah', file: File) => {
    // Resize before setting state
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
    if (!ulp) return;
    
    setIsSubmitting(true);

    const newReport: ReportData = {
      id: crypto.randomUUID(),
      timestamp: currentDate.toISOString(),
      bulan: MONTHS[currentDate.getMonth()],
      noPenugasan,
      ulp,
      petugas1,
      petugas2,
      penyulang,
      keypoint,
      titikStart,
      titikFinish,
      photos: {
        sebelum: photosSebelum,
        sesudah: photosSesudah
      }
    };

    // Delay slightly to let UI show loading state
    setTimeout(() => {
        onSubmit(newReport);
        // Note: isSubmitting will be set to false by parent component or on unmount
    }, 100);
  };

  const ulpData = ulp ? masterData[ulp] : null;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h2 className="text-xl font-bold text-white">Input Data Penugasan Khusus</h2>
        <p className="text-primary-100 text-sm">Silahkan lengkapi form di bawah ini</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Section 1: Informasi Umum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Timestamp</label>
                <div className="mt-1 font-mono text-slate-900">{currentDate.toLocaleString('id-ID')}</div>
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Bulan</label>
                <div className="mt-1 font-semibold text-slate-900">{MONTHS[currentDate.getMonth()]}</div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No Penugasan Khusus</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Contoh: PK-2023-001"
              value={noPenugasan}
              onChange={(e) => setNoPenugasan(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ULP</label>
            <select 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              value={ulp}
              onChange={(e) => setUlp(e.target.value as ULPName)}
            >
              <option value="">-- Pilih ULP --</option>
              {Object.values(masterData).map((u: ULPData) => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          {ulpData ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Petugas 1</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Petugas 2</label>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penyulang</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  value={penyulang}
                  onChange={(e) => setPenyulang(e.target.value)}
                >
                  <option value="">-- Pilih Penyulang --</option>
                  {ulpData.penyulang.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          ) : (
             <div className="md:col-span-2 p-4 bg-amber-50 text-amber-800 text-sm rounded border border-amber-200">
                Data ULP, Petugas, dan Penyulang tidak ditemukan. Silahkan minta Admin untuk melakukan <b>Inisialisasi Database</b> di menu Kelola Data.
             </div>
          )}

          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">Nama Keypoint</label>
             <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Masukkan nama keypoint"
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
              placeholder="Koordinat / Lokasi"
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
              placeholder="Koordinat / Lokasi"
              value={titikFinish}
              onChange={(e) => setTitikFinish(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Foto Dokumentasi */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800">Dokumentasi Lapangan</h3>
             <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Foto otomatis dikompres & diupload ke Drive</span>
          </div>
          
          <div className="space-y-6">
            {PHOTO_SECTIONS.map((num, idx) => (
              <div key={num} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3 border-b border-slate-200 pb-2">Dokumentasi Area {num}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhotoUpload 
                    id={`sebelum-${num}`}
                    label={`Foto Sebelum ${num}`}
                    imageSrc={photosSebelum[idx]}
                    onImageChange={(file) => handlePhotoChange(idx, 'sebelum', file)}
                  />
                  <PhotoUpload 
                    id={`sesudah-${num}`}
                    label={`Foto Sesudah ${num}`}
                    imageSrc={photosSesudah[idx]}
                    onImageChange={(file) => handlePhotoChange(idx, 'sesudah', file)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur py-4 z-10">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengupload Foto...
              </>
            ) : (
              'Simpan Data'
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
