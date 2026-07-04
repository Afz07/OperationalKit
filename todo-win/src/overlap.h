/* overlap.h — deteksi tumpang tindih jadwal & tugas terlewat.
 * Fungsi murni (tanpa I/O) sehingga mudah diuji secara native. */
#ifndef OVERLAP_H
#define OVERLAP_H

#include "todo.h"

/* Dua rentang [a1..a2] dan [b1..b2] (ISO YYYY-MM-DD) dianggap tumpang tindih
 * secara inklusif. Mengembalikan 1 jika beririsan, 0 jika tidak. */
int intervals_overlap(const char *a1, const char *a2,
                      const char *b1, const char *b2);

/* Apakah tugas t (yang belum tentu ada di list) bentrok dengan tugas AKTIF
 * lain di list. Tugas selesai (done!=0) diabaikan. exclude_id dilewati agar
 * sebuah tugas tidak dibandingkan dengan dirinya sendiri (pakai -1 bila t
 * belum tersimpan). t sendiri juga harus aktif agar dihitung bentrok. */
int todo_has_conflict(const Todo *t, const Todo *list, int n, long long exclude_id);

/* Tugas terlewat: masih aktif dan deadline-nya sebelum `today` (ISO). */
int todo_is_overdue(const Todo *t, const char *today);

#endif /* OVERLAP_H */
