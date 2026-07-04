/* overlap.h — deteksi tugas yang perlu di-follow-up berdasarkan deadline.
 *
 * Ganti model lama (menandai setiap rentang tanggal yang beririsan) yang jadi
 * noise saat banyak tugas berjalan paralel. Kini penanda berbasis DEADLINE:
 * mendesak karena deadline sendiri, atau deadline berdesakan dengan tugas lain.
 *
 * Fungsi murni (tanpa I/O) sehingga mudah diuji secara native. */
#ifndef OVERLAP_H
#define OVERLAP_H

#include "todo.h"

#define FOLLOWUP_DAYS 3 /* ambang default "Segera" & "berdesakan" (hari) */

/* Status follow-up; nilai lebih besar = lebih mendesak (dipakai untuk urut). */
typedef enum {
    FU_NONE    = 0, /* aktif, belum perlu perhatian */
    FU_CLASH   = 1, /* deadline berdesakan dengan tugas aktif lain */
    FU_SOON    = 2, /* jatuh tempo dalam <= threshold hari */
    FU_TODAY   = 3, /* jatuh tempo hari ini */
    FU_OVERDUE = 4  /* sudah terlewat */
} FollowupStatus;

/* Ubah "YYYY-MM-DD" menjadi nomor hari (serial) agar selisih hari bisa dihitung.
 * Mengembalikan 0 bila format tidak dikenali. */
long date_serial(const char *iso);

/* Tentukan status follow-up tugas t relatif terhadap `today` (ISO) dan daftar
 * tugas lain. Tugas selesai -> FU_NONE. `threshold` = ambang hari (mis.
 * FOLLOWUP_DAYS). Aturan (Gabungan): mendesak karena deadline sendiri
 * (Terlewat/Hari ini/Segera) ATAU deadline berdesakan (<= threshold hari)
 * dengan tugas aktif lain. */
FollowupStatus todo_followup(const Todo *t, const Todo *list, int n,
                             const char *today, int threshold);

/* Label singkat untuk kolom Follow-up. */
const char *followup_label(FollowupStatus s);

/* Tetap disediakan: tugas terlewat (aktif & deadline < today). */
int todo_is_overdue(const Todo *t, const char *today);

#endif /* OVERLAP_H */
