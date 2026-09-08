import { createElement } from "react";
import { confirm } from "@/ui/common/ConfirmDialog";
import { FormationTodoList } from "./FormationTodoList";

export interface GuardSortieOptions {
  onSortie: () => void;
  onFormation: () => void;
}

export function guardSortie(items: string[], { onSortie, onFormation }: GuardSortieOptions): void {
  if (items.length === 0) {
    onSortie();
    return;
  }

  confirm({
    title: "出击前还有未处理的编排",
    text: createElement(FormationTodoList, { items }),
    detail: "这些只能在据点里调整，远征途中无法更改。",
    cancelLabel: "执意出击",
    confirmLabel: "去编队",
    dismissible: false,
    onCancel: onSortie,
    onConfirm: onFormation,
  });
}
