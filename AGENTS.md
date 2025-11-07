Scope
- File ini berlaku untuk seluruh repo (ditempatkan di root). Semua pekerjaan analisis, refactor, dan rekomendasi WAJIB mengikuti aturan pada CSV di `public/csv/`.

Tujuan
- Menjamin setiap analisis (bug-hunt, refactor, optimasi, rekomendasi, QA data) tervalidasi terhadap keseluruhan isi CSV (bukan subset) dan konsisten dengan skema/header CSV.

Sumber Kebenaran (CSV)
- Anggap semua CSV di `public/csv/` sebagai sumber kebenaran:
  - `public/csv/hero-adjustments.csv`
  - `public/csv/heroes.csv`
  - `public/csv/items.csv`
- Jika terdapat file `public/csv/rules.csv` atau pola `*-rules.csv`, anggap sebagai daftar aturan utama yang WAJIB dipatuhi seluruh analisis.

Kontrak Kolom (baseline)
- hero-adjustments.csv: Hero Name, Date, Season, Description
- heroes.csv: Hero Name, Role, Damage Type, Attack Reliance, Note
- items.csv: Item Name, Category, Price, Attack, Attack Speed, Crit Chance, Armor Penetration, Spell Vamp, Magic Power, HP, Armor, Magic Resist, Movement Speed, Cooldown Reduction, Mana Regen, HP Regen, Description
- Catatan: Nama kolom adalah kontrak data. Perubahan nama/tipe kolom mewajibkan audit dan penyesuaian komponen UI, API, adapter, query, dan util parsing yang bergantung.

Checklist Analisis (WAJIB)
1) Enumerasi file: ambil semua `public/csv/*.csv` (jangan hardcode 1 file saja).
2) Validasi header: pastikan semua properti yang dipakai kode/komponen ada di header CSV terkait (case/underscore sensitif sesuai pemakaian).
3) Cakupan data: algoritme/komponen TIDAK boleh mengasumsikan subset; pastikan seluruh baris CSV dipertimbangkan atau ada filter eksplisit dan terdokumentasi.
4) Konsistensi referensi:
   - Setiap "Hero Name" pada `hero-adjustments.csv` harus cocok dengan daftar di `heroes.csv`.
   - Penyebutan item harus cocok dengan "Item Name" pada `items.csv`.
5) Tipe data & format:
   - Kolom numerik (Price, Armor, Magic Resist, Attack Speed, Cooldown Reduction, dll.) harus diperlakukan numerik (hindari parsing naif yang menghasilkan string).
   - Kolom tanggal "Date": gunakan format display konsisten (disarankan dd-MM-yyyy) dan olah/persist secara aman (ISO lebih aman bila diperlukan).
6) Konsistensi analisis <-> data: setiap kesimpulan/rekomendasi harus dapat ditelusuri ke baris CSV relevan (hero/item/adjustment) beserta kolom yang dipakai.
7) Hindari magic values: gunakan header kolom atau konstanta util yang jelas, bukan indeks kolom mentah.

Laporan Hasil Analisis (ringkas)
- CSV diverifikasi: sebutkan file + jumlah baris dibaca (per file).
- Pelanggaran/anomali: daftar singkat (header hilang, referensi tak cocok, tipe data salah, baris penting kosong, dsb.).
- Dampak ke kode: sebutkan file/route/komponen terdampak dan rencana perubahan minimal.
- Asumsi: catat asumsi eksplisit bila ada data ambigu/kurang.

Gatekeeping
- Perubahan/PR TIDAK boleh di-merge jika masih ada pelanggaran terhadap CSV rules/data kecuali ada justifikasi eksplisit dan rencana perbaikan terjadwal.

Tips Teknis
- PowerShell: `Import-Csv public/csv/heroes.csv | Measure-Object` untuk cek cepat jumlah baris.
- Next.js/Node:
  - Server/build: baca `public/csv/*` via `fs`, lalu parse CSV.
  - Client: `fetch('/csv/items.csv')` bila perlu parsing di klien (hindari untuk data besar; prefer API yang memvalidasi di server).
- Validasi silang cepat:
  - Cocokkan set nama hero antar `heroes.csv` dan `hero-adjustments.csv`.
  - Audit kolom numerik di `items.csv` agar tidak diperlakukan sebagai string pada perhitungan.

Change Management
- Jika menambah/mengubah kolom CSV: sertakan update util/parser, endpoint API terkait, dan dokumentasi singkat perubahan (breaking/non-breaking) pada PR.

PR Check Items (ringkas)
- [ ] Sudah validasi header semua CSV yang disentuh.
- [ ] Sudah proses seluruh baris CSV (atau dokumentasi filter jelas).
- [ ] Sudah validasi referensi hero/item antar CSV.
- [ ] Sudah verifikasi tipe data dan format tanggal.
- [ ] Laporan hasil analisis terlampir pada deskripsi PR.
