/* main.c — GUI native Windows (Win32 API murni) untuk aplikasi Todo.
 *
 * Fitur:
 *  - Bilah input "sekaligus" di atas: judul + tanggal mulai + deadline + Tambah.
 *  - Daftar ListView: Judul | Mulai | Deadline | Status | Follow-up.
 *  - Deteksi follow-up berbasis deadline: daftar terurut prioritas dan penanda
 *    "Terlewat" / "Hari ini" / "Segera" / "Bentrok deadline" pada kolom Follow-up;
 *    peringatan saat input hanya untuk bentrok deadline (non-blokir).
 *  - Tandai Selesai, Edit (dialog), Hapus.
 *
 * Menyengaja memakai API ANSI (char/UTF-8) agar selaras dengan SQLite. */
#include <windows.h>
#include <commctrl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "todo.h"
#include "db.h"
#include "overlap.h"
#include "../resources/resource.h"

static HINSTANCE g_hInst;
static HFONT     g_font;
static char      g_dbpath[MAX_PATH];

static HWND g_hTitle, g_hStart, g_hDue, g_hAdd;
static HWND g_hList, g_hDone, g_hEdit, g_hDelete;

/* ─── util tanggal ──────────────────────────────────────────────────────── */

static void iso_from_st(const SYSTEMTIME *st, char *buf)
{
    snprintf(buf, DATE_LEN, "%04d-%02d-%02d", st->wYear, st->wMonth, st->wDay);
}

static void st_from_iso(const char *iso, SYSTEMTIME *st)
{
    int y = 2026, m = 1, d = 1;
    memset(st, 0, sizeof *st);
    sscanf(iso, "%d-%d-%d", &y, &m, &d);
    st->wYear = (WORD)y; st->wMonth = (WORD)m; st->wDay = (WORD)d;
}

static void set_dtp_iso(HWND h, const char *iso)
{
    SYSTEMTIME st;
    st_from_iso(iso, &st);
    DateTime_SetSystemtime(h, GDT_VALID, &st);
}

static void get_dtp_iso(HWND h, char *buf)
{
    SYSTEMTIME st;
    DateTime_GetSystemtime(h, &st);
    iso_from_st(&st, buf);
}

static void today_iso(char *buf)
{
    SYSTEMTIME st;
    GetLocalTime(&st);
    iso_from_st(&st, buf);
}

/* ─── kontrol & tata letak ──────────────────────────────────────────────── */

static HWND mk(const char *cls, const char *txt, DWORD style,
               int x, int y, int w, int h, HWND parent, int id)
{
    HWND c = CreateWindowExA(0, cls, txt, WS_CHILD | WS_VISIBLE | style,
                             x, y, w, h, parent, (HMENU)(INT_PTR)id,
                             g_hInst, NULL);
    SendMessageA(c, WM_SETFONT, (WPARAM)g_font, TRUE);
    return c;
}

static void setup_columns(void)
{
    static const struct { const char *t; int w; } cols[] = {
        { "Judul", 220 }, { "Mulai", 90 }, { "Deadline", 90 },
        { "Status", 70 }, { "Follow-up", 140 }
    };
    int i;
    LVCOLUMNA col;
    memset(&col, 0, sizeof col);
    col.mask = LVCF_TEXT | LVCF_WIDTH | LVCF_SUBITEM;
    for (i = 0; i < (int)(sizeof cols / sizeof cols[0]); i++) {
        col.iSubItem = i;
        col.cx = cols[i].w;
        col.pszText = (char *)cols[i].t;
        SendMessageA(g_hList, LVM_INSERTCOLUMNA, i, (LPARAM)&col);
    }
}

