# Todo Sederhana — aplikasi native Windows (C + Win32 + SQLite)

Aplikasi todo desktop yang ringan untuk **Windows**, dikompilasi menjadi **satu
`.exe` mandiri** (± 640 KB, tanpa DLL tambahan). Ditulis dalam C dengan **Win32
API murni** untuk tampilan native yang sederhana & serius, dan **SQLite
embedded** (di-*link* statis) untuk penyimpanan.

## Masalah yang diselesaikan

1. **Jadwal tumpang tindih.** Setiap tugas menyimpan **tanggal mulai** dan
   **deadline**. Saat menambah tugas baru yang rentang tanggalnya bersinggungan
   dengan tugas aktif lain, aplikasi menampilkan **peringatan** (tetap boleh
   disimpan), dan di daftar diberi penanda **"Tumpang tindih"**.
2. **Input tidak konsisten.** Satu bilah input di atas jendela memungkinkan
   mengisi **judul + tanggal mulai + deadline sekaligus** lalu tekan *Tambah*.
   Pemilih tanggal default = hari ini.
3. **Visual berantakan.** Menggunakan kontrol native Windows (ListView,
   DateTimePicker) — **tanpa emoji, tanpa warna mencolok**. Penanda status
   (`Aktif`/`Selesai`) dan keterangan (`Tumpang tindih`/`Terlewat`) berupa teks.

## Fitur

- Tambah tugas (judul, tanggal mulai, deadline) sekaligus.
- Tandai **Selesai** / belum (tombol atau klik-ganda pada baris).
- **Edit** penuh (judul & tanggal) lewat dialog.
- **Hapus** tugas.
- Penanda otomatis: **Tumpang tindih** (bentrok jadwal) & **Terlewat** (deadline lewat).
- Data tersimpan di `%APPDATA%\SimpleTodo\todo.db`.

## Struktur

```
todo-win/
  src/
    main.c        GUI Win32 (jendela, kontrol, event, dialog edit)
    todo.h        struct data bersama
    db.h / db.c   lapisan SQLite (open/migrate/CRUD)
    overlap.h/.c  logika deteksi tumpang tindih & terlewat (fungsi murni)
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

Logika inti (SQLite CRUD + deteksi tumpang tindih) diuji secara native tanpa
Windows:

```sh
make test         # kompilasi dengan gcc lalu jalankan; harus "SEMUA LULUS"
```

### Uji manual di Windows (GUI)

Jalankan `todo.exe`, lalu:

1. Tambah dua tugas dengan rentang tanggal yang bersinggungan → muncul
   peringatan saat menambah, dan kolom **Keterangan** menampilkan
   "Tumpang tindih" pada keduanya.
2. Pilih salah satu → **Tandai Selesai** → penanda tumpang tindih hilang
   (hanya tugas aktif yang dihitung).
3. Buat tugas dengan deadline kemarin → kolom Keterangan menampilkan "Terlewat".
4. **Edit** mengubah judul/tanggal; **Hapus** menghapus tugas.

## Catatan

- `make win` memakai `-Os -s -static` agar `.exe` kecil dan mandiri.
- SQLite dikompilasi dengan `SQLITE_THREADSAFE=0` (single-thread, cukup untuk
  satu jendela GUI) dan tanpa load-extension.
