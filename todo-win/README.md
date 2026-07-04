# Todo Sederhana — aplikasi native Windows (C + Win32 + SQLite)

Aplikasi todo desktop yang ringan untuk **Windows**, dikompilasi menjadi **satu
`.exe` mandiri** (± 640 KB, tanpa DLL tambahan). Ditulis dalam C dengan **Win32
API murni** untuk tampilan native yang sederhana & serius, dan **SQLite
embedded** (di-*link* statis) untuk penyimpanan.

## Masalah yang diselesaikan

1. **Tahu tugas mana yang perlu di-follow-up.** Karena kerja berkelanjutan
   membuat banyak tugas berjalan paralel, menandai *setiap* jadwal yang
   bersinggungan tidak berguna. Aplikasi memakai penanda **Follow-up berbasis
   deadline**: sebuah tugas aktif ditandai bila **mendesak karena deadline-nya
   sendiri** (Terlewat / Hari ini / Segera ≤ 3 hari) **atau deadline-nya
   berdesakan** dengan tugas aktif lain (≤ 3 hari → *Bentrok deadline*). Daftar
   **otomatis terurut** sehingga yang paling mendesak naik ke atas.
2. **Input tidak konsisten.** Satu bilah input di atas jendela memungkinkan
   mengisi **judul + tanggal mulai + deadline sekaligus** lalu tekan *Tambah*.
   Pemilih tanggal default = hari ini.
3. **Visual berantakan.** Menggunakan kontrol native Windows (ListView,
   DateTimePicker) — **tanpa emoji, tanpa warna mencolok**. Penanda status
   (`Aktif`/`Selesai`) dan kolom `Follow-up` berupa teks.

## Fitur

- Tambah tugas (judul, tanggal mulai, deadline) sekaligus.
- **Follow-up otomatis**: kolom menampilkan `Terlewat` / `Hari ini` / `Segera` /
  `Bentrok deadline`, dan daftar terurut berdasarkan tingkat urgensi.
- Tandai **Selesai** / belum (tombol atau klik-ganda pada baris).
- **Edit** penuh (judul & tanggal) lewat dialog.
- **Hapus** tugas.
- Peringatan saat input **hanya** untuk bentrok deadline (non-blokir).
- Data tersimpan di `%APPDATA%\SimpleTodo\todo.db`.

Ambang follow-up (3 hari) diatur lewat `FOLLOWUP_DAYS` di `src/overlap.h`.

## Struktur

```
todo-win/
  src/
    main.c        GUI Win32 (jendela, kontrol, event, dialog edit)
    todo.h        struct data bersama
    db.h / db.c   lapisan SQLite (open/migrate/CRUD)
    overlap.h/.c  logika follow-up berbasis deadline (fungsi murni)
  third_party/
    sqlite3.c/.h  amalgamation SQLite (di-compile statis ke dalam .exe)
  resources/
    app.rc, app.manifest, resource.h   dialog + manifest Common Controls v6
  tests/
    test_logic.c  uji native untuk db + overlap
  Makefile
```

## Build

Butuh **mingw-w64** (cross-compile dari Linux) atau MinGW-w64 di Windows.

```sh
# Linux (Debian/Ubuntu):
sudo apt-get install -y gcc-mingw-w64-x86-64
make win          # menghasilkan ./todo.exe
```

Di Windows dengan MinGW terpasang, sesuaikan variabel bila perlu:

```sh
make win MINGW=gcc WINDRES=windres
```

## Uji

Logika inti (SQLite CRUD + deteksi follow-up berbasis deadline) diuji secara
native tanpa Windows:

```sh
make test         # kompilasi dengan gcc lalu jalankan; harus "SEMUA LULUS"
```

### Uji manual di Windows (GUI)

Jalankan `todo.exe`, lalu:

1. Buat beberapa tugas dengan deadline berbeda: kemarin, hari ini, +2 hari, lalu
   dua tugas yang **rentangnya bersinggungan tapi deadline-nya berjauhan**
   (>3 hari). Perhatikan: yang mendesak naik ke atas, dan kolom **Follow-up**
   menampilkan `Terlewat` / `Hari ini` / `Segera`; tugas yang sekadar overlap
   tapi deadline jauh **tidak** ditandai.
2. Buat dua tugas dengan deadline berdekatan (≤ 3 hari) → keduanya ditandai
   **Bentrok deadline**; saat menambahnya muncul peringatan (boleh tetap simpan).
3. Pilih tugas → **Tandai Selesai** (tugas selesai turun & tak lagi dihitung).
4. **Edit** mengubah judul/tanggal; **Hapus** menghapus tugas.

## Catatan

- `make win` memakai `-Os -s -static` agar `.exe` kecil dan mandiri.
- SQLite dikompilasi dengan `SQLITE_THREADSAFE=0` (single-thread, cukup untuk
  satu jendela GUI) dan tanpa load-extension.
