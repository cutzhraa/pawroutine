# 🐾 PawRoutine

> *"A Progressive Web App (PWA) built to solve my own daily struggles in taking care of exotic pets (Musang) and other lovely anabuls—managing feeding routines, fish oil vitamins, stock tracking, and health milestones without the hassle of forgetting!"*

[![React](https://img.shields.io/badge/React.js-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 💡 The Story / Latar Belakang

Pernah nggak sih, melihara peliharaan (kayak musang kesayangan) tapi malah **lupa kapan terakhir kali dikasih makan** di siang hari karena mereka hobi banget tidur, atau pas sore-sore sadar kalau **stok pisang di rumah udah habis**, belum lagi lupa kapan jadwal minum obat cacing dan minyak ikan terakhir kali? 

Dari pengalaman nyata dan rasa gemas karena sering pelupa itulah **PawRoutine** lahir! Aplikasi web interaktif ini dirancang khusus untuk merapikan seluruh rutinitas harian hewan peliharaan langsung dari genggaman HP atau laptop.

---

## ✨ Key Features (Fitur Utama)

1. **Multi-Pet Support (Manajemen Banyak Anabul):** 
   - Bisa memantau lebih dari satu peliharaan sekaligus (misal: Musang, Kucing, Hamster, dll.) dengan profil dan foto kustom masing-masing.
2. **Per-Pet Food Inventory (Stok Makanan Spesifik):** 
   - Setiap anabul punya daftar persediaan makanannya sendiri (tidak tercampur), lengkap dengan sistem pantau jumlah porsi fisik.
3. **Daily Feeding Log & Cute Sound Feedback:** 
   - Catat porsi makan harian (hitung per biji/porsi) disertai riwayat jam makan, lengkap dengan animasi dan efek suara gemes saat tombol ditekan!
4. **Health & Milestone Journal:** 
   - Catatan interaktif untuk estimasi umur, jadwal mandi (yang bisa disinkronkan langsung dengan satu klik), hingga riwayat obat cacing.
5. **Calendar History (Kalender Log):** 
   - Fitur rekap harian untuk melihat kembali ringkasan aktivitas perawatan anabul di hari-hari sebelumnya.
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

## 🚀 Getting Started (Cara Menjalankan)

Kalau kamu mau clone dan running proyek ini secara lokal di komputermu, ikuti langkah ini:

```bash
# 1. Clone repository ini
git clone [https://github.com/username/pawroutine.git](https://github.com/username/pawroutine.git)

# 2. Masuk ke direktori proyek
cd pawroutine

# 3. Install dependencies
npm install

# 4. Jalankan server lokal
npm run dev