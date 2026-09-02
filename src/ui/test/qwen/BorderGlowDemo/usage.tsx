import { BorderGlow } from "@/ui/common/BorderGlow";

export function BorderGlowUsage() {
  return (
    <BorderGlow
      edgeSensitivity={30}
      glowColor="40 80 80"
      backgroundColor="#120F17"
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1}
      coneSpread={25}
      animated={false}
      colors={["#c084fc", "#f472b6", "#38bdf8"]}
    >
      <div style={{ padding: "2em" }}>
        <h2>在此放置内容</h2>
        <p>把鼠标移到卡片边缘附近即可看到光效。</p>
      </div>
    </BorderGlow>
  );
}
