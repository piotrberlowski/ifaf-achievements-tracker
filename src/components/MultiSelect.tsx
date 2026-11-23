"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type Option = { value: string; label: string };

export function MultiSelect({
  emptyLabel,
  id,
  label,
  name,
  options,
  required,
  selected,
}: {
  emptyLabel: string;
  id: string;
  label: string;
  name: string;
  options: Option[];
  required: boolean;
  selected: string[];
}) {
  const [picked, setPicked] = useState(selected);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  useDismissOnOutsideClick(menu, open, () => setOpen(false));

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium" id={id}>
        {label}
        {required ? null : <span className="font-normal"> optional</span>}
      </span>
      <details
        className="dropdown w-full"
        onToggle={(event) => setOpen(event.currentTarget.open)}
        open={open}
        ref={menu}
      >
        <summary className="select w-full max-w-none list-none truncate bg-base-100 text-base-content">
          {summary(picked, options, emptyLabel)}
        </summary>
        <Choices id={id} name={name} onPicked={setPicked} options={options} picked={picked} />
      </details>
      <RequiredPick emptyLabel={emptyLabel} picked={picked} required={required} />
    </div>
  );
}

function useDismissOnOutsideClick(
  menu: RefObject<HTMLElement | null>,
  open: boolean,
  dismiss: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node)) dismiss();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [dismiss, menu, open]);
}

function Choices({
  id,
  name,
  onPicked,
  options,
  picked,
}: {
  id: string;
  name: string;
  onPicked: (next: string[]) => void;
  options: Option[];
  picked: string[];
}) {
  return (
    <div className="dropdown-content z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg">
      <ul aria-labelledby={id} className="menu menu-sm w-full bg-base-100 p-0 text-base-content">
        {options.map((option) => (
          <Choice
            checked={picked.includes(option.value)}
            key={option.value}
            name={name}
            onPicked={onPicked}
            option={option}
            picked={picked}
          />
        ))}
      </ul>
    </div>
  );
}

function Choice({
  checked,
  name,
  onPicked,
  option,
  picked,
}: {
  checked: boolean;
  name: string;
  onPicked: (next: string[]) => void;
  option: Option;
  picked: string[];
}) {
  return (
    <li>
      <label className="flex cursor-pointer gap-2">
        <input
          checked={checked}
          className="checkbox checkbox-sm checkbox-primary"
          name={name}
          onChange={(event) => onPicked(nextPicked(picked, option.value, event.target.checked))}
          type="checkbox"
          value={option.value}
        />
        {option.label}
      </label>
    </li>
  );
}

function RequiredPick({
  emptyLabel,
  picked,
  required,
}: {
  emptyLabel: string;
  picked: string[];
  required: boolean;
}) {
  if (!required) return null;
  return (
    <input
      aria-label={emptyLabel}
      className="sr-only"
      onChange={() => undefined}
      required={picked.length === 0}
      tabIndex={-1}
      value={picked.length === 0 ? "" : "selected"}
    />
  );
}

function nextPicked(picked: string[], value: string, checked: boolean): string[] {
  const rest = picked.filter((item) => item !== value);
  return checked ? [...rest, value] : rest;
}

function summary(picked: string[], options: Option[], emptyLabel: string): string {
  const codes = options.filter((option) => picked.includes(option.value)).map((option) => option.value);
  if (codes.length === 0) return emptyLabel;
  return codes.join(", ");
}
