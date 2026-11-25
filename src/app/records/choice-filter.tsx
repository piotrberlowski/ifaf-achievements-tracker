import { bowStyles, type BowStyleCode } from "@/lib/reference/catalog";

export function BowChoice({
  selected,
  onSelect,
}: {
  selected: BowStyleCode;
  onSelect: (code: BowStyleCode) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Bow style</legend>
      <div className="flex flex-wrap gap-2">
        {bowStyles.map((style) => (
          <input
            aria-label={style.code}
            checked={selected === style.code}
            className="btn btn-sm"
            key={style.code}
            name="bow"
            onChange={() => onSelect(style.code)}
            title={style.name}
            type="radio"
            value={style.code}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function ChoiceFilter<T extends string>({
  legend,
  options,
  selected,
  onAll,
  onToggle,
}: {
  legend: string;
  options: readonly { value: T; label: string; title: string }[];
  selected: readonly T[];
  onAll: () => void;
  onToggle: (value: T) => void;
}) {
  const allOn = selected.length === options.length;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="filter">
        <input
          aria-label="All"
          checked={allOn}
          className="btn btn-sm"
          onChange={onAll}
          type="checkbox"
        />
        {options.map((option) => (
          <input
            aria-label={option.label}
            checked={selected.includes(option.value)}
            className="btn btn-sm"
            key={option.value}
            onChange={() => onToggle(option.value)}
            title={option.title}
            type="checkbox"
          />
        ))}
      </div>
    </fieldset>
  );
}
