
import React, { useState, useEffect } from 'react';
import { UserRole, ViewState, ReportData, ULPName, ULPData } from './types';
import { InputForm } from './components/InputForm';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { AdminSettings } from './components/AdminSettings';
import { DATA_ULP as INITIAL_DATA_ULP } from './constants';
import { api } from './services/api';

// Konstanta untuk URL Logo. Ganti URL ini jika ingin mengubah logo aplikasi.
const LOGO_URL = "https://plnes.co.id/_next/image?url=https%3A%2F%2Fcms.plnes.co.id%2Fuploads%2FLogo_HP_New_Temporary_09a9c5a521.png&w=750&q=75";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Menghubungkan ke Database...");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // State Data
  const [reports, setReports] = useState<ReportData[]>([]);
  const [masterData, setMasterData] = useState<Record<string, ULPData>>(INITIAL_DATA_ULP);

  // Function to fetch data
  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setLoadingStatus("Mengecek koneksi database...");
    }

    try {
      const data = await api.getAllData();
      
      if (data) {
        if (data.reports && Array.isArray(data.reports)) {
          const sortedReports = data.reports.sort((a: ReportData, b: ReportData) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setReports(sortedReports);
        }
        
        // Logic Safety: Hanya gunakan data server jika tidak kosong
        if (data.masterData && Object.keys(data.masterData).length > 0) {
          setMasterData(data.masterData);
        } else {
          console.log("Server master data empty, performing auto-initialization...");
          setLoadingStatus("Database Server Kosong. Sedang Melakukan Inisialisasi Data Awal...");
          
          // Auto-initialize server with default data (Blocking await to ensure it finishes)
          try {
             await api.updateMasterData(INITIAL_DATA_ULP);
             setMasterData(INITIAL_DATA_ULP); 
             console.log("Server database auto-initialized successfully.");
          } catch (e) {
             console.error("Failed to auto-initialize server:", e);
             // Fallback to local defaults
             setMasterData(INITIAL_DATA_ULP);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchData(true);
  }, []);

  // Handler: Update Master Data (Helper)
  const updateMasterDataState = async (newData: Record<string, ULPData>) => {
    setMasterData(newData);
    setIsSyncing(true);
    try {
      await api.updateMasterData(newData);
    } catch (e) {
      alert("Gagal menyimpan perubahan Master Data ke server.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Simple Login Handler
  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === UserRole.ADMIN) {
      setView('DASHBOARD');
    } else {
      setView('INPUT');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setView('LOGIN');
  };

  const handleSaveReport = async (data: ReportData) => {
    setIsSyncing(true);
    try {
      // 1. Save to Server (Uploads photos & saves row)
      await api.saveReport(data);
      
      // 2. Optimistic update (User sees data immediately)
      setReports(prev => [data, ...prev]);
      alert('Data berhasil disimpan ke Database!');
      
      if (role === UserRole.USER) {
        setView('TABLE');
      }

      // 3. Re-fetch data in background to get the Drive Links instead of Base64
      // No loading screen for background refresh
      fetchData(false);

    } catch (e) {
      alert("Gagal menyimpan laporan. Silahkan coba lagi. " + e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Admin: Add Petugas Logic
  const handleAddPetugas = (ulp: ULPName, names: string[]) => {
    const newData = {
      ...masterData,
      [ulp]: {
        ...masterData[ulp],
        petugas: [...masterData[ulp].petugas, ...names]
      }
    };
    updateMasterDataState(newData);
    alert(`${names.length} Petugas berhasil ditambahkan ke ${ulp}`);
  };

  // Admin: Delete Petugas Logic
  const handleDeletePetugas = (ulp: ULPName, name: string) => {
    const newData = {
      ...masterData,
      [ulp]: {
        ...masterData[ulp],
        petugas: masterData[ulp].petugas.filter(p => p !== name)
      }
    };
    updateMasterDataState(newData);
  };

  // Admin: Add Penyulang Logic
  const handleAddPenyulang = (ulp: ULPName, names: string[]) => {
    const newData = {
      ...masterData,
      [ulp]: {
        ...masterData[ulp],
        penyulang: [...masterData[ulp].penyulang, ...names]
      }
    };
    updateMasterDataState(newData);
    alert(`${names.length} Penyulang berhasil ditambahkan ke ${ulp}`);
  };

  // Admin: Delete Penyulang Logic
  const handleDeletePenyulang = (ulp: ULPName, name: string) => {
    const newData = {
      ...masterData,
      [ulp]: {
        ...masterData[ulp],
        penyulang: masterData[ulp].penyulang.filter(p => p !== name)
      }
    };
    updateMasterDataState(newData);
  };

  // Admin: Force Init DB (Manual Button)
  const handleInitDefault = async () => {
    setIsLoading(true);
    setLoadingStatus("Menginisialisasi Database secara manual...");
    try {
        await api.updateMasterData(INITIAL_DATA_ULP);
        setMasterData(INITIAL_DATA_ULP);
        alert('Database berhasil diinisialisasi ulang dengan data default.');
    } catch(e) {
        alert("Gagal inisialisasi.");
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="space-y-2">
            <p className="text-slate-700 font-medium text-lg animate-pulse">{loadingStatus}</p>
            {loadingStatus.includes('Inisialisasi') && (
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Mohon tunggu sebentar. Sistem sedang membuat struktur data awal di Google Spreadsheet Anda.
                </p>
            )}
        </div>
      </div>
    );
  }

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
          <div className="text-center mb-8">
            <img 
              src={LOGO_URL} 
              alt="Logo PLN" 
              className="h-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-primary mb-2">PLN ES Bukittinggi Task Monitor</h1>
            <p className="text-slate-500">Aplikasi Monitoring Yandal Patrol</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(UserRole.USER)}
              className="w-full bg-primary hover:bg-cyan-800 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Login sebagai Petugas
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400">Atau</span>
              </div>
            </div>
            <button 
              onClick={() => handleLogin(UserRole.ADMIN)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Login sebagai Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sync Indicator */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 animate-fade-in border border-slate-200">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Menyimpan & Sinkronisasi...</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
               <img 
                 src={LOGO_URL} 
                 alt="Logo" 
                 className="h-10 w-auto object-contain"
               />
              <span className="font-bold text-xl text-slate-800 tracking-tight hidden sm:block">PLN ES Bukittinggi</span>
              <span className="font-bold text-xl text-slate-800 tracking-tight sm:hidden">PLN ES</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">Logged in as <span className="font-semibold text-slate-900">{role}</span></span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {role === UserRole.ADMIN && (
              <>
                <button
                  onClick={() => setView('DASHBOARD')}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    view === 'DASHBOARD'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView('SETTINGS')}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    view === 'SETTINGS'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Kelola Data
                </button>
              </>
            )}
            <button
              onClick={() => setView('INPUT')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'INPUT'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Input Data
            </button>
            <button
              onClick={() => setView('TABLE')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'TABLE'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Data Laporan
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'DASHBOARD' && role === UserRole.ADMIN && (
          <Dashboard reports={reports} />
        )}
        {view === 'SETTINGS' && role === UserRole.ADMIN && (
          <AdminSettings 
            masterData={masterData}
            onAddPetugas={handleAddPetugas}
            onDeletePetugas={handleDeletePetugas}
            onAddPenyulang={handleAddPenyulang}
            onDeletePenyulang={handleDeletePenyulang}
            onInitDefault={handleInitDefault}
          />
        )}
        {view === 'INPUT' && (
          <InputForm 
            onSubmit={handleSaveReport}
            onCancel={() => setView(role === UserRole.ADMIN ? 'DASHBOARD' : 'TABLE')}
            masterData={masterData}
          />
        )}
        {view === 'TABLE' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Daftar Laporan Penugasan</h2>
              <button 
                 onClick={() => setView('INPUT')}
                 className="sm:hidden bg-primary text-white p-2 rounded-full shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <DataTable reports={reports} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
