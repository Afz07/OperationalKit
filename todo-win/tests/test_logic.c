/* test_logic.c — verifikasi native (gcc/Linux) untuk db.c + overlap.c.
 * Dijalankan lewat `make test`. Tidak menyentuh Win32 sama sekali. */
#include "../src/db.h"
#include "../src/overlap.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static int g_fail = 0;

static void check(int cond, const char *name)
{
    printf("  [%s] %s\n", cond ? "OK " : "GAGAL", name);
    if (!cond) g_fail = 1;
}

int main(void)
{
    const char *dbpath = "test_todo.db";
    Todo *list = NULL;
    Todo t;
    long long a, b, c;
    int n;

    unlink(dbpath); /* mulai dari kondisi bersih */

    printf("== overlap (fungsi murni) ==\n");
    check(intervals_overlap("2026-07-01", "2026-07-10",
                            "2026-07-05", "2026-07-15") == 1,
          "rentang beririsan terdeteksi");
    check(intervals_overlap("2026-07-01", "2026-07-05",
                            "2026-07-06", "2026-07-10") == 0,
          "rentang terpisah tidak beririsan");
    check(intervals_overlap("2026-07-01", "2026-07-05",
                            "2026-07-05", "2026-07-10") == 1,
          "batas bersentuhan dihitung beririsan (inklusif)");

    printf("== db CRUD ==\n");
    check(db_open(dbpath) == 0, "buka + migrasi database");

    a = db_add("Tugas A", "", "2026-07-01", "2026-07-10");
    b = db_add("Tugas B", "", "2026-07-05", "2026-07-15"); /* bentrok A */
    c = db_add("Tugas C", "", "2026-08-01", "2026-08-03"); /* tidak bentrok */
    check(a > 0 && b > 0 && c > 0, "tiga todo tersimpan dengan id valid");

    n = db_list(&list);
    check(n == 3, "list mengembalikan 3 baris");
    /* terurut due_date menaik: A(07-10), B(07-15), C(08-03) */
    check(n == 3 && strcmp(list[0].title, "Tugas A") == 0
                 && strcmp(list[2].title, "Tugas C") == 0,
          "urutan berdasarkan deadline menaik");

    printf("== deteksi konflik ==\n");
    check(todo_has_conflict(&list[0], list, n, list[0].id) == 1,
          "Tugas A bentrok dengan tugas aktif lain");
    check(todo_has_conflict(&list[2], list, n, list[2].id) == 0,
          "Tugas C tidak bentrok");

    printf("== overdue ==\n");
    check(todo_is_overdue(&list[0], "2026-07-11") == 1,
          "deadline lewat -> terlewat");
    check(todo_is_overdue(&list[0], "2026-07-01") == 0,
          "deadline belum lewat -> tidak terlewat");
    free(list); list = NULL;

    printf("== selesai menghapus konflik ==\n");
    check(db_set_done(b, 1) == 0, "tandai Tugas B selesai");
    n = db_list(&list);
    /* setelah B selesai, A tidak lagi bentrok dengan siapa pun */
    {
        int i, aidx = -1;
        for (i = 0; i < n; i++) if (list[i].id == a) aidx = i;
        check(aidx >= 0 && todo_has_conflict(&list[aidx], list, n, a) == 0,
              "konflik A hilang setelah B diselesaikan");
    }
    free(list); list = NULL;

    printf("== update + get ==\n");
    check(db_update(a, "Tugas A2", "catatan", "2026-09-01", "2026-09-02") == 0,
          "update Tugas A");
    check(db_get(a, &t) == 0 && strcmp(t.title, "Tugas A2") == 0
          && strcmp(t.due_date, "2026-09-02") == 0,
          "get mengembalikan data terbaru");

    printf("== delete ==\n");
    check(db_delete(c) == 0, "hapus Tugas C");
    n = db_list(&list);
    check(n == 2, "tersisa 2 todo setelah hapus");
    free(list); list = NULL;

    db_close();
    unlink(dbpath);

    printf("\n%s\n", g_fail ? "HASIL: ADA YANG GAGAL" : "HASIL: SEMUA LULUS");
    return g_fail;
}
