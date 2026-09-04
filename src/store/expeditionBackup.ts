export const TOWN_PROFILE_KEY = "town-profile-v19";

const BACKUP_KEY = "town-profile-expedition-backup-v1";

type TownProfileBackup = {
  raw: string | null;
};

export function restoreTownBackup(): void {
  try {
    const encoded = localStorage.getItem(BACKUP_KEY);
    if (encoded === null) return;

    let backup: TownProfileBackup;
    try {
      const parsed: unknown = JSON.parse(encoded);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("raw" in parsed) ||
        (parsed.raw !== null && typeof parsed.raw !== "string")
      ) {
        localStorage.removeItem(BACKUP_KEY);
        return;
      }
      backup = parsed as TownProfileBackup;
    } catch {
      localStorage.removeItem(BACKUP_KEY);
      return;
    }

    if (backup.raw === null) {
      localStorage.removeItem(TOWN_PROFILE_KEY);
    } else {
      localStorage.setItem(TOWN_PROFILE_KEY, backup.raw);
    }
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // localStorage 不可用时静默降级为没有备份。
  }
}

export function snapshotTownProfile(): void {
  try {
    const raw = localStorage.getItem(TOWN_PROFILE_KEY);
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ raw } satisfies TownProfileBackup));
  } catch {
    // localStorage 不可用时静默降级为没有备份。
  }
}

export function commitTownBackup(): void {
  try {
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // localStorage 不可用时静默降级为没有备份。
  }
}
