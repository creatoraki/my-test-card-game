import { cardDisplayName } from "@/engine";
import { BLACKSMITH_SERVICES, type BlacksmithState } from "@/explore/curio/blacksmithTypes";
import { HandCard } from "@/ui/common/card/HandCard";
import s from "./Blacksmith.module.css";

export function BlacksmithResult({ forge, onClose }: { forge: BlacksmithState; onClose: () => void }) {
  const service = forge.selected ? BLACKSMITH_SERVICES[forge.selected] : null;
  const result = forge.result;
  return <div className={s.result}>
    <h3>{service?.name}已完成</h3>
    <p>本次服务已结束，另一项服务不再可用。</p>
    <div className={s.resultCards}>
      {result?.before && <div data-deck-card><p>{forge.selected === "remove" ? "已删除" : "原卡牌"}</p><HandCard card={result.before} variant="pile" playable selected={false} /></div>}
      {result?.after && <div data-deck-card><p>已获得「{cardDisplayName(result.after)}」</p><HandCard card={result.after} variant="pile" playable selected={false} /></div>}
    </div>
    <p>已消耗临期食品{service?.food}份。</p>
    <button type="button" className={s.primary} onClick={onClose}>返回事件</button>
  </div>;
}
