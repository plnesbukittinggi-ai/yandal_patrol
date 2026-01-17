
import React from 'react';
import { ReportData } from '../types';

interface DataTableProps {
  reports: ReportData[];
}

export const DataTable: React.FC<DataTableProps> = ({ reports }) => {
  if (reports.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500">Belum ada data laporan yang masuk.</p>
      </div>
    );
  }

  // Helper untuk mengecek tipe link
  const getImageLinkType = (str: string | null) => {
    if (!str) return null;
    if (str.startsWith('http')) return 'drive';
    if (str.startsWith('data:image')) return 'local';
    return null;
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
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="font-medium text-slate-900">{new Date(report.timestamp).toLocaleDateString('id-ID')}</div>
                  <div className="text-xs text-slate-500">{new Date(report.timestamp).toLocaleTimeString('id-ID')}</div>
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    {report.bulan}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-slate-700 align-top font-bold">
                    {report.noPenugasan}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="font-semibold text-primary">{report.ulp}</div>
                  <div className="text-xs text-slate-500 mt-1">Penyulang: {report.penyulang}</div>
                  <div className="mt-2 text-xs">
                    <div className="font-medium text-slate-700">1. {report.petugas1}</div>
                    <div className="font-medium text-slate-700">2. {report.petugas2}</div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                   <div className="text-sm font-medium mb-1">Keypoint : {report.keypoint}</div>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Start: {report.titikStart}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Finish: {report.titikFinish}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-wrap gap-2 max-w-[200px] justify-center">
                    {/* Foto Sebelum */}
                    {report.photos.sebelum.map((url, idx) => {
                        const type = getImageLinkType(url);
                        if (!type) return null;
                        return (
                            <a 
                                key={`seb-${idx}`} 
                                href={url || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    type === 'drive' 
                                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                                }`}
                                title={type === 'local' ? 'Sedang diupload / Belum sync' : 'Link Google Drive'}
                            >
                                Sblm {idx + 1}
                            </a>
                        );
                    })}
                    {/* Foto Sesudah */}
                    {report.photos.sesudah.map((url, idx) => {
                        const type = getImageLinkType(url);
                        if (!type) return null;
                        return (
                            <a 
                                key={`ses-${idx}`} 
                                href={url || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    type === 'drive' 
                                    ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                    : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                                }`}
                                title={type === 'local' ? 'Sedang diupload / Belum sync' : 'Link Google Drive'}
                            >
                                Ssdh {idx + 1}
                            </a>
                        );
                    })}
                    
                    {!report.photos.sebelum.some(getImageLinkType) && !report.photos.sesudah.some(getImageLinkType) && (
                         <span className="text-xs text-slate-400 italic">Tidak ada foto</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
