import s from "./FormationTodoList.module.css";

export interface FormationTodoListProps {
  items: string[];
}

export function FormationTodoList({ items }: FormationTodoListProps) {
  return (
    <span className={s.list} role="list">
      {items.map((item, index) => (
        <span className={s.item} role="listitem" key={`${item}-${index}`}>
          {item}
        </span>
      ))}
    </span>
  );
}
