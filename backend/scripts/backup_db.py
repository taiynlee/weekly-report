"""Daily overwrite backup of weekly.db, run by the WeeklyReport-DBBackup scheduled task."""
import shutil
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "weekly.db"
BACKUP_DIR = Path(__file__).resolve().parent.parent / "backups"
BACKUP_PATH = BACKUP_DIR / "weekly_backup.db"


def main() -> None:
    BACKUP_DIR.mkdir(exist_ok=True)
    tmp_path = BACKUP_PATH.with_suffix(".tmp")

    # sqlite3's backup API copies safely even while uvicorn holds the db open,
    # unlike a raw file copy which can grab a half-written page.
    src = sqlite3.connect(str(DB_PATH))
    dst = sqlite3.connect(str(tmp_path))
    with dst:
        src.backup(dst)
    src.close()
    dst.close()

    shutil.move(str(tmp_path), str(BACKUP_PATH))  # atomic swap, never leaves a half-written backup
    print(f"Backed up {DB_PATH} -> {BACKUP_PATH}")


if __name__ == "__main__":
    main()
