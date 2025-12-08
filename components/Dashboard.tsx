
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ReportData, ULPName } from '../types';

interface DashboardProps {
  reports: ReportData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  // Compute Stats
  const totalReports = reports.length;
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long' });
  const reportsThisMonth = reports.filter(r => r.bulan === currentMonth).length;
  
  // Compute Data for Chart
  const dataMap = reports.reduce((acc, curr) => {
    acc[curr.ulp] = (acc[curr.ulp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.values(ULPName).map(name => ({
    name: name.replace('ULP ', ''), // Shorten name for chart
    count: dataMap[name] || 0
  }));

  const COLORS = ['#0e7490', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#f43f5e'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <h2 className="text-2xl font-bold text-slate-800">Dashboard Monitoring</h2>
         <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Terhubung ke Google Spreadsheet
         </div>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 uppercase">Total Penugasan</div>
          <div className="mt-2 text-4xl font-bold text-primary">{totalReports}</div>
          <div className="mt-1 text-sm text-slate-400">Semua Waktu</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 uppercase">Bulan Ini ({currentMonth})</div>
          <div className="mt-2 text-4xl font-bold text-accent">{reportsThisMonth}</div>
          <div className="mt-1 text-sm text-slate-400">Laporan Baru</div>
        </div>

         <div className="bg-gradient-to-br from-primary to-cyan-800 p-6 rounded-xl shadow-lg text-white">
          <div className="text-sm font-medium text-cyan-100 uppercase">Status Sistem</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-bold text-xl">Online</span>
          </div>
          <div className="mt-1 text-sm text-cyan-200">Siap menerima input data</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribusi Penugasan per ULP</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
