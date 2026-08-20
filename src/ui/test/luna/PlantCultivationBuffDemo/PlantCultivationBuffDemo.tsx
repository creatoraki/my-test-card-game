import s from "./PlantCultivationBuffDemo.module.css";
import {
  CultivationCompleteIcon,
  CultivationProgressIcon,
  InsightBuffIcon,
  ShieldBuffIcon,
  SharpnessBuffIcon,
} from "./BuffIconSet";

export function PlantCultivationBuffDemo() {
  return (
    <div className={s.root}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>LUNA / BUFF SIGILS</p>
          <h2>培育植物 <span>· 生长状态</span></h2>
        </div>
        <p className={s.intro}>以一枚植物印记记录培育进程，从封存的新芽到完成绽放。</p>
      </header>

      <section className={s.gallery} aria-label="培育植物 BUFF 图标">
        <article className={`${s.iconCard} ${s.growingCard}`}>
          <div className={s.iconStage}>
            <CultivationProgressIcon />
            <span className={s.stageCode}>01 / GROWING</span>
          </div>
          <div className={s.cardCopy}>
            <div className={s.statusLine}>
              <span className={s.statusDot} />
              <span>培育中</span>
            </div>
            <h3>新芽 · 扎根</h3>
            <p>植物正在吸收养分，根系与叶脉尚未完成共鸣。</p>
          </div>
        </article>

        <article className={`${s.iconCard} ${s.completeCard}`}>
          <div className={s.iconStage}>
            <CultivationCompleteIcon />
            <span className={s.stageCode}>02 / BLOOMED</span>
          </div>
          <div className={s.cardCopy}>
            <div className={s.statusLine}>
              <span className={s.statusDot} />
              <span>培育完成</span>
            </div>
            <h3>盛放 · 可收获</h3>
            <p>花冠已经开启，培育成果化为可被队伍收取的祝福。</p>
          </div>
        </article>

        <article className={`${s.iconCard} ${s.insightCard}`}>
          <div className={s.iconStage}>
            <InsightBuffIcon />
            <span className={s.stageCode}>03 / INSIGHT</span>
          </div>
          <div className={s.cardCopy}>
            <div className={s.statusLine}>
              <span className={s.statusDot} />
              <span>心眼</span>
            </div>
            <h3>洞察 · 破隐</h3>
            <p>捕捉敌人的破绽，让隐藏的轨迹与致命窗口清晰可见。</p>
          </div>
        </article>

        <article className={`${s.iconCard} ${s.sharpCard}`}>
          <div className={s.iconStage}>
            <SharpnessBuffIcon />
            <span className={s.stageCode}>04 / SHARPNESS</span>
          </div>
          <div className={s.cardCopy}>
            <div className={s.statusLine}>
              <span className={s.statusDot} />
              <span>锋利</span>
            </div>
            <h3>锋芒 · 贯穿</h3>
            <p>刀锋压缩成一道赤金切线，攻击更接近防御的薄弱处。</p>
          </div>
        </article>

        <article className={`${s.iconCard} ${s.shieldCard}`}>
          <div className={s.iconStage}>
            <ShieldBuffIcon />
            <span className={s.stageCode}>05 / SHIELD</span>
          </div>
          <div className={s.cardCopy}>
            <div className={s.statusLine}>
              <span className={s.statusDot} />
              <span>护盾</span>
            </div>
            <h3>守护 · 层叠</h3>
            <p>三重能量护层彼此咬合，为队伍挡下即将到来的冲击。</p>
          </div>
        </article>
      </section>

      <footer className={s.footer}>
        <span className={s.footerRule} />
        <span>BOTANICAL CULTIVATION PROTOCOL</span>
        <span className={s.footerRule} />
      </footer>
    </div>
  );
}
