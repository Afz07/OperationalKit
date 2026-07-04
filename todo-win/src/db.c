#include "db.h"
#include "../third_party/sqlite3.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static sqlite3 *g_db = NULL;

/* strncpy yang selalu NUL-terminate. src boleh NULL. */
static void copy_str(char *dst, const char *src, size_t cap)
{
    if (cap == 0) return;
    if (!src) { dst[0] = '\0'; return; }
    strncpy(dst, src, cap - 1);
    dst[cap - 1] = '\0';
}

static int db_migrate(void)
{
    const char *sql =
        "CREATE TABLE IF NOT EXISTS todo ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  title TEXT NOT NULL,"
        "  note TEXT,"
        "  start_date TEXT NOT NULL,"
        "  due_date TEXT NOT NULL,"
        "  done INTEGER NOT NULL DEFAULT 0,"
        "  completed_at TEXT,"
        "  created_at TEXT NOT NULL DEFAULT (datetime('now'))"
        ");";
    char *err = NULL;
    if (sqlite3_exec(g_db, sql, NULL, NULL, &err) != SQLITE_OK) {
        sqlite3_free(err);
        return -1;
    }
    return 0;
}

int db_open(const char *path)
{
    if (sqlite3_open(path, &g_db) != SQLITE_OK) {
        db_close();
        return -1;
    }
    return db_migrate();
}

void db_close(void)
{
    if (g_db) {
        sqlite3_close(g_db);
        g_db = NULL;
    }
}

static void read_row(sqlite3_stmt *st, Todo *t)
{
    t->id = sqlite3_column_int64(st, 0);
    copy_str(t->title,        (const char *)sqlite3_column_text(st, 1), TITLE_MAX);
    copy_str(t->note,         (const char *)sqlite3_column_text(st, 2), NOTE_MAX);
    copy_str(t->start_date,   (const char *)sqlite3_column_text(st, 3), DATE_LEN);
    copy_str(t->due_date,     (const char *)sqlite3_column_text(st, 4), DATE_LEN);
    t->done = sqlite3_column_int(st, 5);
    copy_str(t->completed_at, (const char *)sqlite3_column_text(st, 6), TS_LEN);
    copy_str(t->created_at,   (const char *)sqlite3_column_text(st, 7), TS_LEN);
}

static const char *SELECT_COLS =
    "SELECT id,title,IFNULL(note,''),start_date,due_date,done,"
    "IFNULL(completed_at,''),IFNULL(created_at,'') FROM todo ";

int db_list(Todo **out)
{
    sqlite3_stmt *st;
    const char *sql = "SELECT id,title,IFNULL(note,''),start_date,due_date,done,"
                      "IFNULL(completed_at,''),IFNULL(created_at,'') FROM todo "
                      "ORDER BY due_date ASC, id ASC;";
    int cap = 8, n = 0;
    Todo *arr;

    *out = NULL;
    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK)
        return -1;

    arr = (Todo *)malloc((size_t)cap * sizeof(Todo));
    if (!arr) { sqlite3_finalize(st); return -1; }

    while (sqlite3_step(st) == SQLITE_ROW) {
        if (n == cap) {
            Todo *tmp;
            cap *= 2;
            tmp = (Todo *)realloc(arr, (size_t)cap * sizeof(Todo));
            if (!tmp) { free(arr); sqlite3_finalize(st); return -1; }
            arr = tmp;
        }
        read_row(st, &arr[n++]);
    }
    sqlite3_finalize(st);
    *out = arr;
    return n;
}

int db_get(long long id, Todo *out)
{
    sqlite3_stmt *st;
    char sql[256];
    int rc = -1;

    snprintf(sql, sizeof sql, "%sWHERE id=?;", SELECT_COLS);
    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK)
        return -1;
    sqlite3_bind_int64(st, 1, id);
    if (sqlite3_step(st) == SQLITE_ROW) {
        read_row(st, out);
        rc = 0;
    }
    sqlite3_finalize(st);
    return rc;
}

long long db_add(const char *title, const char *note,
                 const char *start_date, const char *due_date)
{
    sqlite3_stmt *st;
    const char *sql = "INSERT INTO todo(title,note,start_date,due_date) "
                      "VALUES(?,?,?,?);";
    long long id = -1;

    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK)
        return -1;
    sqlite3_bind_text(st, 1, title,      -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 2, note,       -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 3, start_date, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 4, due_date,   -1, SQLITE_TRANSIENT);
    if (sqlite3_step(st) == SQLITE_DONE)
        id = sqlite3_last_insert_rowid(g_db);
    sqlite3_finalize(st);
    return id;
}

int db_update(long long id, const char *title, const char *note,
              const char *start_date, const char *due_date)
{
    sqlite3_stmt *st;
    const char *sql = "UPDATE todo SET title=?,note=?,start_date=?,due_date=? "
                      "WHERE id=?;";
    int rc = -1;

    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK)
        return -1;
    sqlite3_bind_text(st, 1, title,      -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 2, note,       -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 3, start_date, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(st, 4, due_date,   -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(st, 5, id);
    if (sqlite3_step(st) == SQLITE_DONE) rc = 0;
    sqlite3_finalize(st);
    return rc;
}

int db_set_done(long long id, int done)
{
    sqlite3_stmt *st;
    const char *sql = done
        ? "UPDATE todo SET done=1, completed_at=datetime('now') WHERE id=?;"
        : "UPDATE todo SET done=0, completed_at=NULL WHERE id=?;";
    int rc = -1;

    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK)
        return -1;
    sqlite3_bind_int64(st, 1, id);
    if (sqlite3_step(st) == SQLITE_DONE) rc = 0;
    sqlite3_finalize(st);
    return rc;
}

int db_delete(long long id)
{
    sqlite3_stmt *st;
    const char *sql = "DELETE FROM todo WHERE id=?;";
    int rc = -1;

    if (sqlite3_prepare_v2(g_db, sql, -1, &st, NULL) != SQLITE_OK)
        return -1;
    sqlite3_bind_int64(st, 1, id);
    if (sqlite3_step(st) == SQLITE_DONE) rc = 0;
    sqlite3_finalize(st);
    return rc;
}
