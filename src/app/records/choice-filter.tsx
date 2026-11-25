import { bowStyles, type BowStyleCode } from "@/lib/reference/catalog";
import type { ReactNode } from "react";

type FilterOption<T extends string> = { value: T; label: string; title: string };

export function BowChoice({
  selected,
  onSelect,
}: {
  selected: BowStyleCode;
  onSelect: (code: BowStyleCode) => void;
}) {
  return (
    <ChoiceFilter
      legend="Bow style"
      name="bow"
      onSelect={onSelect}
      options={bowStyles.map((style) => ({ value: style.code, label: style.code, title: style.name }))}
      selected={selected}
    />
  );
}

export function ChoiceFilter<T extends string>(
  props: {
    legend: string;
    options: readonly FilterOption<T>[];
    selected: readonly T[];
    onAll: () => void;
    onToggle: (value: T) => void;
  } | {
    legend: string;
    name: string;
    options: readonly FilterOption<T>[];
    selected: T;
    onSelect: (value: T) => void;
  },
) {
  if ("onSelect" in props) {
    return (
      <ChoiceButtons
        checked={(value) => value === props.selected}
        legend={props.legend}
        name={props.name}
        onChange={props.onSelect}
        options={props.options}
        type="radio"
      />
    );
  }
  return (
    <ChoiceButtons
      checked={(value) => props.selected.includes(value)}
      leading={
        <OptionButton
          checked={props.selected.length === props.options.length}
          label="All"
          onChange={props.onAll}
          title="All"
          type="checkbox"
          value="all"
        />
      }
      legend={props.legend}
      onChange={props.onToggle}
      options={props.options}
      type="checkbox"
    />
  );
}

function ChoiceButtons<T extends string>({
  checked,
  leading,
  legend,
  name,
  onChange,
  options,
  type,
}: {
  checked: (value: T) => boolean;
  leading?: ReactNode;
  legend: string;
  name?: string;
  onChange: (value: T) => void;
  options: readonly FilterOption<T>[];
  type: "checkbox" | "radio";
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {leading}
        {options.map((option) => (
          <OptionButton
            checked={checked(option.value)}
            key={option.value}
            label={option.label}
            name={name}
            onChange={() => onChange(option.value)}
            title={option.title}
            type={type}
            value={option.value}
          />
        ))}
      </div>
    </fieldset>
  );
}

function OptionButton({
  checked,
  label,
  name,
  onChange,
  title,
  type,
  value,
}: {
  checked: boolean;
  label: string;
  name?: string;
  onChange: () => void;
  title: string;
  type: "checkbox" | "radio";
  value: string;
}) {
  return (
    <input
      aria-label={label}
      checked={checked}
      className="btn btn-sm"
      name={name}
      onChange={onChange}
      title={title}
      type={type}
      value={value}
    />
  );
}
