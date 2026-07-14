
import React, { useState } from 'react';
import { ULPName, ULPData } from '../types';

const gasCodeText = `// --- KONFIGURASI ---
// ID Spreadsheet Anda (Silakan ganti jika berbeda)
var SPREADSHEET_ID = '1kb1olb-l-9EeX8nrRaW_rrbuRv1BkLVG6nbxVa32Ux4';
// ID Folder Google Drive Anda (Silakan ganti jika berbeda)
var DRIVE_FOLDER_ID = '1zMK33wH2daWieijYsw3csJJtAXwwOGaj';

function doGet(e) {
  var action = e.parameter.action;
  if (action == 'getAll') {
    return getAllData();
  }
  return ContentService.createTextOutput("API Active");
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    
    if (action == 'saveReport') {
      return saveReport(contents.data);
    } else if (action == 'updateReport') {
      return updateReport(contents.data);
    } else if (action == 'updateMaster') {
      return updateMaster(contents.data);
    }
  } catch (error) {
     return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // --- AMBIL DATA LAPORAN ---
  var sheetLaporan = ss.getSheetByName('Laporan');
  var reports = [];
  
  if (sheetLaporan.getLastRow() > 1) {
    var dataLaporan = sheetLaporan.getDataRange().getValues();
    var headers = dataLaporan[0];
    
    var headerIndices = {};
    for (var col = 0; col < headers.length; col++) {
      var h = String(headers[col]).trim().toLowerCase();
      headerIndices[h] = col;
    }
    
    for (var i = 1; i < dataLaporan.length; i++) {
      var row = dataLaporan[i];
      
      var idIndex = headerIndices['id'] !== undefined ? headerIndices['id'] : 0;
      var idVal = String(row[idIndex]);
      if (!idVal || idVal.trim() === "") continue;

      var tsIndex = headerIndices['timestamp'] !== undefined ? headerIndices['timestamp'] : (headerIndices['tanggal'] !== undefined ? headerIndices['tanggal'] : 1);
      var ts = row[tsIndex];
      if (ts instanceof Date) { ts = ts.toISOString(); }

      var report = {
        id: idVal,
        timestamp: ts || "",
        bulan: getValByHeaders(row, headerIndices, ['bulan']),
        noPenugasan: getValByHeaders(row, headerIndices, ['no penugasan', 'no. penugasan', 'nopenugasan']),
        ulp: getValByHeaders(row, headerIndices, ['ulp', 'unit (ulp)', 'unit']),
        petugas1: getValByHeaders(row, headerIndices, ['petugas 1', 'petugas1']),
        petugas2: getValByHeaders(row, headerIndices, ['petugas 2', 'petugas2']),
        penyulang: getValByHeaders(row, headerIndices, ['penyulang']),
        keypoint: getValByHeaders(row, headerIndices, ['keypoint']),
        titikStart: getValByHeaders(row, headerIndices, ['titik start', 'start', 'titikstart']),
        titikFinish: getValByHeaders(row, headerIndices, ['titik finish', 'finish', 'titikfinish']),
        jumlahTiang: getNumByHeaders(row, headerIndices, ['jumlah tiang', 'jumlah_tiang', 'jumlahtiang']),
        jumlahKms: getNumByHeaders(row, headerIndices, ['jumlah kms', 'jumlah_kms', 'jumlahkms']),
        photos: { sebelum: [], sesudah: [] }
      };

      for (var p = 1; p <= 10; p++) {
        var sblmKey = 'foto sblm ' + p;
        var ssdhKey = 'foto ssdh ' + p;
        
        var sblmVal = headerIndices[sblmKey] !== undefined ? row[headerIndices[sblmKey]] : "";
        var ssdhVal = headerIndices[ssdhKey] !== undefined ? row[headerIndices[ssdhKey]] : "";
        
        if (headerIndices[sblmKey] === undefined && headerIndices[ssdhKey] === undefined && p <= 6) {
          sblmVal = row[11 + ((p - 1) * 2)] || "";
          ssdhVal = row[12 + ((p - 1) * 2)] || "";
        }
        
        report.photos.sebelum.push(sblmVal || "");
        report.photos.sesudah.push(ssdhVal || "");
      }

      reports.push(report);
    }
  }
  
  // --- AMBIL MASTER DATA ---
  var sheetMaster = ss.getSheetByName('MasterData');
  var masterData = {};
  if (sheetMaster && sheetMaster.getLastRow() > 1) {
    var dataMaster = sheetMaster.getDataRange().getValues();
    for (var i = 1; i < dataMaster.length; i++) {
      if (dataMaster[i][0] && dataMaster[i][1]) {
        try {
          masterData[dataMaster[i][0]] = JSON.parse(dataMaster[i][1]);
        } catch(e) {}
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ reports: reports, masterData: masterData })).setMimeType(ContentService.MimeType.JSON);
}

function getValByHeaders(row, indices, keys) {
  for (var i = 0; i < keys.length; i++) {
    var idx = indices[keys[i]];
    if (idx !== undefined) return row[idx] || "";
  }
  return "";
}

function getNumByHeaders(row, indices, keys) {
  for (var i = 0; i < keys.length; i++) {
    var idx = indices[keys[i]];
    if (idx !== undefined && row[idx] !== "" && row[idx] !== null && !isNaN(row[idx])) {
      return Number(row[idx]);
    }
  }
  return null;
}

function uploadToDrive(folder, base64Data, fileName) {
  if (!base64Data || base64Data.length < 100) return "";
  if (base64Data.indexOf("http") === 0) return base64Data;

  try {
    var contentType = base64Data.substring(5, base64Data.indexOf(';'));
    var bytes = Utilities.base64Decode(base64Data.substring(base64Data.indexOf('base64,') + 7));
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "Error Upload";
  }
}

function saveReport(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Laporan');
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerIndices = {};
  for (var col = 0; col < headers.length; col++) {
    var h = String(headers[col]).trim().toLowerCase();
    headerIndices[h] = col;
  }

  var photosSebLinks = [];
  var photosSesLinks = [];
  
  for (var i = 0; i < 10; i++) {
     var sblmImg = data.photos && data.photos.sebelum && data.photos.sebelum[i] ? data.photos.sebelum[i] : null;
     var ssdhImg = data.photos && data.photos.sesudah && data.photos.sesudah[i] ? data.photos.sesudah[i] : null;

     var safeNo = (data.noPenugasan || 'NoID').replace(/[^a-zA-Z0-9-_]/g, '_');
     var safeKP = (data.keypoint || 'KP').replace(/[^a-zA-Z0-9-_]/g, '_');
     var nameBase = safeNo + "_" + safeKP + "_Area" + (i+1);
     
     var linkSeb = sblmImg ? uploadToDrive(folder, sblmImg, nameBase + "_SBLM.jpg") : "";
     var linkSes = ssdhImg ? uploadToDrive(folder, ssdhImg, nameBase + "_SSDH.jpg") : "";
     
     photosSebLinks.push(linkSeb);
     photosSesLinks.push(linkSes);
  }

  var newRow = new Array(headers.length).fill("");
  
  setColValue(newRow, headerIndices, ['id'], data.id);
  setColValue(newRow, headerIndices, ['timestamp', 'tanggal'], data.timestamp);
  setColValue(newRow, headerIndices, ['bulan'], data.bulan);
  setColValue(newRow, headerIndices, ['no penugasan', 'no. penugasan', 'nopenugasan'], data.noPenugasan);
  setColValue(newRow, headerIndices, ['ulp', 'unit (ulp)', 'unit'], data.ulp);
  setColValue(newRow, headerIndices, ['petugas 1', 'petugas1'], data.petugas1);
  setColValue(newRow, headerIndices, ['petugas 2', 'petugas2'], data.petugas2);
  setColValue(newRow, headerIndices, ['penyulang'], data.penyulang);
  setColValue(newRow, headerIndices, ['keypoint'], data.keypoint);
  setColValue(newRow, headerIndices, ['titik start', 'start', 'titikstart'], data.titikStart);
  setColValue(newRow, headerIndices, ['titik finish', 'finish', 'titikfinish'], data.titikFinish);
  setColValue(newRow, headerIndices, ['jumlah tiang', 'jumlah_tiang', 'jumlahtiang'], data.jumlahTiang);
  setColValue(newRow, headerIndices, ['jumlah kms', 'jumlah_kms', 'jumlahkms'], data.jumlahKms);

  for (var p = 1; p <= 10; p++) {
    var sblmKey = 'foto sblm ' + p;
    var ssdhKey = 'foto ssdh ' + p;
    
    var idxSeb = headerIndices[sblmKey];
    var idxSes = headerIndices[ssdhKey];
    
    if (idxSeb !== undefined) newRow[idxSeb] = photosSebLinks[p-1];
    if (idxSes !== undefined) newRow[idxSes] = photosSesLinks[p-1];
    
    if (idxSeb === undefined && idxSes === undefined && p <= 6) {
      newRow[11 + ((p - 1) * 2)] = photosSebLinks[p-1];
      newRow[12 + ((p - 1) * 2)] = photosSesLinks[p-1];
    }
  }

  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function updateReport(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Laporan');
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  var dataLaporan = sheet.getDataRange().getValues();
  var headers = dataLaporan[0];
  
  var headerIndices = {};
  for (var col = 0; col < headers.length; col++) {
    var h = String(headers[col]).trim().toLowerCase();
    headerIndices[h] = col;
  }

  var idIndex = headerIndices['id'] !== undefined ? headerIndices['id'] : 0;
  var targetRowIdx = -1;

  for (var i = 1; i < dataLaporan.length; i++) {
    if (String(dataLaporan[i][idIndex]) === String(data.id)) {
      targetRowIdx = i + 1;
      break;
    }
  }

  if (targetRowIdx === -1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Report ID not found' })).setMimeType(ContentService.MimeType.JSON);
  }

  var photosSebLinks = [];
  var photosSesLinks = [];
  
  for (var i = 0; i < 10; i++) {
     var sblmImg = data.photos && data.photos.sebelum && data.photos.sebelum[i] ? data.photos.sebelum[i] : null;
     var ssdhImg = data.photos && data.photos.sesudah && data.photos.sesudah[i] ? data.photos.sesudah[i] : null;

     var safeNo = (data.noPenugasan || 'NoID').replace(/[^a-zA-Z0-9-_]/g, '_');
     var safeKP = (data.keypoint || 'KP').replace(/[^a-zA-Z0-9-_]/g, '_');
     var nameBase = safeNo + "_" + safeKP + "_Area" + (i+1);
     
     var linkSeb = sblmImg ? uploadToDrive(folder, sblmImg, nameBase + "_SBLM.jpg") : "";
     var linkSes = ssdhImg ? uploadToDrive(folder, ssdhImg, nameBase + "_SSDH.jpg") : "";
     
     photosSebLinks.push(linkSeb);
     photosSesLinks.push(linkSes);
  }

  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['id'], data.id);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['timestamp', 'tanggal'], data.timestamp);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['bulan'], data.bulan);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['no penugasan', 'no. penugasan', 'nopenugasan'], data.noPenugasan);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['ulp', 'unit (ulp)', 'unit'], data.ulp);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['petugas 1', 'petugas1'], data.petugas1);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['petugas 2', 'petugas2'], data.petugas2);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['penyulang'], data.penyulang);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['keypoint'], data.keypoint);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['titik start', 'start', 'titikstart'], data.titikStart);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['titik finish', 'finish', 'titikfinish'], data.titikFinish);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['jumlah tiang', 'jumlah_tiang', 'jumlahtiang'], data.jumlahTiang);
  updateCellByHeaders(sheet, targetRowIdx, headerIndices, ['jumlah kms', 'jumlah_kms', 'jumlahkms'], data.jumlahKms);

  for (var p = 1; p <= 10; p++) {
    var sblmKey = 'foto sblm ' + p;
    var ssdhKey = 'foto ssdh ' + p;
    
    var idxSeb = headerIndices[sblmKey];
    var idxSes = headerIndices[ssdhKey];
    
    if (idxSeb !== undefined && photosSebLinks[p-1]) {
      sheet.getRange(targetRowIdx, idxSeb + 1).setValue(photosSebLinks[p-1]);
    }
    if (idxSes !== undefined && photosSesLinks[p-1]) {
      sheet.getRange(targetRowIdx, idxSes + 1).setValue(photosSesLinks[p-1]);
    }
    
    if (idxSeb === undefined && idxSes === undefined && p <= 6) {
      if (photosSebLinks[p-1]) sheet.getRange(targetRowIdx, 12 + ((p - 1) * 2)).setValue(photosSebLinks[p-1]);
      if (photosSesLinks[p-1]) sheet.getRange(targetRowIdx, 13 + ((p - 1) * 2)).setValue(photosSesLinks[p-1]);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function updateCellByHeaders(sheet, rowIdx, indices, keys, value) {
  for (var i = 0; i < keys.length; i++) {
    var idx = indices[keys[i]];
    if (idx !== undefined) {
      sheet.getRange(rowIdx, idx + 1).setValue(value);
      return;
    }
  }
}

function setColValue(row, indices, keys, value) {
  for (var i = 0; i < keys.length; i++) {
    var idx = indices[keys[i]];
    if (idx !== undefined) {
      row[idx] = value;
      return;
    }
  }
}

function updateMaster(fullMasterData) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('MasterData');
  
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
  }
  
  var rows = [];
  for (var key in fullMasterData) {
    rows.push([key, JSON.stringify(fullMasterData[key])]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}`;

