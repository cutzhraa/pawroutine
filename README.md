# 🐾 PawRoutine

> *"A Progressive Web App (PWA) built to solve my own daily struggles in taking care of exotic pets and lovely anabuls—managing feeding routines, vitamin schedules, inventory stock tracking, and health milestones without the hassle of forgetting!"*

[![React](https://img.shields.io/badge/React.js-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 💡 The Story / Latar Belakang

Pernah nggak sih, melihara peliharaan kesayangan tapi malah **lupa kapan terakhir kali dikasih makan** di siang hari, pas sore-sore sadar kalau **stok makanan di rumah udah habis**, belum lagi lupa kapan jadwal minum vitamin dan obat cacing terakhir kali? 

Dari pengalaman nyata dan rasa gemas karena sering pelupa itulah **PawRoutine** lahir! Aplikasi web interaktif ini dirancang khusus untuk merapikan seluruh rutinitas harian hewan peliharaan langsung dari genggaman HP atau laptop. **Mulai dari keadaan bersih (polos tanpa data bawaan)**, kamu bebas menambahkan profil anabul sesuai peliharaan aslimu di rumah!

---

## ✨ Key Features (Fitur Utama)

1. **Multi-Pet Support (Manajemen Banyak Anabul):** 
   - Keadaan awal bersih/polos, bebas menambahkan peliharaan (musang, kucing, anjing, hamster, burung, dll.) dengan profil dan foto kustom masing-masing.
2. **Per-Pet Food Inventory (Stok Makanan Spesifik):** 
   - Setiap anabul punya daftar persediaan makanannya sendiri (tidak tercampur), lengkap dengan sistem pantau jumlah fisik dan jenis satuannya.
3. **Daily Feeding Log & Cute Sound Feedback:** 
   - Tombol simpel "Catat Kasih Makan" disertai riwayat jam makan, lengkap dengan animasi dan efek suara gemes saat ditekan!
4. **Health & Milestone Journal:** 
   - Catatan interaktif untuk estimasi umur, jadwal mandi (yang bisa disinkronkan langsung dengan satu klik), hingga riwayat obat cacing.
5. **Calendar History & Undo Log (Kalender & Pembatalan Rekap):** 
   - Fitur rekap harian untuk melihat ringkasan aktivitas di hari sebelumnya, lengkap dengan tombol **Batalkan** jika rekap harian tidak sengaja terpencet.
6. **Data Backup & Restore (JSON):** 
   - Fitur aman berbasis lokal yang memungkinkan kamu mengunduh dan memulihkan seluruh data riwayat perawatan kapan pun dibutuhkan.
7. **PWA Ready:** 
   - Bisa di-*install* langsung ke *Home Screen* HP layaknya aplikasi native tanpa perlu mampir ke Play Store.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite
- **Styling:** Tailwind CSS (v4)
- **State & Storage:** React Hooks (`useState`, `useEffect`, `useRef`), LocalStorage API
- **Audio & Visual:** Web Audio API (Synthetic cute sound generator), CSS Animations

---

## 🚀 Getting Started & Deployment

### 1. Cara Menjalankan Lokal (Development)
Kalau kamu mau *clone* dan *running* proyek ini secara lokal di komputermu, ikuti langkah ini:

```bash
# 1. Clone repository ini
git clone [https://github.com/username/pawroutine.git](https://github.com/username/pawroutine.git)

# 2. Masuk ke direktori proyek
cd pawroutine

# 3. Install dependencies
npm install

# 4. Jalankan server lokal
npm run dev

2. Cara Akses Online (PWA Live Demo)
Kamu bisa langsung menggunakan aplikasi ini secara online atau meng-install-nya sebagai PWA di HP melalui link live-nya:
👉 https://pawroutineku.vercel.app

3. Cara Deploy Sendiri (Vercel)
Mau deploy project ini sendiri biar punya link online pribadi? Gampang banget:

Push repository kamu ke GitHub.

Buka Vercel, lalu klik Add New Project.

Import repository pawroutine.

Vercel bakal otomatis mendeteksi settingan Vite React, tinggal klik Deploy! Selesai dalam 1 menit.