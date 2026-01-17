
import { ReportData, ULPData } from '../types';

// ==================================================================================
// ⚠️ PENTING: GANTI URL DI BAWAH INI DENGAN URL DEPLOYMENT GOOGLE APPS SCRIPT ANDA
// ==================================================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxd3fmKldbMeRHOY6kEbfUn93DFvIhf50AbwM_g7FJysbqoRYq46SHoO2v0Gb1ZaBmy/exec'; 
// Contoh: 'https://script.google.com/macros/s/AKfycbx.../exec'

export const api = {
  // Ambil semua data (Laporan & Master Data)
  getAllData: async () => {
    try {
      if (GOOGLE_SCRIPT_URL === 'MASUKKAN_URL_DEPLOYMENT_ANDA_DISINI') {
          console.warn("URL Google Script belum diset di services/api.ts");
          return null;
      }
      
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  },

  // Simpan laporan baru
  saveReport: async (report: ReportData) => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveReport',
          data: report
        })
      });
    } catch (error) {
      console.error("Error saving report:", error);
      throw error;
    }
  },

  // Update Master Data
  updateMasterData: async (masterData: Record<string, ULPData>) => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateMaster',
          data: masterData
        })
      });
    } catch (error) {
      console.error("Error updating master data:", error);
      throw error;
    }
  }
};
