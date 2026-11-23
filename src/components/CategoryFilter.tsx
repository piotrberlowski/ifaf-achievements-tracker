import FilterSubmitButton from "@/components/FilterSubmitButton";
import { MultiSelect } from "@/components/MultiSelect";
import {
  type CategoryFilterField,
  type CategoryQuery,
} from "@/lib/search/category-query";
import { ageDivisions, awardTracks, bowStyles, genders, rounds } from "@/lib/reference/catalog";
import Form from "next/form";
import Link from "next/link";

const labels: Record<CategoryFilterField, string> = {
  discipline: "Discipline",
  round: "Round",
  bow: "Bow style",
  age: "Age group",
  gender: "Gender",
};

const disciplineOrder = ["ANIMAL", "FIELD", "INDOOR"];

const emptyOption: Record<CategoryFilterField, string> = {
  discipline: "Choose a discipline",
  round: "Choose a round",
  bow: "Choose a bow style",
  age: "All age groups",
  gender: "All genders",
};

type Option = { value: string; label: string };

export default function CategoryFilter({
  action,
  fields,
  required = [],
  values,
  formKey,
  idPrefix,
  legend,
  submitLabel,
  includeDisplayOnlyRounds = false,
  multiple = [],
}: {
  action: string;
  fields: readonly CategoryFilterField[];
  required?: readonly CategoryFilterField[];
  values: Pick<CategoryQuery, CategoryFilterField | "bows" | "ages">;
  formKey: string;
  idPrefix: string;
  legend: string;
  submitLabel: string;
  includeDisplayOnlyRounds?: boolean;
  multiple?: readonly CategoryFilterField[];
}) {
  const requiredFields = new Set(required);
  const many = new Set(multiple);
  const hasValue = fields.some((field) => fieldHasValue(field, values, many));

  return (
    <div key={formKey}>
    <Form action={action} className="rounded-2xl bg-neutral p-6 text-neutral-content shadow-sm sm:p-8">
      <fieldset>
        <legend className="text-lg font-semibold">{legend}</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => (
            <FilterControl
              field={field}
              id={`${idPrefix}-${field}`}
              includeDisplayOnlyRounds={includeDisplayOnlyRounds}
              key={field}
              many={many.has(field)}
              required={requiredFields.has(field)}
              values={values}
            />
          ))}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <FilterSubmitButton label={submitLabel} />
            {hasValue ? (
              <Link className="btn btn-ghost text-neutral-content" href={action}>
                Clear
              </Link>
            ) : null}
          </div>
        </div>
      </fieldset>
    </Form>
    </div>
  );
}

function FilterControl({
  field,
  id,
  includeDisplayOnlyRounds,
  many,
  required,
  values,
}: {
  field: CategoryFilterField;
  id: string;
  includeDisplayOnlyRounds: boolean;
  many: boolean;
  required: boolean;
  values: Pick<CategoryQuery, CategoryFilterField | "bows" | "ages">;
}) {
  if (many) {
    return (
      <MultiSelect
        emptyLabel={emptyLabel[field]}
        id={id}
        label={labels[field]}
        name={field}
        options={optionsFor(field, includeDisplayOnlyRounds)}
        required={required}
        selected={selectedValues(field, values)}
      />
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" htmlFor={id}>
        {labels[field]}
        {required ? null : <span className="font-normal"> optional</span>}
      </label>
      <select
        className="select w-full max-w-none bg-base-100 text-base-content"
        defaultValue={values[field] ?? ""}
        id={id}
        name={field}
        required={required}
      >
        <option disabled={required} value="">
          {emptyOption[field]}
        </option>
        {optionsFor(field, includeDisplayOnlyRounds).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const emptyLabel: Record<CategoryFilterField, string> = {
  discipline: "Choose a discipline",
  round: "Choose a round",
  bow: "Choose bow styles",
  age: "All age groups",
  gender: "All genders",
};

type FilterValues = Pick<CategoryQuery, CategoryFilterField | "bows" | "ages">;

function fieldHasValue(
  field: CategoryFilterField,
  values: FilterValues,
  many: Set<CategoryFilterField>,
): boolean {
  if (many.has(field)) return selectedValues(field, values).length > 0;
  return Boolean(values[field]);
}

function selectedValues(field: CategoryFilterField, values: FilterValues): string[] {
  if (field === "bow") return values.bows;
  if (field === "age") return values.ages;
  const value = values[field];
  return typeof value === "string" && value ? [value] : [];
}

function disciplineRank(code: string): number {
  const index = disciplineOrder.indexOf(code);
  return index === -1 ? disciplineOrder.length : index;
}

function optionsFor(field: CategoryFilterField, includeDisplayOnlyRounds: boolean): Option[] {
  if (field === "discipline") {
    return [...awardTracks]
      .sort((left, right) => disciplineRank(left.code) - disciplineRank(right.code))
      .map((track) => ({ value: track.code, label: track.name }));
  }
  if (field === "round") {
    return rounds
      .filter((round) => includeDisplayOnlyRounds || !round.displayOnly)
      .map((round) => ({ value: round.code, label: round.name }));
  }
  if (field === "bow") {
    return bowStyles.map((style) => ({ value: style.code, label: style.name }));
  }
  if (field === "age") {
    return ageDivisions.map((division) => ({ value: division.code, label: division.name }));
  }
  return genders.map((gender) => ({ value: gender.value, label: gender.name }));
}
