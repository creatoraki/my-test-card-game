// 底栏左侧的沙漏(设计图 54×68 → 18×23), 描边色取主题色。

export function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 23" width="18" height="23" aria-hidden="true">
      <path d="M1 1.2H17M1 21.8H17" strokeWidth="2.2" />
      <path d="M3.2 2.4C3.2 7.4 7.6 9.4 9 11.5C10.4 9.4 14.8 7.4 14.8 2.4" strokeWidth="1.8" />
      <path d="M3.2 20.6C3.2 15.6 7.6 13.6 9 11.5C10.4 13.6 14.8 15.6 14.8 20.6" strokeWidth="1.8" />
      <path d="M5.6 19.4C6.4 17.2 8 16.2 9 15.2C10 16.2 11.6 17.2 12.4 19.4Z" />
    </svg>
  );
}
