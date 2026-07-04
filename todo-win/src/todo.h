/* todo.h — tipe data bersama untuk aplikasi todo.
 * Sengaja bebas dari header platform (windows.h) agar db.c & overlap.c
 * bisa dikompilasi & diuji secara native di Linux maupun Windows. */
#ifndef TODO_H
#define TODO_H

#define TITLE_MAX 256
#define NOTE_MAX  1024
#define DATE_LEN  11 /* "YYYY-MM-DD" + NUL */
#define TS_LEN    32 /* untuk timestamp SQLite "YYYY-MM-DD HH:MM:SS" */

typedef struct {
    long long id;
    char      title[TITLE_MAX];
    char      note[NOTE_MAX];
    char      start_date[DATE_LEN]; /* tanggal mulai, ISO YYYY-MM-DD */
    char      due_date[DATE_LEN];   /* deadline,      ISO YYYY-MM-DD */
    int       done;                 /* 0 = aktif, 1 = selesai */
    char      completed_at[TS_LEN];
    char      created_at[TS_LEN];
} Todo;

#endif /* TODO_H */
