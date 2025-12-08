import { ULPName, ULPData } from './types';

export const DATA_ULP: Record<string, ULPData> = {
  [ULPName.BUKITTINGGI]: {
    name: ULPName.BUKITTINGGI,
    petugas: ['Ahmad Zaki', 'Budi Santoso', 'Candra Wijaya', 'Doni Kurniawan'],
    penyulang: ['BKT.01', 'BKT.02', 'BKT.03', 'BKT.Express']
  },
  [ULPName.PADANG_PANJANG]: {
    name: ULPName.PADANG_PANJANG,
    petugas: ['Eko Prasetyo', 'Fajar Nugroho', 'Gilang Ramadhan'],
    penyulang: ['PP.01', 'PP.02', 'PP.Industri']
  },
  [ULPName.LUBUK_SIKAPING]: {
    name: ULPName.LUBUK_SIKAPING,
    petugas: ['Hendra Gunawan', 'Indra Lesmana', 'Joko Susilo'],
    penyulang: ['LBS.01', 'LBS.02']
  },
  [ULPName.LUBUK_BASUNG]: {
    name: ULPName.LUBUK_BASUNG,
    petugas: ['Kiki Amalia', 'Lukman Hakim', 'Muhammad Ilham'],
    penyulang: ['LBB.01', 'LBB.02', 'LBB.03']
  },
  [ULPName.SIMPANG_EMPAT]: {
    name: ULPName.SIMPANG_EMPAT,
    petugas: ['Nanda Putra', 'Oki Setiawan', 'Putra Pratama'],
    penyulang: ['SPE.01', 'SPE.02', 'SPE.03', 'SPE.04']
  },
  [ULPName.BASO]: {
    name: ULPName.BASO,
    petugas: ['Qori Sandi', 'Rian Hidayat', 'Surya Saputra'],
    penyulang: ['BSO.01', 'BSO.02']
  },
  [ULPName.KOTO_TUO]: {
    name: ULPName.KOTO_TUO,
    petugas: ['Taufik Hidayat', 'Usman Harun', 'Vicky Nitinegoro'],
    penyulang: ['KT.01', 'KT.02']
  }
};

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const PHOTO_SECTIONS = [1, 2, 3, 4, 5, 6];