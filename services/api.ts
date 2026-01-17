
import { ReportData, ULPData } from '../types';

/**
 * ⚠️ PENTING: PENGATURAN GOOGLE APPS SCRIPT
 * Masalah "Unexpected token <" terjadi karena Google mengirimkan halaman HTML (Login/Error) bukan JSON.
 * Solusi:
 * 1. Di Apps Script, Klik "Deploy" -> "Manage Deployments".
 * 2. Edit deployment aktif (ikon pensil).
 * 3. Ubah "Who has access" menjadi "Anyone".
 * 4. Klik "Deploy".
 */
const GOOGLE_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbw4uVV-vGPeL0Peg-bdco6VL8zKAH8Z5N3ZBJo3bYEZt8IVHNkBAuKluLsQLlu7msQ/exec'; 

export const api = {
  getAllData: async () => {
    try {
      if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('AKfycbw4uVV-vGPeL0Peg-bdco6VL8zKAH8Z5N3ZBJo3bYEZt8IVHNkBAuKluLsQLlu7msQ')) {
         // URL masih default, biarkan mencoba atau fallback ke demo
      }
      
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const text = await response.text();
      
      // Deteksi jika respon adalah HTML (biasanya diawali <!DOCTYPE atau <html)
      if (text.trim().startsWith('<')) {
        console.error("Database mengembalikan HTML alih-alih JSON. Cek izin 'Anyone' di Google Script.");
        throw new Error("Izin Akses Ditolak: Pastikan Deployment Google Script diatur ke 'Anyone' (Siapa saja).");
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error("Gagal mengolah data dari server (JSON parse error).");
      }
    } catch (error: any) {
      console.error("API Error:", error);
      throw error;
    }
  },

  saveReport: async (report: ReportData) => {
    try {
      // POST ke Google Apps Script paling aman menggunakan mode no-cors untuk menghindari blokir CORS
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveReport',
          data: report
        })
      });
      return true;
    } catch (error) {
      console.error("Error saving report:", error);
      throw error;
    }
  },

  updateMasterData: async (masterData: Record<string, ULPData>) => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMaster',
          data: masterData
        })
      });
      return true;
    } catch (error) {
      console.error("Error updating master data:", error);
      throw error;
    }
  }
};
