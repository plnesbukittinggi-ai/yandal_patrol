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
   * FORMAT URL FOTO (Base64 / Google Drive / HTTPS)
   * ===================================================== */
  const formatImageUrl = (url: any): string => {
    if (!url || typeof url !== 'string') return '';

    const clean = url.trim();

    // Base64
    if (clean.startsWith('data:image')) {
      const parts = clean.split(',');
      return parts.length > 1
        ? parts[0] + ',' + parts[1].replace(/\s/g, '+')
        : clean;
    }

    // Google Drive
    if (clean.includes('drive.google.com/file/d/')) {
      const id = clean.split('/d/')[1]?.split('/')[0];
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }

    return clean;
  };

  /* =====================================================
   * VALIDASI FOTO (JANGAN TERLALU KETAT)
   * ===================================================== */
  const isValidImage = (str: any): boolean => {
    if (!str || typeof str !== 'string') return false;

    const s = str.trim();
    return (
      s.startsWith('data:image') ||
      s.startsWith('http://') ||
      s.startsWith('https://')
    );
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
          className={`w-10 h-10 rounded-lg border-2 overflow-hidden shadow-sm ${
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
            onError={() => {
              console.error('Gagal load foto:', finalUrl);
            }}
          />
        </div>
        <span
          className={`text-[6px] font-black uppercase tracking-tighter ${
            type === 'sebelum' ? 'text-amber-600' : 'text-cyan-600'
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 font-black">Timeline</th>
                <th className="px-6 py-6 font-black">Assignment</th>
                <th className="px-6 py-6 font-black">Officer / Area</th>
                <th className="px-6 py-6 font-black">Location Detail</th>
                <th className="px-8 py-6 font-black text-center">Documentation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => {
                const validSebelum = report.photos.sebelum.filter(isValidImage);
                const validSesudah = report.photos.sesudah.filter(isValidImage);

                return (
                  <tr key={report.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-8 font-black">
                      {new Date(report.timestamp).toLocaleDateString('id-ID')}
                    </td>

                    <td className="px-6 py-8 font-mono font-black">
                      {report.noPenugasan}
                    </td>

                    <td className="px-6 py-8">
                      <div className="font-black">{report.petugas1}</div>
                      <div className="text-xs text-slate-400">
                        {report.petugas2}
                      </div>
                    </td>

                    <td className="px-6 py-8 text-xs">
                      {report.keypoint}
                    </td>

                    <td className="px-8 py-8">
                      <div className="flex flex-col gap-3 items-center">
                        {validSebelum.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {validSebelum.map((u, i) => (
                              <PhotoCard
                                key={`sb-${i}`}
                                url={u}
                                label={`FOTO ${i + 1}`}
                                type="sebelum"
                              />
                            ))}
                          </div>
                        )}

                        {validSesudah.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {validSesudah.map((u, i) => (
                              <PhotoCard
                                key={`sd-${i}`}
                                url={u}
                                label={`FOTO ${i + 1}`}
                                type="sesudah"
                              />
                            ))}
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
      </div>

      {/* PREVIEW FOTO */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage.url}
            className="w-full max-w-md object-contain rounded-3xl bg-white"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </>
  );
};