static void create_controls(HWND hwnd)
{
    char today[DATE_LEN];
    today_iso(today);

    mk("STATIC", "Judul:",   SS_LEFT,          10, 14,  34, 16, hwnd, -1);
    g_hTitle = mk("EDIT", "", WS_BORDER | ES_AUTOHSCROLL,
                                                48, 11, 210, 22, hwnd, IDC_TITLE);
    mk("STATIC", "Mulai:",   SS_LEFT,         268, 14,  34, 16, hwnd, -1);
    g_hStart = mk(DATETIMEPICK_CLASS, "", DTS_SHORTDATEFORMAT,
                                               306, 11,  96, 22, hwnd, IDC_START);
    mk("STATIC", "Deadline:", SS_LEFT,        412, 14,  50, 16, hwnd, -1);
    g_hDue = mk(DATETIMEPICK_CLASS, "", DTS_SHORTDATEFORMAT,
                                               466, 11,  96, 22, hwnd, IDC_DUE);
    g_hAdd = mk("BUTTON", "Tambah", BS_DEFPUSHBUTTON,
                                               570, 10,  90, 24, hwnd, IDC_ADD);

    g_hList = mk(WC_LISTVIEWA, "", LVS_REPORT | LVS_SINGLESEL | WS_BORDER,
                                                10, 44, 650, 380, hwnd, IDC_LIST);
    SendMessageA(g_hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0,
                 LVS_EX_FULLROWSELECT | LVS_EX_GRIDLINES);
    setup_columns();

    g_hDone   = mk("BUTTON", "Tandai Selesai", 0, 10, 430, 120, 26, hwnd, IDC_DONE);
    g_hEdit   = mk("BUTTON", "Edit",           0, 138, 430, 80, 26, hwnd, IDC_EDIT);
    g_hDelete = mk("BUTTON", "Hapus",          0, 224, 430, 80, 26, hwnd, IDC_DELETE);

    set_dtp_iso(g_hStart, today);
    set_dtp_iso(g_hDue, today);
}

static void layout(HWND hwnd)
{
    RECT rc;
    int cw, ch, by;
    GetClientRect(hwnd, &rc);
    cw = rc.right - rc.left;
    ch = rc.bottom - rc.top;
    by = ch - 34;                         /* baris tombol bawah */
    MoveWindow(g_hList, 10, 44, cw - 20, by - 52, TRUE);
    MoveWindow(g_hDone,   10, by, 120, 26, TRUE);
    MoveWindow(g_hEdit,  138, by,  80, 26, TRUE);
    MoveWindow(g_hDelete,224, by,  80, 26, TRUE);
}

/* ─── daftar ────────────────────────────────────────────────────────────── */

static void add_row(int row, const Todo *t, const char *status, const char *ket)
{
    LVITEMA lvi;
    int idx;
    memset(&lvi, 0, sizeof lvi);
    lvi.mask = LVIF_TEXT | LVIF_PARAM;
    lvi.iItem = row;
    lvi.iSubItem = 0;
    lvi.pszText = (char *)t->title;
    lvi.lParam = (LPARAM)t->id;
    idx = (int)SendMessageA(g_hList, LVM_INSERTITEMA, 0, (LPARAM)&lvi);
    ListView_SetItemText(g_hList, idx, 1, (char *)t->start_date);
    ListView_SetItemText(g_hList, idx, 2, (char *)t->due_date);
    ListView_SetItemText(g_hList, idx, 3, (char *)status);
    ListView_SetItemText(g_hList, idx, 4, (char *)ket);
}

/* Satu baris siap-tampil beserta status follow-up-nya (untuk pengurutan). */
typedef struct { Todo t; FollowupStatus fu; } Row;

/* Urutkan: tugas aktif di atas (selesai di bawah); di antara aktif, yang lebih
 * mendesak di atas (FU_OVERDUE dulu); tie-break deadline menaik. */
static int cmp_row(const void *pa, const void *pb)
{
    const Row *a = (const Row *)pa, *b = (const Row *)pb;
    if (a->t.done != b->t.done) return a->t.done - b->t.done;
    if (!a->t.done && a->fu != b->fu) return (int)b->fu - (int)a->fu;
    return strcmp(a->t.due_date, b->t.due_date);
}

static void refresh_list(void)
{
    Todo *list = NULL;
    Row *rows;
    int n, i;
    char today[DATE_LEN];

    today_iso(today);
    SendMessageA(g_hList, LVM_DELETEALLITEMS, 0, 0);
    n = db_list(&list);
    if (n < 0) return;

    if (n > 0) {
        rows = (Row *)malloc((size_t)n * sizeof(Row));
        if (rows) {
            for (i = 0; i < n; i++) {
                rows[i].t = list[i];
                rows[i].fu = todo_followup(&list[i], list, n, today, FOLLOWUP_DAYS);
            }
            qsort(rows, (size_t)n, sizeof(Row), cmp_row);
            for (i = 0; i < n; i++) {
                const char *status = rows[i].t.done ? "Selesai" : "Aktif";
                add_row(i, &rows[i].t, status, followup_label(rows[i].fu));
            }
            free(rows);
        }
    }
    free(list);
}

