"use client";

import { useFormStatus } from "react-dom";

export default function FilterSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending} type="submit">
      {pending ? "Looking up…" : label}
    </button>
  );
}
