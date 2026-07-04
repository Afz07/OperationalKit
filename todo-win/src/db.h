/* db.h — lapisan penyimpanan SQLite untuk todo.
 * Tidak bergantung pada platform; path DB diberikan oleh pemanggil. */
#ifndef DB_H
#define DB_H

#include "todo.h"

/* Buka (atau buat) database pada `path`. Otomatis menjalankan migrasi.
 * Mengembalikan 0 bila sukses, selain itu gagal. */
int  db_open(const char *path);
void db_close(void);

/* Ambil semua todo terurut deadline menaik. Mengalokasikan array ke *out
 * (pemanggil wajib free). Mengembalikan jumlah baris, atau -1 bila error. */
int  db_list(Todo **out);

/* Ambil satu todo berdasarkan id. 0 bila ditemukan, -1 bila tidak. */
int  db_get(long long id, Todo *out);

/* Tambah todo baru. Mengembalikan id baru (>0), atau -1 bila gagal. */
long long db_add(const char *title, const char *note,
                 const char *start_date, const char *due_date);

/* Perbarui judul/catatan/tanggal sebuah todo. 0 bila sukses. */
int  db_update(long long id, const char *title, const char *note,
               const char *start_date, const char *due_date);

/* Tandai selesai / belum. done!=0 mengisi completed_at, 0 mengosongkannya. */
int  db_set_done(long long id, int done);

/* Hapus todo. 0 bila sukses. */
int  db_delete(long long id);

#endif /* DB_H */
