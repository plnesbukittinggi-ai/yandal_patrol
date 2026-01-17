
import React, { useState } from 'react';
import { ReportData } from '../types';

interface DataTableProps {
  reports: ReportData[];
}

export const DataTable: React.FC<DataTableProps> = ({ reports }) => {
  const [previewImage, setPreviewImage] = useState<{ url: string } | null>(null);

  if (reports.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-[2rem] shadow-sm border border-slate-200">
        <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
          Belum ada data laporan
        </p>
      </div>
    );
  }

  /* =====================================================
   * FORMAT URL FOTO & PERBAIKAN KARAKTER ILEGAL
   * ===================================================== */
  const formatImageUrl = (url: any): string => {
    if (!url || typeof url !== 'string') return '';
    let clean = url.trim();

    // Base64 handling & fix illegal character (space back to +)
    if (clean.startsWith('data:image')) {
      const parts = clean.split(',');
      if (parts.length > 1) {
        // Hanya ganti spasi di bagian data (setelah koma)
        return parts[0] + ',' + parts[1].replace(/\s/g, '+');
      }
      return clean;
    }

    // Google Drive
    if (clean.includes('drive.google.com/file/d/')) {
      const id = clean.split('/d/')[1]?.split('/')[0];
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }

    return clean;
  };

  const isValidImage = (str: any): boolean => {
    if (!str || typeof str !== 'string') return false;
    const s = str.trim();
    return s.startsWith('data:image') || s.startsWith('http');
  };

  /* =====================================================
   * KOMPONEN FOTO
   * ===================================================== */
  const PhotoCard = ({
    url,
    label,
    type,
  }: {
    url: string;
    label: string;
    type: 'sebelum' | 'sesudah';
  }) => {
    const finalUrl = formatImageUrl(url);
    if (!finalUrl) return null;

    return (
      <div
        className="group relative flex flex-col items-center gap-1 cursor-pointer"
        onClick={() => setPreviewImage({ url: finalUrl })}
      >
        <div
          className={`w-10 h-10 rounded-lg border-2 overflow-hidden shadow-sm transition-transform group-hover:scale-110 ${
            type === 'sebelum'
              ? 'border-amber-200 bg-amber-50'
              : 'border-cyan-200 bg-cyan-50'
          }`}
        >
          <img
            src={finalUrl}
            alt={label}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80?text=ERR";
            }}
          />
        </div>
        <span
          className={`text-[6px] font-black uppercase tracking-tighter leading-none ${
            type === 'sebelum' ? 'text-amber-600' : 'text-cyan-600'
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Waktu</th>
              <th className="px-6 py-4 font-semibold">No. Penugasan</th>
              <th className="px-6 py-4 font-semibold">ULP / Petugas</th>
              <th className="px-6 py-4 font-semibold">Lokasi</th>
              <th className="px-6 py-4 font-semibold text-center">Dokumentasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => {
              const validSebelum = report.photos.sebelum.filter(isValidImage);
              const validSesudah = report.photos.sesudah.filter(isValidImage);
              
              return (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap align-top">
                    <div className="font-medium text-slate-900">{new Date(report.timestamp).toLocaleDateString('id-ID')}</div>
                    <div className="text-xs text-slate-500">{new Date(report.timestamp).toLocaleTimeString('id-ID')} WIB</div>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                      {report.bulan}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700 align-top font-bold">
                      {report.noPenugasan}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-primary">{report.ulp}</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Penyulang: {report.penyulang}</div>
                    <div className="mt-2 text-xs space-y-0.5">
                      <div className="font-medium text-slate-700 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-300"></div> {report.petugas1}</div>
                      <div className="font-medium text-slate-700 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-300"></div> {report.petugas2}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                     <div className="text-xs font-black text-slate-800 mb-2 uppercase">Keypoint: {report.keypoint}</div>
                    <div className="flex flex-col gap-1.5 text-[10px]">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="font-bold">START:</span> {report.titikStart}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="font-bold">FINISH:</span> {report.titikFinish}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-4 items-center">
                      {validSebelum.length > 0 && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[6px] font-black text-amber-500 uppercase tracking-widest">Sebelum</span>
                          <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                            {validSebelum.map((u, i) => (
                              <PhotoCard
                                key={`sb-${report.id}-${i}`}
                                url={u!}
                                label={`FOTO ${i + 1}`}
                                type="sebelum"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {validSesudah.length > 0 && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[6px] font-black text-cyan-500 uppercase tracking-widest">Sesudah</span>
                          <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                            {validSesudah.map((u, i) => (
                              <PhotoCard
                                key={`sd-${report.id}-${i}`}
                                url={u!}
                                label={`FOTO ${i + 1}`}
                                type="sesudah"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FITUR PREVIEW FOTO */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4 animate-fade-in" 
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage.url} 
            alt="Preview" 
            className="w-full max-w-md aspect-square object-contain bg-slate-100 rounded-3xl shadow-2xl" 
            referrerPolicy="no-referrer" 
          />
          <p className="text-white text-[10px] mt-4 font-bold uppercase tracking-widest">
            Sentuh untuk menutup
          </p>
        </div>
      )}
    </div>
  );
};