interface AdminSettingsProps {
  masterData: Record<string, ULPData>;
  onAddPetugas: (ulp: ULPName, names: string[]) => void;
  onDeletePetugas: (ulp: ULPName, name: string) => void;
  onAddPenyulang: (ulp: ULPName, names: string[]) => void;
  onDeletePenyulang: (ulp: ULPName, name: string) => void;
  onAddKeypoint: (ulp: ULPName, penyulang: string, keypoints: string[]) => void;
  onDeleteKeypoint: (ulp: ULPName, penyulang: string, keypoint: string) => void;
  onInitDefault?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  masterData, 
  onAddPetugas, 
  onDeletePetugas, 
  onAddPenyulang,
  onDeletePenyulang,
  onAddKeypoint,
  onDeleteKeypoint,
  onInitDefault
}) => {
  const [selectedUlp, setSelectedUlp] = useState<ULPName | ''>('');
  const [newPetugas, setNewPetugas] = useState('');
  const [newPenyulang, setNewPenyulang] = useState('');
  
  const [activePenyulangForKeypoints, setActivePenyulangForKeypoints] = useState('');
  const [newKeypoint, setNewKeypoint] = useState('');
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  const handleAddPetugasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUlp && newPetugas.trim()) {
      const names = newPetugas.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        onAddPetugas(selectedUlp, names);
        setNewPetugas('');
      }
    }
  };

  const handleAddPenyulangSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUlp && newPenyulang.trim()) {
      const names = newPenyulang.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        onAddPenyulang(selectedUlp, names);
        setNewPenyulang('');
      }
    }
  };

  const handleAddKeypointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUlp && activePenyulangForKeypoints && newKeypoint.trim()) {
      const names = newKeypoint.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        onAddKeypoint(selectedUlp, activePenyulangForKeypoints, names);
        setNewKeypoint('');
      }
    }
  };

  const currentData = selectedUlp ? masterData[selectedUlp] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold text-blue-800">Petunjuk Pengelolaan Database</h3>
          <p className="text-sm text-blue-700 mt-1">
            Gunakan panel ini untuk mengelola master data petugas, penyulang, dan keypoint. 
            Data yang diubah akan disinkronkan ke server secara real-time.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-400">Sinkronisasi Spreadsheet & Google Drive</h3>
              <p className="text-slate-400 text-xs mt-0.5">Solusi inputan JUMLAH TIANG, JUMLAH KMS, dan 10 Pasang Foto tidak tersimpan</p>
            </div>
          </div>
          <button
            onClick={() => setShowScriptGuide(!showScriptGuide)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            {showScriptGuide ? 'Sembunyikan' : 'Lihat Solusi & Script'}
          </button>
        </div>

        {showScriptGuide && (
          <div className="pt-4 border-t border-slate-800 space-y-6 animate-fade-in text-slate-300">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-4 text-xs space-y-2">
              <span className="font-black uppercase tracking-wider block">⚠️ PENTING: Langkah Wajib Di Sisi Google Sheet</span>
              <p className="leading-relaxed">
                Penyebab data <strong>Jumlah Tiang</strong> dan <strong>Jumlah KMS</strong> tidak masuk ke Spreadsheet adalah karena kode Google Apps Script bawaan Anda belum disesuaikan untuk menyimpan kedua kolom tersebut. 
                Silakan ikuti instruksi di bawah ini dengan seksama untuk memperbarui kode Apps Script Anda secara instan:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-wider text-cyan-400">Langkah 1: Siapkan Kolom Spreadsheet</h4>
                <p className="leading-relaxed">
                  Buka Google Spreadsheet Anda pada sheet <strong>Laporan</strong>, pastikan baris pertama (Header) memiliki kolom berikut (case-insensitive & bebas urutan kolomnya karena script baru ini dinamis berdasarkan nama header):
                </p>
                <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 font-bold space-y-1">
                  <p>• <span className="text-white">id</span></p>
                  <p>• <span className="text-white">tanggal</span> / <span className="text-white">timestamp</span></p>
                  <p>• <span className="text-white">bulan</span></p>
                  <p>• <span className="text-white">no penugasan</span></p>
                  <p>• <span className="text-white">ulp</span> / <span className="text-white">unit (ulp)</span></p>
                  <p>• <span className="text-white">petugas 1</span> dan <span className="text-white">petugas 2</span></p>
                  <p>• <span className="text-white">penyulang</span></p>
                  <p>• <span className="text-white">keypoint</span></p>
                  <p>• <span className="text-white">titik start</span> dan <span className="text-white">titik finish</span></p>
                  <p className="text-amber-400 font-black">• JUMLAH TIANG <span className="text-slate-400 font-normal">(Wajib Ditambahkan)</span></p>
                  <p className="text-amber-400 font-black">• JUMLAH KMS <span className="text-slate-400 font-normal">(Wajib Ditambahkan)</span></p>
                  <p>• <span className="text-white">foto sblm 1</span> s/d <span className="text-white">foto sblm 10</span></p>
                  <p>• <span className="text-white">foto ssdh 1</span> s/d <span className="text-white">foto ssdh 10</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-wider text-cyan-400">Langkah 2: Update Google Apps Script</h4>
                <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                  <li>Buka Spreadsheet Anda, lalu klik menu <strong className="text-white">Ekstensi</strong> &gt; <strong className="text-white">Apps Script</strong>.</li>
                  <li>Hapus seluruh kode lama yang ada di editor Apps Script Anda.</li>
                  <li>Copy kode lengkap di bawah ini (Langkah 3) dan paste di editor Anda.</li>
                  <li>Pastikan Anda mengganti nilai variabel <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">SPREADSHEET_ID</code> dan <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">DRIVE_FOLDER_ID</code> dengan ID milik Anda sendiri.</li>
                  <li>Klik tombol <strong className="text-white">Simpan</strong> (ikon disket).</li>
                  <li>Klik tombol <strong className="text-white">Terapkan (Deploy)</strong> &gt; <strong className="text-white">Deployment Baru</strong>.</li>
                  <li>Pilih jenis <strong className="text-white">Aplikasi Web</strong>. Isi deskripsi (misal: "Update Tiang & KMS"), jalankan sebagai <strong className="text-white">Saya</strong>, dan beri akses ke <strong className="text-amber-400">Siapa saja (Anyone)</strong>.</li>
                  <li>Klik <strong className="text-white">Terapkan</strong>, lalu salin URL Web App baru Anda dan simpan di file konfigurasi.</li>
                </ol>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-black uppercase tracking-wider text-cyan-400">Langkah 3: Kode Google Apps Script Terbaru (Copy & Paste)</h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(gasCodeText);
                    alert("Kode Apps Script berhasil disalin!");
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer"
                >
                  Salin Kode
                </button>
              </div>
              <pre className="p-4 bg-black/50 border border-slate-800 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-96 select-all scrollbar-thin scrollbar-thumb-slate-800">
                {gasCodeText}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Data Master Sistem</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Edit Konfigurasi Petugas & Infrastruktur</p>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Pilih Unit Layanan (ULP)</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none font-bold text-sm bg-slate-50 transition-all"
              value={selectedUlp}
              onChange={(e) => {
                setSelectedUlp(e.target.value as ULPName);
                setActivePenyulangForKeypoints('');
              }}
            >
              <option value="">-- Pilih ULP --</option>
              {Object.values(masterData).map((data: ULPData) => (
                <option key={data.name} value={data.name}>{data.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedUlp && (
          <div className="text-center p-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Silahkan Pilih Unit Dahulu</h3>
          </div>
        )}

        {selectedUlp && currentData && (
          <div className="space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Petugas */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Petugas</h3>
                </div>
                
                <form onSubmit={handleAddPetugasSubmit} className="flex gap-2">
                  <input
                    placeholder="Nama Petugas..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                    value={newPetugas}
                    onChange={(e) => setNewPetugas(e.target.value)}
                  />
                  <button type="submit" className="bg-primary text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-800 shadow-lg shadow-cyan-100 transition-all">+</button>
                </form>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 max-h-60 overflow-y-auto no-scrollbar">
                  <div className="divide-y divide-slate-200">
                    {currentData.petugas.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 group hover:bg-white transition-all">
                        <span className="text-xs font-bold text-slate-700 uppercase">{p}</span>
                        <button onClick={() => onDeletePetugas(selectedUlp, p)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Penyulang */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Penyulang</h3>
                </div>

                <form onSubmit={handleAddPenyulangSubmit} className="flex gap-2">
                  <input
                    placeholder="Kode Penyulang..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                    value={newPenyulang}
                    onChange={(e) => setNewPenyulang(e.target.value)}
                  />
                  <button type="submit" className="bg-amber-500 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all">+</button>
                </form>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 max-h-60 overflow-y-auto no-scrollbar">
                  <div className="divide-y divide-slate-200">
                    {currentData.penyulang.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 group hover:bg-white transition-all">
                        <span className="text-xs font-bold text-slate-700 uppercase">{p}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setActivePenyulangForKeypoints(p)}
                            className={`p-2 rounded-lg transition-all ${activePenyulangForKeypoints === p ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                            title="Edit Keypoints"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button onClick={() => onDeletePenyulang(selectedUlp, p)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Keypoints (Full Width) */}
            <div className={`p-8 rounded-[2rem] border-2 transition-all ${activePenyulangForKeypoints ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'}`}>
               {!activePenyulangForKeypoints ? (
                 <div className="text-center py-10">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Pilih satu penyulang di atas untuk mengedit daftar Keypoint</p>
                 </div>
               ) : (
                 <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                         </div>
                         <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kelola Keypoint</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Penyulang: {activePenyulangForKeypoints}</p>
                         </div>
                       </div>
                       <button onClick={() => setActivePenyulangForKeypoints('')} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Tutup</button>
                    </div>

                    <form onSubmit={handleAddKeypointSubmit} className="flex gap-2">
                       <input 
                        placeholder="Nama Keypoint (Contoh: RECLOSER XX)..."
                        className="flex-1 px-5 py-4 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none bg-white shadow-sm"
                        value={newKeypoint}
                        onChange={(e) => setNewKeypoint(e.target.value)}
                       />
                       <button type="submit" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-800 shadow-xl shadow-cyan-100">Tambah</button>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {(currentData.keypoints?.[activePenyulangForKeypoints] || []).length > 0 ? (
                         (currentData.keypoints?.[activePenyulangForKeypoints] || []).map((kp, idx) => (
                           <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group">
                             <span className="text-[11px] font-bold text-slate-700 uppercase">{kp}</span>
                             <button onClick={() => onDeleteKeypoint(selectedUlp, activePenyulangForKeypoints, kp)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           </div>
                         ))
                       ) : (
                         <div className="col-span-full py-8 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">Belum ada keypoint terdaftar untuk penyulang ini</div>
                       )}
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
