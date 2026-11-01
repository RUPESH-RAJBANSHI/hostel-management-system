"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBuilding, type FormState } from "@/app/actions/rooms";

export default function BuildingForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createBuilding,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-xl border bg-white p-4"
    >
      <h2 className="font-semibold">Add building</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="floors" className="text-sm font-medium">
            Floors
          </label>
          <input
            id="floors"
            name="floors"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <label htmlFor="address" className="text-sm font-medium">
            Address (optional)
          </label>
          <input
            id="address"
            name="address"
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700">{state.success}</p>
      )}

      <button
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Add building"}
      </button>
    </form>
  );
}
