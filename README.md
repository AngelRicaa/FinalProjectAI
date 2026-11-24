# Focusly — Frontend Prototype

Frontend sederhana untuk proyek pemantauan indikasi fokus.

## Cara menjalankan
1. Install Node.js (versi LTS) dari https://nodejs.org/
2. Ekstrak ZIP ini.
3. Buka folder `focus-monitor-frontend` di Visual Studio Code.
4. Buka Terminal > New Terminal.
5. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
6. Buka alamat localhost yang muncul di terminal (biasanya http://localhost:5173).
7. Klik **Aktifkan kamera** dan izinkan akses kamera di browser.

## Yang sudah berfungsi
- Tampilan dashboard responsif.
- Tombol aktifkan/matikan webcam.
- Preview kamera langsung.
- Tombol mulai/akhiri sesi monitoring.
- Penghitung durasi sesi.

## Yang belum terhubung
- MediaPipe Face Landmarker.
- Estimasi sudut kepala dan arah tatapan.
- Rule-based detection dan peringatan otomatis.

Status AI sengaja ditandai belum terhubung. Jadi jangan menganggap aplikasi ini sudah mendeteksi fokus atau distraksi. Tahap berikutnya adalah integrasi MediaPipe dan aturan deteksi dari proyek.
"# FinalProjectAI" 
