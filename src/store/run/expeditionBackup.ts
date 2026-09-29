export const TOWN_PROFILE_KEY = "town-profile-v28";

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

// 出击快照的起点是「进入出击准备」: 出击货柜扣积分、从仓库取遗物/物资都会立即写进持久档案,
// 而准备会话与探索会话都不持久化 —— 从这一刻起刷新页面, 必须整档回到进准备页之前。
export function snapshotTownProfile(): void {
  try {
    const raw = localStorage.getItem(TOWN_PROFILE_KEY);
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ raw } satisfies TownProfileBackup));
  } catch {
    // localStorage 不可用时静默降级为没有备份。
  }
}

// 兜底入口(如测试直接调 startExpedition): 已有出击准备时拍下的快照就保留它, 绝不用出发时的档案覆盖。
export function ensureTownSnapshot(): void {
  try {
    if (localStorage.getItem(BACKUP_KEY) !== null) return;
  } catch {
    return;
  }
  snapshotTownProfile();
}

export function commitTownBackup(): void {
  try {
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // localStorage 不可用时静默降级为没有备份。
  }
}