static long long get_selected_id(void)
{
    int sel = (int)SendMessageA(g_hList, LVM_GETNEXTITEM, (WPARAM)-1, LVNI_SELECTED);
    LVITEMA lvi;
    if (sel < 0) return -1;
    memset(&lvi, 0, sizeof lvi);
    lvi.mask = LVIF_PARAM;
    lvi.iItem = sel;
    if (!SendMessageA(g_hList, LVM_GETITEMA, 0, (LPARAM)&lvi)) return -1;
    return (long long)lvi.lParam;
}

/* ─── dialog edit ───────────────────────────────────────────────────────── */

static INT_PTR CALLBACK EditDlgProc(HWND dlg, UINT msg, WPARAM wp, LPARAM lp)
{
    switch (msg) {
    case WM_INITDIALOG: {
        Todo *t = (Todo *)lp;
        SetWindowLongPtr(dlg, GWLP_USERDATA, (LONG_PTR)t);
        SetDlgItemTextA(dlg, IDC_E_TITLE, t->title);
        set_dtp_iso(GetDlgItem(dlg, IDC_E_START), t->start_date);
        set_dtp_iso(GetDlgItem(dlg, IDC_E_DUE), t->due_date);
        return TRUE;
    }
    case WM_COMMAND:
        if (LOWORD(wp) == IDOK) {
            Todo *t = (Todo *)GetWindowLongPtr(dlg, GWLP_USERDATA);
            GetDlgItemTextA(dlg, IDC_E_TITLE, t->title, TITLE_MAX);
            get_dtp_iso(GetDlgItem(dlg, IDC_E_START), t->start_date);
            get_dtp_iso(GetDlgItem(dlg, IDC_E_DUE), t->due_date);
            if (t->title[0] == '\0') {
                MessageBoxA(dlg, "Judul tidak boleh kosong.", "Edit",
                            MB_ICONWARNING);
                return TRUE;
            }
            if (strcmp(t->start_date, t->due_date) > 0) {
                MessageBoxA(dlg, "Tanggal mulai tidak boleh setelah deadline.",
                            "Edit", MB_ICONWARNING);
                return TRUE;
            }
            EndDialog(dlg, 1);
            return TRUE;
        }
        if (LOWORD(wp) == IDCANCEL) {
            EndDialog(dlg, 0);
            return TRUE;
        }
        break;
    }
    return FALSE;
}

/* ─── aksi tombol ───────────────────────────────────────────────────────── */

static void on_add(HWND hwnd)
{
    char title[TITLE_MAX], start[DATE_LEN], due[DATE_LEN], today[DATE_LEN];
    Todo tmp, *list = NULL;
    FollowupStatus fu;
    int n;

    GetWindowTextA(g_hTitle, title, TITLE_MAX);
    if (title[0] == '\0') {
        MessageBoxA(hwnd, "Judul tidak boleh kosong.", "Tambah", MB_ICONWARNING);
        return;
    }
    get_dtp_iso(g_hStart, start);
    get_dtp_iso(g_hDue, due);
    if (strcmp(start, due) > 0) {
        MessageBoxA(hwnd, "Tanggal mulai tidak boleh setelah deadline.",
                    "Tambah", MB_ICONWARNING);
        return;
    }

    /* Peringatkan HANYA bila deadline tugas baru berdesakan dengan tugas aktif
     * lain (bentrok deadline). Overlap rentang biasa tidak lagi memicu popup. */
    today_iso(today);
    memset(&tmp, 0, sizeof tmp);
    tmp.id = -1;
    tmp.done = 0;
    strcpy(tmp.start_date, start);
    strcpy(tmp.due_date, due);
    n = db_list(&list);
    fu = (n > 0) ? todo_followup(&tmp, list, n, today, FOLLOWUP_DAYS) : FU_NONE;
    free(list);

    if (fu == FU_CLASH) {
        int r = MessageBoxA(hwnd,
            "Deadline tugas ini berdekatan dengan tugas aktif lain "
            "(≤ 3 hari).\nTetap tambahkan?",
            "Bentrok deadline", MB_YESNO | MB_ICONWARNING);
        if (r == IDNO) return;
    }

    db_add(title, "", start, due);
    SetWindowTextA(g_hTitle, "");
    refresh_list();
}

