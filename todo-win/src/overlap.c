#include "overlap.h"
#include <string.h>

/* Karena tanggal disimpan sebagai ISO YYYY-MM-DD dengan panjang tetap,
 * perbandingan leksikografis (strcmp) setara dengan perbandingan kronologis. */
int intervals_overlap(const char *a1, const char *a2,
                      const char *b1, const char *b2)
{
    /* beririsan bila a1 <= b2 DAN b1 <= a2 (inklusif) */
    return strcmp(a1, b2) <= 0 && strcmp(b1, a2) <= 0;
}

int todo_has_conflict(const Todo *t, const Todo *list, int n, long long exclude_id)
{
    int i;
    if (t->done) return 0; /* tugas selesai tidak pernah dianggap bentrok */
    for (i = 0; i < n; i++) {
        const Todo *o = &list[i];
        if (o->done) continue;
        if (o->id == exclude_id) continue;
        if (o->id == t->id) continue;
        if (intervals_overlap(t->start_date, t->due_date,
                              o->start_date, o->due_date))
            return 1;
    }
    return 0;
}

int todo_is_overdue(const Todo *t, const char *today)
{
    if (t->done) return 0;
    return strcmp(t->due_date, today) < 0;
}
