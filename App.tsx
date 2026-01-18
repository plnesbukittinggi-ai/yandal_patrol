
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, ViewState, ReportData, ULPName, ULPData, LoginSession } from './types';
import { InputForm } from './components/InputForm';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { AdminSettings } from './components/AdminSettings';
import { AdminRekap } from './components/AdminRekap';
import { LoginConfig } from './components/LoginConfig';
import { DATA_ULP as INITIAL_DATA_ULP } from './constants';
import { api } from './services/api';

const LOGO_URL = "https://plnes.co.id/_next/image?url=https%3A%2F%2Fcms.plnes.co.id%2Fuploads%2FLogo_HP_New_Temporary_09a9c5a521.png&w=750&q=75"; 
const APP_LOGO = "https://raw.githubusercontent.com/plnesbukittinggi-ai/yandal_patrol/main/ChatGPT%20Image%2018%20Des%202025%2C%2011.11.52.png";

declare global {
  interface Window {
    ExcelJS: any;
  }
}

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorLoad, setErrorLoad] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [session, setSession] = useState<LoginSession>({ ulp: null, petugas1: null, petugas2: null });

  const [tableStartDate, setTableStartDate] = useState('');
  const [tableEndDate, setTableEndDate] = useState('');
  const [tableUlpFilter, setTableUlpFilter] = useState<ULPName | ''>('');

  const [reports, setReports] = useState<ReportData[]>([]);
  const [masterData, setMasterData] = useState<Record<string, ULPData>>(INITIAL_DATA_ULP);

  useEffect(() => {
    const savedDemo = localStorage.getItem('yandal_demo_mode');
    if (savedDemo === 'true') {
      setIsDemoMode(true);
      const savedReports = localStorage.getItem('yandal_local_reports');
      if (savedReports) setReports(JSON.parse(savedReports));
    }
    fetchData(true);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (isDemoMode) return;
    
    if (showLoading) {
      setIsLoading(true);
      setErrorLoad(null);
    }
    try {
      const data = await api.getAllData();
      if (data) {
        if (data.reports) setReports(data.reports);
        if (data.masterData) setMasterData(data.masterData);
      }
    } catch (error: any) {
      console.error("Fetch failed:", error);
      setErrorLoad(error.message || "Gagal terhubung ke database.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setErrorLoad(null);
    localStorage.setItem('yandal_demo_mode', 'true');
    const saved = localStorage.getItem('yandal_local_reports');
    if (saved) setReports(JSON.parse(saved));
  };

  const handleInitialRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === UserRole.ADMIN) return; 
    setView('CONFIG');
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Adminbkt') {
      setRole(UserRole.ADMIN);
      setView('DASHBOARD');
      setShowAdminLogin(false);
    } else {
      setLoginError('Password salah!');
    }
  };

  const handleConfigConfirm = (conf: LoginSession) => {
    setSession(conf);
    setView(role === UserRole.GUEST ? 'TABLE' : 'INPUT');
  };

  const handleLogout = () => {
    setRole(null);
    setView('LOGIN');
    setShowAdminLogin(false);
    setSession({ ulp: null, petugas1: null, petugas2: null });
  };

  const handleBackToMenu = () => {
     if (view === 'CONFIG') {
        setView('LOGIN');
        setRole(null);
     } else if (view === 'INPUT' || view === 'TABLE' || view === 'DASHBOARD' || view === 'REKAP' || view === 'SETTINGS' || view === 'ABOUT') {
        // Jika Admin, balik ke Dashboard, jika User balik ke Login/Config
        if (role === UserRole.ADMIN) {
           setView('DASHBOARD');
        } else {
           setView('LOGIN');
           setRole(null);
        }
     }
  };

  const handleSaveReport = async (data: ReportData) => {
    setIsSyncing(true);
    try {
      if (isDemoMode) {
        const newReports = [data, ...reports];
        setReports(newReports);
        localStorage.setItem('yandal_local_reports', JSON.stringify(newReports));
      } else {
        await api.saveReport(data);
        setReports(prev => [data, ...prev]);
        setTimeout(() => fetchData(false), 2000);
      }
      alert('Laporan berhasil disimpan!');
      setView('TABLE');
    } catch (e) {
      alert("Gagal menyimpan ke server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredReportsForTable = useMemo(() => {
    return reports
      .filter(r => {
        const sessionMatch = !session.ulp || r.ulp === session.ulp;
        if (!sessionMatch) return false;
        const adminUlpMatch = role !== UserRole.ADMIN || !tableUlpFilter || r.ulp === tableUlpFilter;
        if (!adminUlpMatch) return false;
        const reportDate = new Date(r.timestamp).toISOString().split('T')[0];
        const startMatch = !tableStartDate || reportDate >= tableStartDate;
        const endMatch = !tableEndDate || reportDate <= tableEndDate;
        return startMatch && endMatch;
      })
      // SORT: Tanggal Terbaru ke Terlama
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, session.ulp, role, tableUlpFilter, tableStartDate, tableEndDate]);

  // ===============================
  // HELPERS FOR EXCEL EXPORT
  // ===============================
  const fixBase64 = (str: string) => {
    if (!str || !str.includes(',')) return null;
    const [meta, data] = str.split(',');
    return meta + ',' + data.replace(/\s/g, '+');
  };

  const formatDriveUrl = (url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const id = url.split('/d/')[1]?.split('/')[0];
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:image')) return fixBase64(url);
    try {
      const formattedUrl = formatDriveUrl(url);
      const response = await fetch(formattedUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to fetch image", e);
      return null;
    }
  };

  const ensureExcelJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const existing = window.ExcelJS || (window as any).Excel;
      if (existing) {
        resolve(existing);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
      script.onload = () => resolve(window.ExcelJS || (window as any).Excel);
      script.onerror = () => reject(new Error("Gagal memuat library ExcelJS"));
      document.head.appendChild(script);
    });
  };

  const handleDownloadExcel = async () => {
    let ExcelJS;
    try {
      ExcelJS = await ensureExcelJS();
    } catch (err) {
      alert("Library ExcelJS tidak dapat dimuat. Silahkan cek koneksi internet.");
      return;
    }

    if (!ExcelJS) {
      alert("Kesalahan kritis: Library ExcelJS tetap tidak ditemukan.");
      return;
    }

    setIsSyncing(true);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Patrol');

    const columns: any[] = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'No. Penugasan', key: 'noPenugasan', width: 25 },
      { header: 'ULP', key: 'ulp', width: 20 },
      { header: 'Petugas 1', key: 'petugas1', width: 20 },
      { header: 'Petugas 2', key: 'petugas2', width: 20 },
      { header: 'Penyulang', key: 'penyulang', width: 15 },
      { header: 'Keypoint', key: 'keypoint', width: 25 },
      { header: 'Start', key: 'start', width: 25 },
      { header: 'Finish', key: 'finish', width: 25 },
    ];

    for (let i = 1; i <= 6; i++) {
      columns.push({ header: `Foto Sebelum ${i}`, key: `sebelum_${i}`, width: 35 });
      columns.push({ header: `Foto Sesudah ${i}`, key: `sesudah_${i}`, width: 35 });
    }

    worksheet.columns = columns;
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    for (const [index, r] of filteredReportsForTable.entries()) {
      const row = worksheet.addRow({
        no: index + 1,
        tanggal: new Date(r.timestamp).toLocaleDateString('id-ID'),
        noPenugasan: r.noPenugasan,
        ulp: r.ulp,
        petugas1: r.petugas1,
        petugas2: r.petugas2,
        penyulang: r.penyulang,
        keypoint: r.keypoint,
        start: r.titikStart,
        finish: r.titikFinish,
      });

      row.height = 110; 
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.commit(); 

      for (let s = 0; s < 6; s++) {
        const fotoSebelumUrl = r.photos?.sebelum?.[s];
        const fotoSesudahUrl = r.photos?.sesudah?.[s];

        const colSebelum = 10 + s * 2;
        const colSesudah = 11 + s * 2;

        if (fotoSebelumUrl) {
          try {
            const base64 = await getBase64FromUrl(fotoSebelumUrl);
            if (base64) {
              const imgId = workbook.addImage({ 
                base64, 
                extension: base64.startsWith('data:image/png') ? 'png' : 'jpeg' 
              });
              worksheet.addImage(imgId, {
                tl: { col: colSebelum, row: row.number - 1 },
                ext: { width: 220, height: 130 }
              });
            }
          } catch (e) {}
        }

        if (fotoSesudahUrl) {
          try {
            const base64 = await getBase64FromUrl(fotoSesudahUrl);
            if (base64) {
              const imgId = workbook.addImage({ 
                base64, 
                extension: base64.startsWith('data:image/png') ? 'png' : 'jpeg' 
              });
              worksheet.addImage(imgId, {
                tl: { col: colSesudah, row: row.number - 1 },
                ext: { width: 220, height: 130 }
              });
            }
          } catch (e) {}
        }
      }
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Patrol_${tableUlpFilter || 'Semua_ULP'}_${dateStr}.xlsx`;

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Terjadi kesalahan saat mengolah file Excel.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-700 font-bold">Menghubungkan ke Database...</p>
      </div>
    );
  }

  if (errorLoad && !isDemoMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg border border-red-100 animate-fade-in">
          <div className="text-red-500 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Koneksi Bermasalah</h2>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 text-left">
            <p className="text-red-700 text-xs font-bold leading-relaxed">{errorLoad}</p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => fetchData(true)}
              className="w-full bg-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-800 transition-all shadow-lg shadow-cyan-100"
            >
              Coba Sinkron Ulang
            </button>
            <button 
              onClick={startDemoMode}
              className="w-full bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
            >
              Gunakan Mode Demo (Offline)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
          {isDemoMode && (
            <div className="mb-4 bg-amber-50 text-amber-700 p-2 rounded-lg text-[10px] font-black text-center border border-amber-200 uppercase tracking-widest animate-pulse">
              Aplikasi Berjalan dalam Mode Demo (Offline)
            </div>
          )}
          <div className="text-center mb-8">
            <img src={LOGO_URL} alt="Logo PLN" className="h-16 mx-auto mb-4 object-contain" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Unit Layanan Bukittinggi</h2>
            <h1 className="text-lg font-extrabold text-slate-800 mb-6 uppercase tracking-tight"></h1>
            
            <div className="relative group mb-6">
              <img src={APP_LOGO} alt="Logo App" className="relative h-48 mx-auto object-contain transition-transform duration-500 hover:scale-110" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-1 leading-none">Aplikasi Monitoring</h2>
            <h2 className="text-2xl font-bold text-primary mb-2">Yandal Patrol</h2>
          </div>

          <div className="space-y-4">
            <button onClick={() => handleInitialRoleSelect(UserRole.USER)} className="w-full bg-primary hover:bg-cyan-800 text-white font-black py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-cyan-100 uppercase text-xs tracking-widest">
              Login sebagai Petugas
            </button>

            {!showAdminLogin ? (
              <>
                <button onClick={() => setShowAdminLogin(true)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                  Login sebagai Admin
                </button>
                <button onClick={() => handleInitialRoleSelect(UserRole.GUEST)} className="w-full bg-white border-2 border-slate-200 hover:border-primary hover:text-primary text-slate-600 font-black py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                  Tampilkan Data
                </button>
              </>
            ) : (
              <form onSubmit={handleAdminLoginSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-fade-in">
                <h3 className="text-xs font-black text-slate-500 uppercase mb-3 tracking-widest">Verifikasi Admin</h3>
                <input 
                  type="password"
                  autoFocus
                  className={`w-full px-4 py-3 border rounded-xl mb-3 outline-none transition-all focus:ring-2 focus:ring-primary/20 ${loginError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setLoginError(''); }}
                  placeholder="Password Admin..."
                />
                {loginError && <p className="text-[10px] text-red-500 mb-4 font-bold uppercase">{loginError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl">Batal</button>
                  <button type="submit" className="flex-1 py-3 text-xs font-black bg-slate-800 text-white rounded-xl shadow-lg">Masuk</button>
                </div>
              </form>
            )}
            
            <button onClick={() => setView('ABOUT')} className="w-full text-slate-400 hover:text-primary text-[10px] font-black py-2 transition-colors uppercase mt-4 tracking-widest">
              Tentang Aplikasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'CONFIG' && role) {
    return (
      <LoginConfig 
        role={role} 
        masterData={masterData} 
        appLogo={APP_LOGO}
        onBack={() => { setView('LOGIN'); setRole(null); }}
        onConfirm={handleConfigConfirm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-xl rounded-full px-5 py-2.5 flex items-center gap-2 border border-slate-200 animate-fade-in">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Memproses...</span>
        </div>
      )}

      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <button 
                 onClick={handleBackToMenu}
                 className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600 group flex items-center gap-1"
                 title="Kembali ke Menu Sebelumnya"
               >
                 <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
                 <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Kembali</span>
               </button>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('ABOUT')}>
                 <img src={APP_LOGO} alt="App" className="h-8 object-contain" />
                 <div className="flex flex-col leading-none">
                   <span className="font-black text-sm text-slate-800 tracking-tight">Yandal Patrol</span>
                   <span className="text-[9px] text-primary font-black uppercase">{session.ulp || 'Unit Bukittinggi'}</span>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               {isDemoMode && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border border-amber-200">Mode Demo</span>}
               <button onClick={handleLogout} className="text-[10px] text-red-600 font-black px-4 py-2 rounded-xl hover:bg-red-50 transition-all uppercase tracking-widest">Logout</button>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4">
          <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar">
            {role === UserRole.ADMIN && (
              <>
                <button onClick={() => setView('DASHBOARD')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'DASHBOARD' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Dashboard</button>
                <button onClick={() => setView('REKAP')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'REKAP' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Rekap Petugas</button>
                <button onClick={() => setView('SETTINGS')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'SETTINGS' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Kelola Data</button>
              </>
            )}
            {role !== UserRole.GUEST && (
              <button onClick={() => setView('INPUT')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'INPUT' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Input Data</button>
            )}
            <button onClick={() => setView('TABLE')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'TABLE' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Data Laporan</button>
            <button onClick={() => setView('ABOUT')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'ABOUT' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Tentang</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {view === 'DASHBOARD' && <Dashboard reports={reports.filter(r => !session.ulp || r.ulp === session.ulp)} />}
        {view === 'REKAP' && role === UserRole.ADMIN && <AdminRekap reports={reports} masterData={masterData} />}
        {view === 'SETTINGS' && role === UserRole.ADMIN && (
          <AdminSettings 
            masterData={masterData}
            onAddPetugas={(ulp, names) => { 
              const nd = {...masterData, [ulp]: {...masterData[ulp], petugas: [...masterData[ulp].petugas, ...names]}};
              setMasterData(nd); if(!isDemoMode) api.updateMasterData(nd); 
            }}
            onDeletePetugas={(ulp, n) => {
              const nd = {...masterData, [ulp]: {...masterData[ulp], petugas: masterData[ulp].petugas.filter(p => p !== n)}};
              setMasterData(nd); if(!isDemoMode) api.updateMasterData(nd);
            }}
            onAddPenyulang={(ulp, names) => {
              const nd = {...masterData, [ulp]: {...masterData[ulp], penyulang: [...masterData[ulp].penyulang, ...names]}};
              setMasterData(nd); if(!isDemoMode) api.updateMasterData(nd);
            }}
            onDeletePenyulang={(ulp, n) => {
              const nd = {...masterData, [ulp]: {...masterData[ulp], penyulang: masterData[ulp].penyulang.filter(p => p !== n)}};
              setMasterData(nd); if(!isDemoMode) api.updateMasterData(nd);
            }}
          />
        )}
        {view === 'INPUT' && role !== UserRole.GUEST && (
          <InputForm 
            onSubmit={handleSaveReport}
            onCancel={() => setView('TABLE')}
            masterData={masterData}
            sessionData={session}
          />
        )}
        {view === 'TABLE' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Riwayat Penugasan</h2>
                {session.ulp && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Layanan: <span className="text-primary">{session.ulp}</span></p>}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => fetchData(true)} className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                 </button>
                 {role !== UserRole.GUEST && (
                    <button onClick={() => setView('INPUT')} className="bg-primary text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-100 hover:bg-cyan-800 transition-all">Tambah Laporan</button>
                 )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-in items-end">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Dari Tanggal</label>
                <input type="date" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" value={tableStartDate} onChange={(e) => setTableStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sampai Tanggal</label>
                <input type="date" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" value={tableEndDate} onChange={(e) => setTableEndDate(e.target.value)} />
              </div>
              {role === UserRole.ADMIN && (
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filter ULP</label>
                  <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-primary/20" value={tableUlpFilter} onChange={(e) => setTableUlpFilter(e.target.value as ULPName)}>
                    <option value="">Semua ULP</option>
                    {Object.values(ULPName).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setTableStartDate(''); setTableEndDate(''); setTableUlpFilter(''); }} className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-400 font-black rounded-xl text-[10px] uppercase tracking-widest border border-slate-200 transition-all whitespace-nowrap">
                  Reset Filter
                </button>
                {role === UserRole.ADMIN && (
                  <button 
                    onClick={handleDownloadExcel}
                    className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Excel
                  </button>
                )}
              </div>
            </div>

            <DataTable reports={filteredReportsForTable} />
          </div>
        )}
        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200">
               <div className="bg-primary p-12 text-white text-center">
                  <div className="flex justify-center mb-8">
                    <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-48 h-48 flex items-center justify-center">
                      <img src={APP_LOGO} alt="App" className="h-36 w-auto object-contain" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-black mb-3 tracking-tighter uppercase">Yandal Patrol Monitoring</h1>
                 {/* APP VERSION BADGE */}
                  <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mt-3 border border-white/30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Version {APP_VERSION}</span>
                  </div>
                  <p className="text-cyan-100 font-black text-xs uppercase tracking-[0.3em] opacity-80">Digital Yandal Patrol System</p>
               </div>
               <div className="p-10 md:p-14 space-y-12">
                  <section className="space-y-5">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                       <div className="w-2 h-8 bg-primary rounded-full"></div>
                       Keterangan Aplikasi
                    </h2>
                    <p className="text-slate-500 leading-relaxed text-lg italic font-medium">"Aplikasi ini dikembangkan untuk memonitoring Pelaksanaan Pekerjaan Yandal Patrol guna memastikan keandalan sistem kelistrikan di wilayah PLN Electricity Services Bukittinggi."</p>
                  </section>
                  <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">Official Platform</p>
                    <p className="text-base font-black text-slate-800 uppercase tracking-widest">PLN Electricity Services UL Bukittinggi</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">© 2025 • IT Unit Layanan Bukittinggi</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