static void on_done(HWND hwnd)
{
    long long id = get_selected_id();
    Todo t;
    if (id < 0) {
        MessageBoxA(hwnd, "Pilih tugas terlebih dahulu.", "Tandai Selesai",
                    MB_ICONINFORMATION);
        return;
    }
    if (db_get(id, &t) != 0) return;
    db_set_done(id, !t.done);
    refresh_list();
}

static void on_edit(HWND hwnd)
{
    long long id = get_selected_id();
    Todo t;
    if (id < 0) {
        MessageBoxA(hwnd, "Pilih tugas terlebih dahulu.", "Edit",
                    MB_ICONINFORMATION);
        return;
    }
    if (db_get(id, &t) != 0) return;
    if (DialogBoxParamA(g_hInst, MAKEINTRESOURCEA(IDD_EDIT), hwnd,
                        EditDlgProc, (LPARAM)&t) == 1) {
        db_update(id, t.title, t.note, t.start_date, t.due_date);
        refresh_list();
    }
}

static void on_delete(HWND hwnd)
{
    long long id = get_selected_id();
    if (id < 0) {
        MessageBoxA(hwnd, "Pilih tugas terlebih dahulu.", "Hapus",
                    MB_ICONINFORMATION);
        return;
    }
    if (MessageBoxA(hwnd, "Hapus tugas ini?", "Hapus",
                    MB_YESNO | MB_ICONQUESTION) == IDYES) {
        db_delete(id);
        refresh_list();
    }
}

/* ─── window utama ──────────────────────────────────────────────────────── */

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp)
{
    switch (msg) {
    case WM_CREATE:
        create_controls(hwnd);
        refresh_list();
        return 0;
    case WM_SIZE:
        layout(hwnd);
        return 0;
    case WM_COMMAND:
        switch (LOWORD(wp)) {
        case IDC_ADD:    on_add(hwnd);    return 0;
        case IDC_DONE:   on_done(hwnd);   return 0;
        case IDC_EDIT:   on_edit(hwnd);   return 0;
        case IDC_DELETE: on_delete(hwnd); return 0;
        }
        return 0;
    case WM_NOTIFY: {
        LPNMHDR nh = (LPNMHDR)lp;
        if (nh->idFrom == IDC_LIST && nh->code == NM_DBLCLK) {
            on_done(hwnd);       /* klik ganda = tandai selesai/belum */
            return 0;
        }
        break;
    }
    case WM_DESTROY:
        db_close();
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcA(hwnd, msg, wp, lp);
}

static void build_db_path(char *out, size_t cap)
{
    const char *appdata = getenv("APPDATA");
    if (appdata && *appdata) {
        char dir[MAX_PATH];
        snprintf(dir, sizeof dir, "%s\\SimpleTodo", appdata);
        CreateDirectoryA(dir, NULL);
        snprintf(out, cap, "%s\\todo.db", dir);
    } else {
        snprintf(out, cap, "todo.db");
    }
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE prev, LPSTR cmd, int show)
{
    INITCOMMONCONTROLSEX icc;
    WNDCLASSA wc;
    HWND hwnd;
    MSG msg;
    (void)prev; (void)cmd;

    g_hInst = hInst;
    g_font = (HFONT)GetStockObject(DEFAULT_GUI_FONT);

    build_db_path(g_dbpath, sizeof g_dbpath);
    if (db_open(g_dbpath) != 0) {
        MessageBoxA(NULL, "Gagal membuka database.", "Error", MB_ICONERROR);
        return 1;
    }

    icc.dwSize = sizeof icc;
    icc.dwICC = ICC_DATE_CLASSES | ICC_LISTVIEW_CLASSES | ICC_STANDARD_CLASSES;
    InitCommonControlsEx(&icc);

    memset(&wc, 0, sizeof wc);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.lpszClassName = "SimpleTodoWnd";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_BTNFACE + 1);
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    RegisterClassA(&wc);

    hwnd = CreateWindowA("SimpleTodoWnd", "Todo Sederhana",
                         WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT,
                         720, 500, NULL, NULL, hInst, NULL);
    ShowWindow(hwnd, show);
    UpdateWindow(hwnd);

    while (GetMessage(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    db_close();
    return (int)msg.wParam;
}
