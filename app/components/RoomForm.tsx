"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRoom, type FormState } from "@/app/actions/rooms";

type Props = { buildings: { id: string; name: string }[] };

export default function RoomForm({ buildings }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createRoom,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  if (buildings.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
        Add a building first, then you can add rooms to it.
      </div>
    );
  }

  const input = "w-full rounded border px-3 py-2";

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-xl border bg-white p-4"
    >
      <h2 className="font-semibold">Add room</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="buildingId" className="text-sm font-medium">
            Building
          </label>
          <select id="buildingId" name="buildingId" required className={input}>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="roomNumber" className="text-sm font-medium">
            Room number
          </label>
          <input id="roomNumber" name="roomNumber" required className={input} />
        </div>
        <div className="space-y-1">
          <label htmlFor="floor" className="text-sm font-medium">
            Floor
          </label>
          <input
            id="floor"
            name="floor"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={input}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="type" className="text-sm font-medium">
            Type
          </label>
          <select id="type" name="type" defaultValue="DOUBLE" className={input}>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="DORMITORY">Dormitory</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="capacity" className="text-sm font-medium">
            Beds (capacity)
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={12}
            defaultValue={2}
            required
            className={input}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="monthlyRent" className="text-sm font-medium">
            Monthly rent (per bed)
          </label>
          <input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
            required
            className={input}
          />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <label htmlFor="amenities" className="text-sm font-medium">
            Amenities (comma separated, optional)
          </label>
          <input
            id="amenities"
            name="amenities"
            placeholder="Attached bathroom, Wi-Fi, Heater"
            className={input}
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
        {pending ? "Saving..." : "Add room and create beds"}
      </button>
    </form>
  );
}
