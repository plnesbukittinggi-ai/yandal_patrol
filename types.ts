
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export enum ULPName {
  BUKITTINGGI = 'ULP Bukittinggi',
  PADANG_PANJANG = 'ULP Padang Panjang',
  LUBUK_SIKAPING = 'ULP Lubuk Sikaping',
  LUBUK_BASUNG = 'ULP Lubuk Basung',
  SIMPANG_EMPAT = 'ULP Simpang Empat',
  BASO = 'ULP Baso',
  KOTO_TUO = 'ULP Koto Tuo'
}

export interface ReportData {
  id: string;
  timestamp: string; // ISO String
  bulan: string; // Month name
  noPenugasan: string;
  ulp: ULPName;
  petugas1: string;
  petugas2: string;
  penyulang: string;
  keypoint: string;
  titikStart: string;
  titikFinish: string;
  photos: {
    sebelum: (string | null)[]; // Array of 6 URLs/Base64
    sesudah: (string | null)[]; // Array of 6 URLs/Base64
  };
}

export interface ULPData {
  name: ULPName;
  petugas: string[];
  penyulang: string[];
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'INPUT' | 'TABLE' | 'SETTINGS';
