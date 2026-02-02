
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserRole, ViewState, ReportData, ULPName, ULPData, LoginSession } from './types';
import { InputForm } from './components/InputForm';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { AdminSettings } from './components/AdminSettings';
import { AdminRekap } from './components/AdminRekap';
import { LoginConfig } from './components/LoginConfig';
import { DATA_ULP as INITIAL_DATA_ULP, APP_VERSION } from './constants';
import { api } from './services/api';

const LOGO_URL = "https://plnes.co.id/_next/image?url=https%3A%2F%2Fcms.plnes.co.id%2Fuploads%2FLogo_HP_New_Temporary_09a9c5a521.png&w=750&q=75"; 
const APP_LOGO = "https://raw.githubusercontent.com/plnesbukittinggi-ai/yandal_patrol/main/ChatGPT%20Image%2018%20Des%202025%2C%2011.11.52.png";
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

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
  const [editingReport, setEditingReport] = useState<ReportData | null>(null);

  const pendingUpdatesRef = useRef<Map<string, string>>(new Map());
  const lastReportIdRef = useRef<string | null>(null);
  const lastPeriodicNotifyRef = useRef<number>(0);

  // --- NOTIFICATION FEATURE ---

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.play().catch(e => console.log("Audio play blocked by browser policy"));
  };

  const updateAppBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      playNotificationSound();
      
      // Jika Service Worker tersedia, gunakan registration.showNotification (lebih stabil untuk background)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: APP_LOGO,
            badge: APP_LOGO,
            tag: 'yandal-patrol-notif',
            renotify: true,
            vibrate: [200, 100, 200]
          } as any);
        });
      } else {
        // Fallback ke notifikasi standar
        new Notification(title, {
          body,
          icon: APP_LOGO,
          badge: APP_LOGO,
          tag: 'yandal-patrol-notif',
          renotify: true
        } as any);
      }
    }
  };

  const generateSummaryMessage = (currentReports: ReportData[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayReports = currentReports.filter(r => r.timestamp.startsWith(today));
    
    const counts: Record<string, number> = {};
    Object.values(ULPName).forEach(name => {
      counts[name] = todayReports.filter(r => r.ulp === name).length;
    });

    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = new Date().toLocaleDateString('id-ID', dateOptions);

    let message = `Laporan Yandal Patrol Hari ini : ${dateStr}\n`;
    message += `- ULP Bukittinggi          : ${counts[ULPName.BUKITTINGGI] || 0}\n`;
    message += `- ULP Padang Panjang : ${counts[ULPName.PADANG_PANJANG] || 0}\n`;
    message += `- ULP Lubuk Sikaping  : ${counts[ULPName.LUBUK_SIKAPING] || 0}\n`;
    message += `- ULP Lubuk Basung    : ${counts[ULPName.LUBUK_BASUNG] || 0}\n`;
    message += `- ULP Simpang Empat  : ${counts[ULPName.SIMPANG_EMPAT] || 0}\n`;
    message += `- ULP Baso                    : ${counts[ULPName.BASO] || 0}\n`;
    message += `- ULP Koto Tuo              : ${counts[ULPName.KOTO_TUO] || 0}\n`;
    message += `\nMohon untuk ULP yang belum melakukan Yandal Patrol untuk segera melaksanakannya.`;
    
    return { message, totalToday: todayReports.length };
  };

  const checkPeriodicNotification = (currentReports: ReportData[]) => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 10 && currentHour <= 18) {
      if (currentHour % 2 === 0 && lastPeriodicNotifyRef.current !== currentHour) {
        lastPeriodicNotifyRef.current = currentHour;
        const { message, totalToday } = generateSummaryMessage(currentReports);
        sendBrowserNotification("Update Berkala Yandal Patrol", message);
        updateAppBadge(totalToday);
      }
    }
  };

  // --- END NOTIFICATION FEATURE ---

  useEffect(() => {
    requestNotificationPermission();
    
    const savedDemo = localStorage.getItem('yandal_demo_mode');
    if (savedDemo === 'true') {
      setIsDemoMode(true);
      const savedReports = localStorage.getItem('yandal_local_reports');
      if (savedReports) setReports(JSON.parse(savedReports));
    }
    fetchData(true);

    const poller = setInterval(() => {
      fetchData(false);
    }, 120000);

    return () => clearInterval(poller);
  }, []);

  useEffect(() => {
    if (view === 'TABLE' && !isDemoMode) {
      fetchData(false);
    }
  }, [tableStartDate, tableEndDate, tableUlpFilter, view]);

  const fetchData = async (showLoading = true) => {
    if (isDemoMode) return;
    
    if (showLoading) {
      setIsLoading(true);
      setErrorLoad(null);
    }
    try {
      const data = await api.getAllData();
      if (data && data.reports) {
        const serverReports = data.reports as ReportData[];
        
        if (serverReports.length > 0) {
          const sorted = [...serverReports].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const latest = sorted[0];
          
          if (lastReportIdRef.current && latest.id !== lastReportIdRef.current) {
            const { message, totalToday } = generateSummaryMessage(serverReports);
            sendBrowserNotification("Input Laporan Patrol Baru!", `Oleh: ${latest.petugas1} (${latest.ulp})\n\n${message}`);
            updateAppBadge(totalToday);
          }
          lastReportIdRef.current = latest.id;
        }

        checkPeriodicNotification(serverReports);

        setReports(prevReports => {
          const reportMap = new Map<string, ReportData>();
          prevReports.forEach(r => reportMap.set(r.id, r));
          
          serverReports.forEach((serverReport: ReportData) => {
            const pendingTimestamp = pendingUpdatesRef.current.get(serverReport.id);
            if (pendingTimestamp && new Date(serverReport.timestamp) < new Date(pendingTimestamp)) {
              return; 
            }
            reportMap.set(serverReport.id, serverReport);
          });
          
          return Array.from(reportMap.values());
        });
        
        if (data.masterData) {
            const updatedMaster = { ...data.masterData };
            Object.keys(updatedMaster).forEach(k => {
                if (!updatedMaster[k].keypoints) updatedMaster[k].keypoints = {};
            });
            setMasterData(updatedMaster);
        }
      }
    } catch (error: any) {
      console.error("Fetch failed:", error);
      if (showLoading) setErrorLoad(error.message || "Gagal terhubung ke database.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
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
    setEditingReport(null);
    updateAppBadge(0);
  };

  const handleBackToMenu = () => {
     if (view === 'CONFIG') {
        setView('LOGIN');
        setRole(null);
     } else {
        if (role === UserRole.ADMIN) {
           setView('DASHBOARD');
        } else {
           setView('LOGIN');
           setRole(null);
        }
     }
     setEditingReport(null);
  };

  const handleSaveReport = async (data: ReportData, isEditMode: boolean) => {
    setIsSyncing(true);
    
    pendingUpdatesRef.current.set(data.id, data.timestamp);
    setReports(prev => {
      const filtered = prev.filter(r => r.id !== data.id);
      return [data, ...filtered];
    });

    try {
      if (isDemoMode) {
        const currentReports = [data, ...reports.filter(r => r.id !== data.id)];
        localStorage.setItem('yandal_local_reports', JSON.stringify(currentReports));
      } else {
        await api.saveReport(data, isEditMode);
        
        setTimeout(() => {
          fetchData(false);
          pendingUpdatesRef.current.delete(data.id);
        }, 8000);
      }
      
      setEditingReport(null);
      setView('TABLE');
    } catch (e) {
      console.error("Save report failed:", e);
      alert("Peringatan: Gagal sinkronisasi otomatis. Data Anda tersimpan di aplikasi, silakan cek koneksi atau refresh manual nanti.");
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditForm = (report: ReportData) => {
    setEditingReport(report);
    setView('INPUT');
  };

  const filteredReportsForTable = useMemo(() => {
    const uniqueMap = new Map<string, ReportData>();
    const sortedRaw = [...reports].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedRaw.forEach(r => uniqueMap.set(r.id, r));
    const uniqueReportsList = Array.from(uniqueMap.values());

    return uniqueReportsList
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
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, session.ulp, role, tableUlpFilter, tableStartDate, tableEndDate]);

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

  const handleDownloadExcel = async () => {
    const ExcelJS = (window as any).ExcelJS;
    if (!ExcelJS) {
      alert("Library ExcelJS tidak tersedia. Pastikan koneksi internet stabil atau muat ulang halaman.");
      return;
    }

    setIsSyncing(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Patrol');

      const PHOTO_COL_WIDTH = 18.28;
      const DATA_ROW_HEIGHT = 101.25;

      const columns: any[] = [
        { header: 'No', key: 'no', width: 8 },
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
        columns.push({ header: `Foto Sebelum ${i}`, key: `sebelum_${i}`, width: PHOTO_COL_WIDTH });
        columns.push({ header: `Foto Sesudah ${i}`, key: `sesudah_${i}`, width: PHOTO_COL_WIDTH });
      }

      worksheet.columns = columns;

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.height = 30;
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0E7490' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

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

        row.height = DATA_ROW_HEIGHT;
        row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

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
                  ext: { width: 128, height: 135 }
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
                  ext: { width: 128, height: 135 }
                });
              }
            } catch (e) {}
          }
        }
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Laporan_Patrol_${tableUlpFilter || 'Semua_ULP'}_${dateStr}.xlsx`;

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
      console.error(err);
      alert("Terjadi kesalahan saat mengekspor data Excel.");
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

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
          <div className="text-center mb-8">
            <img src={LOGO_URL} alt="Logo PLN" className="h-16 mx-auto mb-4 object-contain" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">PLN Electricity Services</h2>
            <h1 className="text-lg font-extrabold text-slate-800 mb-6 uppercase tracking-tight">Unit Layanan Bukittinggi</h1>
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
                   <span className="text-[9px] text-primary font-black uppercase tracking-widest">{session.ulp || 'UP3 BUKITTINGGI'}</span>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
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
            {role === UserRole.USER && (
              <button onClick={() => setView('INPUT')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'INPUT' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Input Data</button>
            )}
            <button onClick={() => setView('TABLE')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'TABLE' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Data Laporan</button>
            <button onClick={() => setView('ABOUT')} className={`pb-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${view === 'ABOUT' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Tentang</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {view === 'DASHBOARD' && <Dashboard reports={filteredReportsForTable.filter(r => !session.ulp || r.ulp === session.ulp)} />}
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
            onAddKeypoint={(ulp, penyulang, kps) => {
              const nd = { ...masterData };
              if (!nd[ulp].keypoints) nd[ulp].keypoints = {};
              if (!nd[ulp].keypoints[penyulang]) nd[ulp].keypoints[penyulang] = [];
              nd[ulp].keypoints[penyulang] = [...new Set([...nd[ulp].keypoints[penyulang], ...kps])];
              setMasterData(nd); if(!isDemoMode) api.updateMasterData(nd);
            }}
            onDeleteKeypoint={(ulp, penyulang, kp) => {
              const nd = { ...masterData };
              if (nd[ulp].keypoints && nd[ulp].keypoints[penyulang]) {
                 nd[ulp].keypoints[penyulang] = nd[ulp].keypoints[penyulang].filter(item => item !== kp);
              }
              setMasterData(nd); if(!isDemoMode) api.updateMasterData(nd);
            }}
          />
        )}
        {view === 'INPUT' && role !== UserRole.GUEST && (
          <InputForm 
            key={editingReport?.id || 'new-report'}
            onSubmit={handleSaveReport}
            onCancel={() => { setView('TABLE'); setEditingReport(null); }}
            masterData={masterData}
            sessionData={session}
            editData={editingReport}
          />
        )}
        {view === 'TABLE' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Riwayat Penugasan</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Unit: <span className="text-primary">{session.ulp || 'GABUNGAN (UP3 BUKITTINGGI)'}</span>
                </p>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => fetchData(true)} 
                  className="bg-slate-200 text-slate-700 p-2.5 rounded-2xl hover:bg-slate-300 transition-all flex items-center justify-center group"
                  title="Refresh Data Manual"
                 >
                    <svg className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                 </button>
                 {role === UserRole.USER && (
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
              {(role === UserRole.ADMIN || (role === UserRole.GUEST && !session.ulp)) && (
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
                    Export Excel
                  </button>
                )}
              </div>
            </div>

            <DataTable reports={filteredReportsForTable} onEdit={role !== UserRole.GUEST ? openEditForm : undefined} />
          </div>
        )}
        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200">
               <div className="bg-primary p-12 text-white text-center flex flex-col items-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-48 h-48 flex items-center justify-center relative overflow-hidden group">
                      <img src={APP_LOGO} alt="App" className="h-36 w-auto object-contain z-10" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-black mb-1 tracking-tighter uppercase">Yandal Patrol Monitoring</h1>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mt-3 border border-white/30 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Version {APP_VERSION}</span>
                  </div>
                  <p className="text-cyan-100 font-black text-[9px] uppercase tracking-[0.4em] opacity-60 mt-6">Digital Enforcement System</p>
               </div>
               <div className="p-10 md:p-14 space-y-12 text-center">
                  <section className="space-y-5">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Keterangan Aplikasi</h2>
                    <p className="text-slate-500 leading-relaxed text-lg italic font-medium">"Aplikasi ini dikembangkan untuk memonitoring Pelaksanaan Pekerjaan Yandal Patrol guna memastikan keandalan sistem kelistrikan di wilayah PLN Electricity Services Bukittinggi."</p>
                  </section>
                  <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-2">
                    <p className="text-base font-black text-slate-800 uppercase tracking-widest">PLN Electricity Services Bukittinggi</p>
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
