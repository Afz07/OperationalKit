# Makefile — Aplikasi Todo native Windows (C + Win32 + SQLite embedded)
#
#   make test   -> kompilasi native (gcc) + jalankan uji logika (db + overlap)
#   make win    -> cross-compile .exe Windows via mingw-w64 (butuh gcc-mingw-w64-x86-64)
#   make clean  -> bersihkan artefak build

CC      ?= gcc
MINGW   ?= x86_64-w64-mingw32-gcc
WINDRES ?= x86_64-w64-mingw32-windres

CORE_SRC := src/db.c src/overlap.c third_party/sqlite3.c
WIN_SRC  := src/main.c $(CORE_SRC)
TEST_SRC := tests/test_logic.c $(CORE_SRC)

INC := -Isrc -Ithird_party

# SQLite dikompilasi ramping: single-thread (aman untuk 1 jendela GUI),
# tanpa load-extension & tanpa statistik memori.
SQLITE_FLAGS := -DSQLITE_THREADSAFE=0 -DSQLITE_OMIT_LOAD_EXTENSION \
                -DSQLITE_DEFAULT_MEMSTATUS=0

.PHONY: win test clean

# --- Windows GUI (.exe ringan, single-file) ---
win: todo.exe

todo.exe: $(WIN_SRC) resources/app.rc resources/resource.h
	$(WINDRES) resources/app.rc -O coff -o app.res.o
	$(MINGW) -Os -s $(INC) $(SQLITE_FLAGS) $(WIN_SRC) app.res.o -o $@ \
	    -mwindows -lcomctl32 -lgdi32 -luser32 -lole32 -static
	@echo "OK: todo.exe siap dijalankan di Windows"

# --- Uji logika inti secara native (dijalankan di Linux/CI) ---
test: test_logic
	./test_logic

test_logic: $(TEST_SRC) src/db.h src/overlap.h src/todo.h
	$(CC) -O2 -Wall $(INC) $(SQLITE_FLAGS) $(TEST_SRC) -o $@ -lpthread -lm -ldl

clean:
	rm -f todo.exe test_logic app.res.o test_todo.db
