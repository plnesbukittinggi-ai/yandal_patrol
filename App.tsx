
import React, { useState, useEffect } from 'react';
import { UserRole, ViewState, ReportData, ULPName, ULPData } from './types';
import { InputForm } from './components/InputForm';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { AdminSettings } from './components/AdminSettings';
import { DATA_ULP as INITIAL_DATA_ULP } from './constants';
import { api } from './services/api';

// Logo PLN Electricity Services (Corporate Logo)
const LOGO_URL = "https://plnes.co.id/_next/image?url=https%3A%2F%2Fcms.plnes.co.id%2Fuploads%2FLogo_HP_New_Temporary_09a9c5a521.png&w=750&q=75"; 
// Logo Aplikasi Yandal Patrol (Project Logo)
const APP_LOGO = "https://raw.githubusercontent.com/plnesbukittinggi-ai/yandal_patrol/main/ChatGPT%20Image%2018%20Des%202025%2C%2011.11.52.png";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Menghubungkan ke Database...");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // State untuk Login Admin
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

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
        
        if (data.masterData && Object.keys(data.masterData).length > 0) {
          setMasterData(data.masterData);
        } else {
          try {
             await api.updateMasterData(INITIAL_DATA_ULP);
             setMasterData(INITIAL_DATA_ULP); 
          } catch (e) {
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

  useEffect(() => {
    fetchData(true);
  }, []);

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

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === UserRole.ADMIN) {
      setView('DASHBOARD');
    } else if (selectedRole === UserRole.GUEST) {
      setView('TABLE');
    } else {
      setView('INPUT');
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Adminbkt') {
      handleLogin(UserRole.ADMIN);
      setAdminPassword('');
      setLoginError('');
      setShowAdminLogin(false);
    } else {
      setLoginError('Password salah!');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setView('LOGIN');
    setShowAdminLogin(false);
    setAdminPassword('');
    setLoginError('');
  };

  const handleSaveReport = async (data: ReportData) => {
    setIsSyncing(true);
    try {
      await api.saveReport(data);
      setReports(prev => [data, ...prev]);
      alert('Data berhasil disimpan ke Database!');
      if (role === UserRole.USER) setView('TABLE');
      fetchData(false);
    } catch (e) {
      alert("Gagal menyimpan laporan. Silahkan coba lagi. " + e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddPetugas = (ulp: ULPName, names: string[]) => {
    const newData = { ...masterData, [ulp]: { ...masterData[ulp], petugas: [...masterData[ulp].petugas, ...names] } };
    updateMasterDataState(newData);
    alert(`${names.length} Petugas berhasil ditambahkan ke ${ulp}`);
  };

  const handleDeletePetugas = (ulp: ULPName, name: string) => {
    const newData = { ...masterData, [ulp]: { ...masterData[ulp], petugas: masterData[ulp].petugas.filter(p => p !== name) } };
    updateMasterDataState(newData);
  };

  const handleAddPenyulang = (ulp: ULPName, names: string[]) => {
    const newData = { ...masterData, [ulp]: { ...masterData[ulp], penyulang: [...masterData[ulp].penyulang, ...names] } };
    updateMasterDataState(newData);
    alert(`${names.length} Penyulang berhasil ditambahkan ke ${ulp}`);
  };

  const handleDeletePenyulang = (ulp: ULPName, name: string) => {
    const newData = { ...masterData, [ulp]: { ...masterData[ulp], penyulang: masterData[ulp].penyulang.filter(p => p !== name) } };
    updateMasterDataState(newData);
  };

  const handleInitDefault = async () => {
    setIsLoading(true);
    try {
        await api.updateMasterData(INITIAL_DATA_ULP);
        setMasterData(INITIAL_DATA_ULP);
        alert('Database berhasil diinisialisasi ulang.');
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-700 font-medium text-lg animate-pulse">{loadingStatus}</p>
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
              className="h-16 mx-auto mb-4 object-contain"
            />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none mb-1"></h2>
            <h1 className="text-lg font-extrabold text-slate-800 mb-6">UNIT LAYANAN BUKITTINGGI</h1>
            
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <img 
                src={APP_LOGO} 
                alt="Yandal Patrol Logo" 
                className="relative h-48 mx-auto object-contain transition-transform duration-500 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400/0e7490/white?text=YANDAL+PATROL";
                }}
              />
            </div>

            <h2 className="text-2xl font-bold text-primary mb-1">Aplikasi Monitoring</h2>
            <h2 className="text-2xl font-bold text-primary mb-2">Yandal Patrol</h2>
            <p className="text-slate-500 text-sm">Monitoring Pelaksanaan Pekerjaan Yandal</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(UserRole.USER)}
              className="w-full bg-primary hover:bg-cyan-800 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-md shadow-cyan-200"
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
                <span className="px-2 bg-white text-slate-400 font-medium italic">Otorisasi Admin</span>
              </div>
            </div>

            {!showAdminLogin ? (
                <>
                    <button 
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Login sebagai Admin
                    </button>

                    <button 
                    onClick={() => handleLogin(UserRole.GUEST)}
                    className="w-full bg-white border-2 border-slate-200 hover:border-primary hover:text-primary text-slate-600 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-2 shadow-sm"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Tampilkan Data
                    </button>
                    
                    <button 
                      onClick={() => setView('ABOUT')}
                      className="w-full text-slate-400 hover:text-primary text-xs font-semibold py-2 transition-colors uppercase tracking-widest mt-4"
                    >
                      Tentang Aplikasi
                    </button>
                </>
            ) : (
                <form onSubmit={handleAdminLoginSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in shadow-inner">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Verifikasi Admin</h3>
                    <input 
                        type="password"
                        autoFocus
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent mb-2 outline-none ${loginError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        value={adminPassword}
                        onChange={(e) => {
                            setAdminPassword(e.target.value);
                            setLoginError('');
                        }}
                        placeholder="Masukkan password..."
                    />
                    {loginError && <p className="text-xs text-red-500 mb-3 font-medium">{loginError}</p>}
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => { setShowAdminLogin(false); setLoginError(''); setAdminPassword(''); }}
                            className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 bg-white"
                        >
                            Batal
                        </button>
                        <button type="submit" className="flex-1 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-md">
                            Masuk
                        </button>
                    </div>
                </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 animate-fade-in border border-slate-200">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Menyimpan & Sinkronisasi...</span>
        </div>
      )}

      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
               <img 
                 src={LOGO_URL} 
                 alt="PLN Logo" 
                 className="h-8 w-auto object-contain cursor-pointer"
                 onClick={() => setView(role === UserRole.ADMIN ? 'DASHBOARD' : 'TABLE')}
               />
               <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('ABOUT')}>
                 <img 
                   src={APP_LOGO} 
                   alt="App Logo" 
                   className="h-8 w-auto object-contain"
                   onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100/0e7490/white?text=YP";
                   }}
                 />
                 <div className="flex flex-col leading-none">
                   <span className="font-bold text-sm text-slate-800 tracking-tight hidden sm:block">Yandal Patrol</span>
                   <span className="text-[9px] text-primary font-bold hidden sm:block uppercase tracking-widest">Bukittinggi</span>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">Role: <span className="font-semibold text-slate-900">{role}</span></span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar">
            {role === UserRole.ADMIN && (
              <>
                <button
                  onClick={() => setView('DASHBOARD')}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    view === 'DASHBOARD' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView('SETTINGS')}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    view === 'SETTINGS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Kelola Data
                </button>
              </>
            )}
            {role !== UserRole.GUEST && (
              <button
                onClick={() => setView('INPUT')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  view === 'INPUT' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Input Data
              </button>
            )}
            <button
              onClick={() => setView('TABLE')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'TABLE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Data Laporan
            </button>
            <button
              onClick={() => setView('ABOUT')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                view === 'ABOUT' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Tentang
            </button>
          </nav>
        </div>
      </header>

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
        {view === 'INPUT' && role !== UserRole.GUEST && (
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
              {role !== UserRole.GUEST && (
                <button 
                  onClick={() => setView('INPUT')}
                  className="sm:hidden bg-primary text-white p-2 rounded-full shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            <DataTable reports={reports} />
          </div>
        )}
        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
               <div className="bg-gradient-to-br from-primary to-cyan-800 p-8 text-white text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300 w-40 h-40 flex items-center justify-center">
                      <img 
                        src={APP_LOGO} 
                        alt="Logo Yandal Patrol" 
                        className="h-32 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x400/0e7490/white?text=YP";
                        }}
                      />
                    </div>
                  </div>
                  <h1 className="text-3xl font-extrabold mb-2">Aplikasi Monitoring Yandal Patrol</h1>
                  <p className="text-cyan-100 font-medium">Monitoring Digital Pelaksanaan Pekerjaan Yandal</p>
               </div>
               
               <div className="p-8 md:p-12 space-y-10">
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-xl font-bold">Keterangan Aplikasi</h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-lg italic">
                      "Aplikasi ini untuk memonitoring Pelaksanaan Pekerjaan Yandal Patrol dari Petugas Yandal PLN Electricity Services Bukittinggi"
                    </p>
                  </section>

                  <section className="space-y-4 border-t border-slate-100 pt-8">
                    <div className="flex items-center gap-3 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h2 className="text-xl font-bold">Informasi Unit</h2>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-extrabold text-lg">PLN ELECTRICITY SERVICES UNIT LAYANAN BUKITTINGGI</p>
                      <p className="text-slate-600 flex items-start gap-2">
                         <span className="font-bold shrink-0">KANTOR :</span>
                         <span>Jl. Adinegoro No. 6, Tangah Jua Bukittinggi, Sumatera Barat</span>
                      </p>
                    </div>
                  </section>

                  <footer className="text-center pt-10 border-t border-slate-100">
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                      © Desember 2025, IT Unit Layanan Bukittinggi
                    </p>
                  </footer>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
