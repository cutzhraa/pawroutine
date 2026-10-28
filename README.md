# PawRoutine

PawRoutine adalah aplikasi web untuk mencatat rutinitas perawatan beberapa hewan peliharaan. Data disimpan di browser yang digunakan, sehingga setiap perangkat memiliki penyimpanannya sendiri.

## Fitur

- Buat dan kelola profil beberapa hewan, termasuk jenis, foto, dan catatan perawatan.
- Catat pemberian makan, air, dan vitamin untuk setiap hewan.
- Kelola stok makanan dan vitamin; stok makanan berkurang saat pemberian makan dicatat.
- Catat perkiraan umur, jadwal mandi, dan obat cacing.
- Rekap aktivitas harian ke kalender riwayat dan pulihkan rekap yang tidak sengaja dibuat.
- Ekspor dan pulihkan data melalui file JSON.
- Antarmuka responsif dengan manifest aplikasi untuk pemasangan di perangkat yang mendukungnya.

## Teknologi

- React 19
- Vite 8
- Tailwind CSS 4
- Penyimpanan lokal browser (`localStorage`)

## Menjalankan secara lokal

Persyaratan: Node.js dan npm.

```bash
git clone https://github.com/cutzhraa/pawroutine.git
cd pawroutine
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal.

## Build produksi

```bash
npm run build
npm run preview
```

Vite menghasilkan berkas statis di direktori `dist/`. Perintah preview menyajikan build tersebut secara lokal.

## Deploy

Proyek ini menggunakan Vite tanpa konfigurasi platform deploy khusus. Hubungkan repository ke layanan hosting situs statis, gunakan `npm run build` sebagai perintah build, dan `dist` sebagai direktori output. Untuk Vercel, impor repository dari dashboard Vercel dan konfirmasikan pengaturan build tersebut.

## Penyimpanan dan backup

Data profil, stok, dan riwayat tersimpan di `localStorage` browser. Data tidak tersinkron antarperangkat atau antar-browser. Gunakan menu **Backup** di aplikasi untuk mengunduh backup JSON secara berkala dan memulihkannya bila diperlukan. Menghapus data browser dapat menghapus data PawRoutine yang tersimpan di sana.
