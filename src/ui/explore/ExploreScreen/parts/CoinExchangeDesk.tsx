import { getItemDef } from "@/data";
import { COIN_EXCHANGES, COIN_LADDER, type CoinExchangeId } from "@/data/curios/rules/serviceBalance";
import { coinExchangeReason } from "@/explore/curio/coins";
import type { ExploreState } from "@/explore/types";
import { countByItemId } from "@/items/inventory";
import { exchangeCoin } from "@/store/explore/curioActions";
import s from "./CoinExchangeDesk.module.css";

const EXCHANGE_IDS = Object.keys(COIN_EXCHANGES) as CoinExchangeId[];

/** 钱币兑换台的结算页面板：放在右侧插画区下部(与可拾取物品栏同位)，每行一种兑换，可反复点。 */
export function CoinExchangeDesk({ session }: { session: ExploreState }) {
  return (
    <div className={s.desk} aria-label="钱币兑换">
      <p className={s.head}>
        <i aria-hidden />
        <span>钱币兑换</span>
        <em>
          {COIN_LADDER.map((id) => `${getItemDef(id).name} ${countByItemId(session.backpack, id)}`).join(" · ")}
        </em>
      </p>
      <ul className={s.rows}>
        {EXCHANGE_IDS.map((id) => {
          const rule = COIN_EXCHANGES[id];
          const reason = coinExchangeReason(session, id);
          return <li key={id} className={s.row}>
            <span className={s.formula}>
              {getItemDef(rule.from).name} ×{rule.give}
              <b aria-hidden>→</b>
              {getItemDef(rule.to).name} ×{rule.get}
            </span>
            {reason && <span className={s.reason}>{reason}</span>}
            <button type="button" className={s.go} data-sfx="confirm" disabled={Boolean(reason)} onClick={() => exchangeCoin(id)}>
              兑换
            </button>
          </li>;
        })}
      </ul>
    </div>
  );
}
