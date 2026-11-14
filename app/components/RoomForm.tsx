"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRoom, type FormState } from "@/app/actions/rooms";

type Props = {
  buildings: {
    id: string;
    name: string;
  }[];
};

export default function RoomForm({ buildings }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createRoom,
    undefined,
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  if (buildings.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">No buildings available</h2>
        <p className="mt-1 text-sm text-amber-800">
          Please add a building before creating rooms.
        </p>
        <a
          href="/buildings"
          className="mt-3 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Manage Buildings
        </a>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Add New Room</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter room information. Beds will be created automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="buildingId" className={labelClass}>
            Building *
          </label>

          <select
            id="buildingId"
            name="buildingId"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select building
            </option>

            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="roomNumber" className={labelClass}>
            Room Number *
          </label>

          <input
            id="roomNumber"
            name="roomNumber"
            type="text"
            placeholder="Example: 101"
            maxLength={20}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="floor" className={labelClass}>
            Floor *
          </label>

          <input
            id="floor"
            name="floor"
            type="number"
            min={0}
            max={100}
            defaultValue={0}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="type" className={labelClass}>
            Room Type *
          </label>

          <select
            id="type"
            name="type"
            defaultValue="DOUBLE"
            required
            className={inputClass}
          >
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="DORMITORY">Dormitory</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="capacity" className={labelClass}>
            Bed Capacity *
          </label>

          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={12}
            defaultValue={2}
            required
            className={inputClass}
          />

          <p className="text-xs text-gray-400">Maximum 12 beds per room.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="monthlyRent" className={labelClass}>
            Monthly Room Rent (NPR) *
          </label>

          <input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            min={0}
            max={10000000}
            step="0.01"
            defaultValue={0}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <label htmlFor="amenities" className={labelClass}>
            Amenities
          </label>

          <input
            id="amenities"
            name="amenities"
            type="text"
            placeholder="Attached bathroom, Wi-Fi, Heater, Balcony"
            className={inputClass}
          />

          <p className="text-xs text-gray-400">
            Separate multiple amenities using commas.
          </p>
        </div>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {state.success}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="reset"
          disabled={pending}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Clear
        </button>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating Room..." : "Add Room & Create Beds"}
        </button>
      </div>
    </form>
  );
}
