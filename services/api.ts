import { ReportData, ULPData } from '../types';

/**
 * URL Google Apps Script
 */
const GOOGLE_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbxC8EQK_NKhYJT9GQm5NRnh7KXmarlfWMQdTKvzDAn03ScPUEWpzSeGiNvTzQ3JKQSt/exec'; 

export const api = {
  getAllData: async () => {
    try {
      const url = `${GOOGLE_SCRIPT_URL}?action=getAll&_=${Date.now()}`;
      console.log("Fetching all data from:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log("Raw response length:", text.length);
      
      if (text.trim().startsWith('<')) {
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error("Database mengembalikan format HTML. Pastikan skrip dideploy sebagai 'Anyone'.");
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {
        console.error("JSON Parse Error. Raw text:", text.substring(0, 500));
        throw new Error("Gagal mengurai data JSON dari server.");
      }
    } catch (error: any) {
      console.error("Detailed API Error (GetAll):", error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("Gagal terhubung ke server (CORS/Network Error). Ini biasanya terjadi jika skrip Apps Script error atau belum di-deploy sebagai 'Anyone'.");
      }
      throw error;
    }
  },

  getBackupFiles: async () => {
    try {
      const url = `${GOOGLE_SCRIPT_URL}?action=getBackupFiles&_=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      
      if (text.trim().startsWith('<')) {
        throw new Error("Server mengembalikan HTML. Pastikan fungsi getBackupFiles sudah ada di Apps Script dan di-deploy sebagai 'Anyone'.");
      }

      try {
        const data = JSON.parse(text);
        if (data.error) throw new Error(data.error);
        return data;
      } catch (e: any) {
        if (e.message) throw e;
        throw new Error("Gagal mengurai data JSON dari server.");
      }
    } catch (error: any) {
      console.error("API Error (GetBackupFiles):", error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("Gagal terhubung ke server (CORS/Network Error). Pastikan URL benar, skrip di-deploy sebagai 'Anyone', dan fungsi getBackupFiles sudah ditambahkan.");
      }
      throw error;
    }
  },

  saveReport: async (report: ReportData, isEdit: boolean = false) => {
    try {
      const action = isEdit ? 'updateReport' : 'saveReport';
      
      // Payload JSON yang menyertakan action di dalam body
      const payload = JSON.stringify({
        action: action,
        data: report
      });

      // Menyertakan action di URL query string sebagai fallback utama untuk GAS
      const urlWithAction = `${GOOGLE_SCRIPT_URL}?action=${action}`;

      // Mode no-cors digunakan untuk menghindari kegagalan preflight CORS pada GAS Redirect
      await fetch(urlWithAction, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 
          'Content-Type': 'text/plain' 
        },
        body: payload
      });

      // No-cors tidak mengembalikan respon yang bisa dibaca, asumsikan sukses jika tidak ada error jaringan
      return true;
    } catch (error) {
      console.error("API Error (Save/Update):", error);
      throw error;
    }
  },

  updateMasterData: async (masterData: Record<string, ULPData>) => {
    try {
      const payload = JSON.stringify({
        action: 'updateMaster',
        data: masterData
      });

      const urlWithAction = `${GOOGLE_SCRIPT_URL}?action=updateMaster`;

      await fetch(urlWithAction, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: payload
      });
      return true;
    } catch (error) {
      console.error("API Error (UpdateMaster):", error);
      return true;
    }
  }
};
