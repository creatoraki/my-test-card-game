import { playSfx } from "@/ui/audio";
import { VolumeSlider } from "@/ui/common/VolumeSlider";
import { setBgmVolume, toggleBgm, useBgmEnabled, useBgmVolume } from "@/ui/hooks/useBgm";
import { setSfxVolume, toggleSfx, useSfxEnabled, useSfxVolume } from "@/ui/hooks/useSfx";
import s from "./SettingsPanel.module.css";

export function AudioSettingsRows() {
  const bgmEnabled = useBgmEnabled();
  const bgmVolume = useBgmVolume();
  const sfxEnabled = useSfxEnabled();
  const sfxVolume = useSfxVolume();

  return (
    <div className={s.section}>
      <div className={s.row}>
        <span className={s.rowName}>音乐</span>
        <button className={s.toggle} type="button" aria-pressed={bgmEnabled} onClick={toggleBgm}>
          {bgmEnabled ? "已开启" : "已关闭"}
        </button>
        <VolumeSlider
          label="音乐音量"
          value={bgmVolume}
          disabled={!bgmEnabled}
          onChange={setBgmVolume}
        />
      </div>
      <div className={s.row}>
        <span className={s.rowName}>音效</span>
        <button className={s.toggle} type="button" aria-pressed={sfxEnabled} onClick={toggleSfx}>
          {sfxEnabled ? "已开启" : "已关闭"}
        </button>
        <VolumeSlider
          label="音效音量"
          value={sfxVolume}
          disabled={!sfxEnabled}
          onChange={setSfxVolume}
          onCommit={() => playSfx("click")}
        />
      </div>
    </div>
  );
}
