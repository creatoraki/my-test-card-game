import type { CSSProperties } from "react";
import { PartyMemberCard } from "@/ui/common/PartyMemberCard";
import { cx } from "@/ui/common/cx";
import type { EndRosterMember } from "../endSummary";
import s from "./EndPartyRoster.module.css";

interface Props {
  members: EndRosterMember[];
  wiped: boolean;
}

export function EndPartyRoster({ members, wiped }: Props) {
  return (
    <section className={cx(s["roster"], wiped && s["is-wiped"])} aria-label="队伍状态">
      <header className={s["roster-header"]}>
        <span>队伍状态</span>
        <h2>归队成员 <small>· {members.length} 人</small></h2>
      </header>
      <div className={s["roster-list"]}>
        {members.length ? (
          members.map((member, index) => (
            <div
              key={member.charId}
              className={s["member"]}
              style={{ "--roster-delay": `${index * 90}ms` } as CSSProperties}
            >
              <PartyMemberCard
                charId={member.charId}
                emoji={member.emoji}
                name={member.name}
                hp={member.hp}
                hpLimit={member.hpLimit}
                maxHp={member.maxHp}
                pollution={member.pollution}
                down={!member.alive}
                className={s["member-card"]}
              />
            </div>
          ))
        ) : (
          <p className={s["empty"]}>本趟没有队伍记录</p>
        )}
      </div>
    </section>
  );
}