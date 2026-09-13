import s from "./MapSelectChrome.module.css";

export function MapSelectChrome() {
  return <div className={s.chrome} aria-hidden="true">
    <svg className={s.lines} viewBox="0 0 1920 1080" fill="none">
      <defs>
        <linearGradient id="sortie-chrome-line"><stop stopColor="#d2e6f2" stopOpacity=".65" /><stop offset="1" stopColor="#b9d6e8" stopOpacity=".05" /></linearGradient>
        <pattern id="sortie-chrome-dots" width="12" height="12" patternUnits="userSpaceOnUse"><path d="m2 0 2 2-2 2-2-2Z" fill="#bfdced" opacity=".2" /></pattern>
      </defs>
      <path d="M0 0H68V186L0 291ZM0 927l69 79v74H0Z" fill="url(#sortie-chrome-dots)" />
      <path d="m47 21 20 22-20 22-20-22Z" stroke="#e5f5ff" strokeWidth="1.7" />
      <path d="m47 33 9 10-9 10-9-10Z" fill="#b6d8ed" /><circle cx="47" cy="43" r="3" fill="#fff" />
      <path d="M76 69h279l17-25h377M62 87l18-18m291-21h348M28 1026l34 25h1805l24-25v-32" stroke="url(#sortie-chrome-line)" />
      <path d="M76 1028h357m-61 23h228m289 0h142M1894 1025l-27 26h-34" stroke="#bad2df" strokeOpacity=".3" />
      <path d="m29 1036 4 5-4 5-4-5Z" fill="#a9cbdc" />
      <circle cx="47" cy="17" r="1" fill="#d8eaf6" />
    </svg>
    <div className={s.breadcrumb}>目标区域 <span>／</span> 选择行动路线</div>
  </div>;
}
