// 面板铺底: 场景插图 + 暗部渐变(右侧内容区与底部压暗, 左栏立绘区保留光感)。纯装饰, 不接收指针。
// 做法同事件档案的 .art + .shade; 场景按角色登记, 见 ui/art/explore/partyDossierArt.ts。
import s from "./DossierBackdrop.module.css";

export function DossierBackdrop({ scene }: { scene: string }) {
  return (
    <>
      <img className={s.scene} src={scene} alt="" draggable={false} />
      <i className={s.shade} aria-hidden="true" />
    </>
  );
}
