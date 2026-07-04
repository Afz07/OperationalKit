#include "overlap.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Konversi tanggal sipil (proleptik Gregorian) ke nomor hari sejak 1970-01-01.
 * Algoritma Howard Hinnant (days_from_civil). Cukup untuk menghitung selisih. */
static long civil_to_days(int y, int m, int d)
{
    long era, yoe, doy, doe;
    y -= (m <= 2);
    era = (long)((y >= 0 ? y : y - 399) / 400);
    yoe = (long)(y - era * 400);                       /* [0, 399] */
    doy = (153L * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1; /* [0, 365] */
    doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;        /* [0, 146096] */
    return era * 146097 + doe - 719468;
}

long date_serial(const char *iso)
{
    int y = 0, m = 0, d = 0;
    if (!iso || sscanf(iso, "%d-%d-%d", &y, &m, &d) != 3) return 0;
    return civil_to_days(y, m, d);
}

FollowupStatus todo_followup(const Todo *t, const Todo *list, int n,
                             const char *today, int threshold)
{
    long due, ref;
    int i;

    if (t->done) return FU_NONE;

    due = date_serial(t->due_date);
    ref = date_serial(today);

    /* Mendesak karena deadline sendiri. */
    if (due < ref)              return FU_OVERDUE;
    if (due == ref)             return FU_TODAY;
    if (due - ref <= threshold) return FU_SOON;

    /* Kalau tidak mendesak sendiri: cek deadline berdesakan dgn tugas aktif lain. */
    for (i = 0; i < n; i++) {
        const Todo *o = &list[i];
        long od;
        if (o->done) continue;
        if (o->id == t->id) continue;
        od = date_serial(o->due_date);
        if (labs(due - od) <= threshold) return FU_CLASH;
    }
    return FU_NONE;
}

const char *followup_label(FollowupStatus s)
{
    switch (s) {
    case FU_OVERDUE: return "Terlewat";
    case FU_TODAY:   return "Hari ini";
    case FU_SOON:    return "Segera";
    case FU_CLASH:   return "Bentrok deadline";
    default:         return "";
    }
}

int todo_is_overdue(const Todo *t, const char *today)
{
    if (t->done) return 0;
    return date_serial(t->due_date) < date_serial(today);
}
