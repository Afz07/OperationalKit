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

/* Bangun satu Todo di memori untuk uji fungsi murni. */
static Todo mk_todo(long long id, const char *start, const char *due, int done)
{
    Todo t;
    memset(&t, 0, sizeof t);
    t.id = id;
    t.done = done;
    snprintf(t.title, TITLE_MAX, "T%lld", id);
    strcpy(t.start_date, start);
    strcpy(t.due_date, due);
    return t;
}

static void test_followup(void)
{
    const char *today = "2026-07-07";
    /* 1 terlewat, 2 hari ini, 3 segera(+2), 4&5 deadline berdesakan (jarak 2 hari,
     * jauh dari hari ini), 6&7 rentang beririsan TAPI deadline berjauhan (>3 hari). */
    Todo list[7];
    int n = 7;
    list[0] = mk_todo(1, "2026-07-01", "2026-07-06", 0); /* overdue  */
    list[1] = mk_todo(2, "2026-07-01", "2026-07-07", 0); /* today    */
    list[2] = mk_todo(3, "2026-07-01", "2026-07-09", 0); /* soon +2  */
    list[3] = mk_todo(4, "2026-07-20", "2026-08-01", 0); /* clash    */
    list[4] = mk_todo(5, "2026-07-20", "2026-08-03", 0); /* clash    */
    list[5] = mk_todo(6, "2026-09-01", "2026-09-30", 0); /* none     */
    list[6] = mk_todo(7, "2026-09-15", "2026-11-30", 0); /* none (rentang beririsan #6) */

    printf("== date_serial ==\n");
    check(date_serial("2026-07-10") - date_serial("2026-07-07") == 3,
          "selisih hari 10-07 vs 07-07 = 3");
    check(date_serial("2026-08-01") - date_serial("2026-07-31") == 1,
          "lintas bulan 08-01 vs 07-31 = 1");

    printf("== todo_followup (ambang %d hari) ==\n", FOLLOWUP_DAYS);
    check(todo_followup(&list[0], list, n, today, FOLLOWUP_DAYS) == FU_OVERDUE,
          "deadline kemarin -> Terlewat");
    check(todo_followup(&list[1], list, n, today, FOLLOWUP_DAYS) == FU_TODAY,
          "deadline hari ini -> Hari ini");
    check(todo_followup(&list[2], list, n, today, FOLLOWUP_DAYS) == FU_SOON,
          "deadline +2 hari -> Segera");
    check(todo_followup(&list[3], list, n, today, FOLLOWUP_DAYS) == FU_CLASH,
          "deadline berdesakan (jarak 2 hari) -> Bentrok deadline");
    check(todo_followup(&list[5], list, n, today, FOLLOWUP_DAYS) == FU_NONE &&
          todo_followup(&list[6], list, n, today, FOLLOWUP_DAYS) == FU_NONE,
          "rentang beririsan tapi deadline jauh -> TIDAK ditandai (noise hilang)");

    /* tugas selesai tidak pernah perlu follow-up */
    list[0].done = 1;
    check(todo_followup(&list[0], list, n, today, FOLLOWUP_DAYS) == FU_NONE,
          "tugas selesai -> tidak perlu follow-up");
    list[0].done = 0;

    printf("== label & overdue ==\n");
    check(strcmp(followup_label(FU_OVERDUE), "Terlewat") == 0 &&
          strcmp(followup_label(FU_CLASH), "Bentrok deadline") == 0 &&
          followup_label(FU_NONE)[0] == '\0',
          "label follow-up sesuai");
    check(todo_is_overdue(&list[0], today) == 1 &&
          todo_is_overdue(&list[1], today) == 0,
          "todo_is_overdue benar");
}

static void test_db(void)
{
    const char *dbpath = "test_todo.db";
    Todo *list = NULL, t;
    long long a, b, c;
    int n;

    unlink(dbpath);

    printf("== db CRUD ==\n");
    check(db_open(dbpath) == 0, "buka + migrasi database");

    a = db_add("Tugas A", "", "2026-07-01", "2026-07-10");
    b = db_add("Tugas B", "", "2026-07-05", "2026-07-15");
    c = db_add("Tugas C", "", "2026-08-01", "2026-08-03");
    check(a > 0 && b > 0 && c > 0, "tiga todo tersimpan dengan id valid");

    n = db_list(&list);
    check(n == 3, "list mengembalikan 3 baris");
    check(n == 3 && strcmp(list[0].title, "Tugas A") == 0
                 && strcmp(list[2].title, "Tugas C") == 0,
          "urutan berdasarkan deadline menaik");
    free(list); list = NULL;

    check(db_set_done(b, 1) == 0, "tandai Tugas B selesai");
    check(db_update(a, "Tugas A2", "catatan", "2026-09-01", "2026-09-02") == 0,
          "update Tugas A");
    check(db_get(a, &t) == 0 && strcmp(t.title, "Tugas A2") == 0
          && strcmp(t.due_date, "2026-09-02") == 0,
          "get mengembalikan data terbaru");
    check(db_delete(c) == 0, "hapus Tugas C");

    n = db_list(&list);
    check(n == 2, "tersisa 2 todo setelah hapus");
    free(list); list = NULL;

    db_close();
    unlink(dbpath);
}

int main(void)
{
    test_followup();
    test_db();
    printf("\n%s\n", g_fail ? "HASIL: ADA YANG GAGAL" : "HASIL: SEMUA LULUS");
    return g_fail;
}
