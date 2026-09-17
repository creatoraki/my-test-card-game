// 正文: 把描述里的数字(含小数与百分号)切出来用主题色高亮, 其余原样输出。

const NUMBER = /(\d+(?:\.\d+)?%?)/;

export function DescText({ text, numberClassName }: { text: string; numberClassName: string }) {
  return (
    <>
      {text.split(NUMBER).map((part, index) =>
        index % 2 === 1 ? (
          <em key={index} className={numberClassName}>{part}</em>
        ) : (
          part
        ),
      )}
    </>
  );
}
