
import React, { useState, useMemo } from 'react';
import { ReportData, ULPData, ULPName } from '../types';

interface AdminRekapProps {
  reports: ReportData[];
  masterData: Record<string, ULPData>;
}

export const AdminRekap: React.FC<AdminRekapProps> = ({ reports, masterData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterUlp, setFilterUlp] = useState<ULPName | ''>('');

  const rekapData = useMemo(() => {
    // 1. Filter laporan berdasarkan tanggal
    const filteredReports = reports.filter(report => {
      const reportDate = new Date(report.timestamp).toISOString().split('T')[0];
      const startMatch = !startDate || reportDate >= startDate;
      const endMatch = !endDate || reportDate <= endDate;
      return startMatch && endMatch;
    });

    const rawResult: any[] = [];

    // 2. Iterasi melalui semua ULP di masterData
    Object.values(masterData).forEach(ulpData => {
      // Filter ULP jika ada input filter
      if (filterUlp && ulpData.name !== filterUlp) return;

      // 3. Iterasi setiap petugas di ULP tersebut
      ulpData.petugas.forEach(namaPetugas => {
        // Hitung realisasi (berapa kali petugas ini muncul di laporan yang sudah difilter tanggal)
        const totalRealisasi = filteredReports.filter(r => 
          r.ulp === ulpData.name && 
          (r.petugas1 === namaPetugas || r.petugas2 === namaPetugas)
        ).length;

        // Tentukan label bulan (berdasarkan filter atau default)
        let bulanLabel = "Semua";
        if (startDate && endDate) {
          const s = new Date(startDate).toLocaleString('id-ID', { month: 'short', year: '2-digit' });
          const e = new Date(endDate).toLocaleString('id-ID', { month: 'short', year: '2-digit' });
          bulanLabel = s === e ? s : `${s} - ${e}`;
        } else if (startDate) {
          bulanLabel = `Sejak ${new Date(startDate).toLocaleString('id-ID', { month: 'short' })}`;
        }

        rawResult.push({
          bulan: bulanLabel,
          nama: namaPetugas,
          ulp: ulpData.name,
          total: totalRealisasi
        });
      });
    });

    // 4. Sortir berdasarkan Total Realisasi terbesar (descending)
    // Jika total sama, sortir berdasarkan nama (ascending)
    rawResult.sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.nama.localeCompare(b.nama);
    });

    // 5. Tambahkan nomor urut setelah disortir
    return rawResult.map((item, index) => ({
      ...item,
      no: index + 1
    }));
  }, [reports, masterData, startDate, endDate, filterUlp]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800">Rekap Realisasi Petugas</h2>
          <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
            Urutan: Realisasi Terbanyak
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dari Tanggal</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter ULP</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterUlp}
              onChange={(e) => setFilterUlp(e.target.value as ULPName)}
            >
              <option value="">Semua ULP</option>
              {Object.values(ULPName).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); setFilterUlp(''); }}
              className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md text-sm transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-bold">No. Urut</th>
                <th className="px-6 py-3 font-bold">Bulan / Periode</th>
                <th className="px-6 py-3 font-bold">Nama Petugas</th>
                <th className="px-6 py-3 font-bold">ULP</th>
                <th className="px-6 py-3 font-bold text-center">Total Realisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rekapData.length > 0 ? (
                rekapData.map((item) => (
                  <tr key={`${item.ulp}-${item.nama}`} className={`hover:bg-slate-50 transition-colors ${item.no <= 3 && item.total > 0 ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-6 py-3 font-medium text-slate-400">
                      {item.no === 1 && item.total > 0 ? '🥇' : item.no === 2 && item.total > 0 ? '🥈' : item.no === 3 && item.total > 0 ? '🥉' : item.no}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{item.bulan}</td>
                    <td className="px-6 py-3 font-bold text-slate-800">{item.nama}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded uppercase border border-cyan-100">
                        {item.ulp.replace('ULP ', '')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-block min-w-[32px] px-2 py-1 rounded-full font-bold text-sm ${item.total > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {item.total}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                    Data tidak ditemukan untuk filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-[10px] text-slate-400 italic">
          * Data diurutkan berdasarkan realisasi terbanyak. Menampilkan seluruh petugas yang terdaftar di Master Data.
        </div>
      </div>
    </div>
  );
};
