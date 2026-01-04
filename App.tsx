
import React, { useState, useEffect } from 'react';
import { UserRole, ViewState, ReportData, ULPName, ULPData, LoginSession } from './types';
import { InputForm } from './components/InputForm';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { AdminSettings } from './components/AdminSettings';
import { LoginConfig } from './components/LoginConfig';
import { DATA_ULP as INITIAL_DATA_ULP } from './constants';
import { api } from './services/api';

const LOGO_URL = "https://plnes.co.id/_next/image?url=https%3A%2F%2Fcms.plnes.co.id%2Fuploads%2FLogo_HP_New_Temporary_09a9c5a521.png&w=750&q=75"; 
const APP_LOGO = "https://raw.githubusercontent.com/plnesbukittinggi-ai/yandal_patrol/main/ChatGPT%20Image%2018%20Des%202025%2C%2011.11.52.png";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Menghubungkan ke Database...");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Session State
  const [session, setSession] = useState<LoginSession>({ ulp: null, petugas1: null, petugas2: null });

  // Data State
  const [reports, setReports] = useState<ReportData[]>([]);
  const [masterData, setMasterData] = useState<Record<string, ULPData>>(INITIAL_DATA_ULP);

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setLoadingStatus("Sinkronisasi data...");
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

  const handleInitialRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === UserRole.ADMIN) {
      // Admin stays password flow
      return; 
    }
    // Guest and User go to Config
    setView('CONFIG');
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Adminbkt') {
      setRole(UserRole.ADMIN);
      setSession({ ulp: null, petugas1: null, petugas2: null }); // Admin has all access
      setView('DASHBOARD');
      setAdminPassword('');
      setLoginError('');
      setShowAdminLogin(false);
    } else {
      setLoginError('Password salah!');
    }
  };

  const handleConfigConfirm = (conf: LoginSession) => {
    setSession(conf);
    if (role === UserRole.GUEST) {
      setView('TABLE');
    } else {
      setView('INPUT');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setSession({ ulp: null, petugas1: null, petugas2: null });
    setView('LOGIN');
    setShowAdminLogin(false);
    setAdminPassword('');
  };

  const handleSaveReport = async (data: ReportData) => {
    setIsSyncing(true);
    try {
      await api.saveReport(data);
      setReports(prev => [data, ...prev]);
      alert('Data Laporan berhasil disimpan!');
      setView('TABLE');
      fetchData(false);
    } catch (e) {
      alert("Gagal menyimpan. Cek koneksi Anda.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered reports based on current ULP selection
  const filteredReports = reports.filter(r => 
    !session.ulp || r.ulp === session.ulp
  );

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
            <img src={LOGO_URL} alt="Logo PLN" className="h-16 mx-auto mb-4 object-contain" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">PLN Electricity Services</h2>
            <h1 className="text-lg font-extrabold text-slate-800 mb-6 uppercase tracking-tight">Unit Layanan Bukittinggi</h1>
            
            <div className="relative group mb-6">
              <img 
                src={APP_LOGO} 
                alt="Yandal Patrol Logo" 
                className="relative h-48 mx-auto object-contain transition-transform duration-500 hover:scale-110"
              />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-1">Aplikasi Monitoring</h2>
            <h2 className="text-2xl font-bold text-primary mb-2">Yandal Patrol</h2>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleInitialRoleSelect(UserRole.USER)}
              className="w-full bg-primary hover:bg-cyan-800 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-md"
            >
              Login sebagai Petugas
            </button>

            {!showAdminLogin ? (
              <>
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Login sebagai Admin
                </button>
                <button 
                  onClick={() => handleInitialRoleSelect(UserRole.GUEST)}
                  className="w-full bg-white border-2 border-slate-200 hover:border-primary hover:text-primary text-slate-600 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Tampilkan Data
                </button>
                <button onClick={() => setView('ABOUT')} className="w-full text-slate-400 hover:text-primary text-xs font-semibold py-2 transition-colors uppercase mt-4">
                  Tentang Aplikasi
                </button>
              </>
            ) : (
              <form onSubmit={handleAdminLoginSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Verifikasi Admin</h3>
                <input 
                  type="password"
                  autoFocus
                  className={`w-full px-4 py-2 border rounded-lg mb-2 outline-none ${loginError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setLoginError(''); }}
                  placeholder="Password Admin..."
                />
                {loginError && <p className="text-xs text-red-500 mb-3 font-medium">{loginError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg">Batal</button>
                  <button type="submit" className="flex-1 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg">Masuk</button>
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
        onBack={() => setView('LOGIN')}
        onConfirm={handleConfigConfirm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-slate-200">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-xs font-medium text-slate-600">Sinkronisasi...</span>
        </div>
      )}

      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <img src={LOGO_URL} alt="PLN" className="h-8 object-contain" onClick={() => setView('LOGIN')} />
               <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('ABOUT')}>
                 <img src={APP_LOGO} alt="App" className="h-8 object-contain" />
                 <div className="flex flex-col leading-none">
                   <span className="font-bold text-sm text-slate-800">Yandal Patrol</span>
                   <span className="text-[9px] text-primary font-bold uppercase">{session.ulp || 'Unit Bukittinggi'}</span>
                 </div>
               </div>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-600 font-medium px-3 py-1 rounded-md hover:bg-red-50">Logout</button>
        </div>
        
        <div className="max-w-7xl mx-auto px-4">
          <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar">
            {role === UserRole.ADMIN && (
              <>
                <button onClick={() => setView('DASHBOARD')} className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'DASHBOARD' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Dashboard</button>
                <button onClick={() => setView('SETTINGS')} className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'SETTINGS' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Kelola Data</button>
              </>
            )}
            {role !== UserRole.GUEST && (
              <button onClick={() => setView('INPUT')} className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'INPUT' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Input Data</button>
            )}
            <button onClick={() => setView('TABLE')} className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'TABLE' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Data Laporan</button>
            <button onClick={() => setView('ABOUT')} className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'ABOUT' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Tentang</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {view === 'DASHBOARD' && <Dashboard reports={filteredReports} />}
        {view === 'SETTINGS' && role === UserRole.ADMIN && (
          <AdminSettings 
            masterData={masterData}
            onAddPetugas={(ulp, names) => { 
              const nd = {...masterData, [ulp]: {...masterData[ulp], petugas: [...masterData[ulp].petugas, ...names]}};
              setMasterData(nd); api.updateMasterData(nd); 
            }}
            onDeletePetugas={(ulp, n) => {
              const nd = {...masterData, [ulp]: {...masterData[ulp], petugas: masterData[ulp].petugas.filter(p => p !== n)}};
              setMasterData(nd); api.updateMasterData(nd);
            }}
            onAddPenyulang={(ulp, names) => {
              const nd = {...masterData, [ulp]: {...masterData[ulp], penyulang: [...masterData[ulp].penyulang, ...names]}};
              setMasterData(nd); api.updateMasterData(nd);
            }}
            onDeletePenyulang={(ulp, n) => {
              const nd = {...masterData, [ulp]: {...masterData[ulp], penyulang: masterData[ulp].penyulang.filter(p => p !== n)}};
              setMasterData(nd); api.updateMasterData(nd);
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Daftar Laporan Penugasan</h2>
                {session.ulp && <p className="text-sm text-slate-500">Menampilkan data untuk unit: <b>{session.ulp}</b></p>}
              </div>
              {role !== UserRole.GUEST && (
                <button onClick={() => setView('INPUT')} className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-cyan-800 transition-colors">Tambah Laporan</button>
              )}
            </div>
            <DataTable reports={filteredReports} />
          </div>
        )}
        {view === 'ABOUT' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
               <div className="bg-gradient-to-br from-primary to-cyan-800 p-8 text-white text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-lg w-40 h-40 flex items-center justify-center">
                      <img src={APP_LOGO} alt="App" className="h-32 w-auto object-contain" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-extrabold mb-2">Monitoring Yandal Patrol</h1>
                  <p className="text-cyan-100 font-medium">Monitoring Digital Pelaksanaan Pekerjaan Yandal</p>
               </div>
               <div className="p-8 md:p-12 space-y-10">
                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                       <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Keterangan Aplikasi
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-lg italic italic">"Aplikasi ini untuk memonitoring Pelaksanaan Pekerjaan Yandal Patrol dari Petugas Yandal PLN Electricity Services Bukittinggi"</p>
                  </section>
                  <section className="space-y-4 border-t border-slate-100 pt-8">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                       <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                       Informasi Unit
                    </h2>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-extrabold text-lg uppercase">PLN ELECTRICITY SERVICES UNIT LAYANAN BUKITTINGGI</p>
                      <p className="text-slate-600">Jl. Adinegoro No. 6, Tangah Jua Bukittinggi, Sumatera Barat</p>
                    </div>
                  </section>
                  <footer className="text-center pt-10 border-t border-slate-100 text-slate-400 text-sm">© Desember 2025, IT Unit Layanan Bukittinggi</footer>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
