import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import StaffNav from "@/app/components/StaffNav";
import RoomForm from "@/app/components/RoomForm";
import {
  deleteRoom,
  toggleBedMaintenance,
  toggleRoomActive,
} from "@/app/actions/rooms";

const bedStyle: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  OCCUPIED: "bg-red-50 text-red-700 border-red-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string }>;
}) {
  const user = await requireRole("ADMIN", "WARDEN");
  const { building } = await searchParams;

  const [buildings, rooms] = await Promise.all([
    prisma.building.findMany({
      orderBy: { name: "asc" },
    }),

    prisma.room.findMany({
      where: building ? { buildingId: building } : undefined,
      orderBy: [
        { building: { name: "asc" } },
        { floor: "asc" },
        { roomNumber: "asc" },
      ],
      include: {
        building: true,
        beds: {
          orderBy: { label: "asc" },
          include: {
            _count: {
              select: { allocations: true },
            },
          },
        },
      },
    }),
  ]);

  const beds = rooms.flatMap((room) => room.beds);

  const totalBeds = beds.length;
  const availableBeds = beds.filter((bed) => bed.status === "AVAILABLE").length;
  const occupiedBeds = beds.filter((bed) => bed.status === "OCCUPIED").length;
  const maintenanceBeds = beds.filter(
    (bed) => bed.status === "MAINTENANCE",
  ).length;

  return (
    <>
      <StaffNav user={user} />

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Rooms and Beds
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage hostel buildings, rooms, and bed availability.
            </p>
          </div>

          <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            {rooms.length} {rooms.length === 1 ? "Room" : "Rooms"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Total Beds"
            value={totalBeds}
            color="border-l-indigo-500"
          />
          <Stat
            label="Available"
            value={availableBeds}
            color="border-l-green-500"
          />
          <Stat
            label="Occupied"
            value={occupiedBeds}
            color="border-l-red-500"
          />
          <Stat
            label="Maintenance"
            value={maintenanceBeds}
            color="border-l-amber-500"
          />
        </div>

        <RoomForm
          buildings={buildings.map((b) => ({
            id: b.id,
            name: b.name,
          }))}
        />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Room Directory</h2>

            <span className="text-xs text-gray-500">
              Filter rooms by building
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/rooms"
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                !building
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Buildings
            </Link>

            {buildings.map((b) => (
              <Link
                key={b.id}
                href={`/rooms?building=${encodeURIComponent(b.id)}`}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  building === b.id
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
            <h2 className="font-semibold text-gray-900">Room Information</h2>
            <p className="mt-1 text-xs text-gray-500">
              View room details and manage individual beds.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Building</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Monthly Rent</th>
                  <th className="px-4 py-3">Beds</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <p className="font-medium text-gray-700">
                        No rooms found
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Add a room or select another building.
                      </p>
                    </td>
                  </tr>
                )}

                {rooms.map((room) => {
                  const hasHistory = room.beds.some(
                    (bed) => bed._count.allocations > 0,
                  );

                  const anyOccupied = room.beds.some(
                    (bed) => bed.status === "OCCUPIED",
                  );

                  return (
                    <tr
                      key={room.id}
                      className={`border-t border-gray-100 align-top transition hover:bg-gray-50 ${
                        !room.isActive ? "bg-gray-50 opacity-70" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                          {room.roomNumber}

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              room.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {room.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {room.amenities.length > 0 && (
                          <p className="mt-1 max-w-48 text-xs text-gray-500">
                            {room.amenities.join(", ")}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {room.building.name}
                      </td>

                      <td className="px-4 py-4 text-gray-600">{room.floor}</td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                          {room.type.charAt(0) +
                            room.type.slice(1).toLowerCase()}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-800">
                        NPR {Number(room.monthlyRent).toLocaleString()}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex max-w-64 flex-wrap gap-1.5">
                          {room.beds.map((bed) => (
                            <form key={bed.id} action={toggleBedMaintenance}>
                              <input type="hidden" name="id" value={bed.id} />

                              <button
                                type="submit"
                                disabled={bed.status === "OCCUPIED"}
                                title={
                                  bed.status === "OCCUPIED"
                                    ? "This bed is occupied"
                                    : "Click to toggle maintenance"
                                }
                                className={`rounded-md border px-2 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${bedStyle[bed.status]}`}
                              >
                                {bed.label}:{" "}
                                {bed.status.charAt(0) +
                                  bed.status.slice(1).toLowerCase()}
                              </button>
                            </form>
                          ))}
                        </div>

                        <p className="mt-2 text-xs text-gray-400">
                          {room.beds.length} total beds
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {!(room.isActive && anyOccupied) && (
                            <form action={toggleRoomActive}>
                              <input type="hidden" name="id" value={room.id} />

                              <button
                                type="submit"
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                              >
                                {room.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </form>
                          )}

                          {user.role === "ADMIN" && !hasHistory && (
                            <form action={deleteRoom}>
                              <input type="hidden" name="id" value={room.id} />

                              <button
                                type="submit"
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 ${color} bg-white p-4 shadow-sm`}
    >
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}
