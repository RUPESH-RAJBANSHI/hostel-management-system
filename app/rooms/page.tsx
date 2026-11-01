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
  AVAILABLE: "bg-green-100 text-green-800 border-green-300",
  OCCUPIED: "bg-red-100 text-red-800 border-red-300",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string }>;
}) {
  const user = await requireRole("ADMIN", "WARDEN");
  const { building } = await searchParams;

  const [buildings, rooms, bedStats] = await Promise.all([
    prisma.building.findMany({ orderBy: { name: "asc" } }),
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
          include: { _count: { select: { allocations: true } } },
        },
      },
    }),
    prisma.bed.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const count = (s: string) =>
    bedStats.find((b) => b.status === s)?._count._all ?? 0;
  const total = count("AVAILABLE") + count("OCCUPIED") + count("MAINTENANCE");

  return (
    <>
      <StaffNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4">
        <h1 className="text-2xl font-semibold">Rooms and beds</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total beds" value={total} />
          <Stat label="Available" value={count("AVAILABLE")} />
          <Stat label="Occupied" value={count("OCCUPIED")} />
          <Stat label="Maintenance" value={count("MAINTENANCE")} />
        </div>

        <RoomForm
          buildings={buildings.map((b) => ({ id: b.id, name: b.name }))}
        />

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Filter:</span>
          <Link
            href="/rooms"
            className={`rounded border px-3 py-1 ${!building ? "bg-black text-white" : ""}`}
          >
            All
          </Link>
          {buildings.map((b) => (
            <Link
              key={b.id}
              href={`/rooms?building=${b.id}`}
              className={`rounded border px-3 py-1 ${building === b.id ? "bg-black text-white" : ""}`}
            >
              {b.name}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Room</th>
                <th className="p-3">Building</th>
                <th className="p-3">Floor</th>
                <th className="p-3">Type</th>
                <th className="p-3">Rent / bed</th>
                <th className="p-3">Beds</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-gray-500">
                    No rooms found.
                  </td>
                </tr>
              )}
              {rooms.map((room) => {
                const hasHistory = room.beds.some(
                  (b) => b._count.allocations > 0,
                );
                const anyOccupied = room.beds.some(
                  (b) => b.status === "OCCUPIED",
                );
                return (
                  <tr
                    key={room.id}
                    className={`border-t align-top ${room.isActive ? "" : "opacity-60"}`}
                  >
                    <td className="p-3 font-medium">
                      {room.roomNumber}
                      {!room.isActive && (
                        <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs">
                          Inactive
                        </span>
                      )}
                      {room.amenities.length > 0 && (
                        <div className="text-xs font-normal text-gray-500">
                          {room.amenities.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{room.building.name}</td>
                    <td className="p-3">{room.floor}</td>
                    <td className="p-3">{room.type}</td>
                    <td className="p-3">
                      {Number(room.monthlyRent).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {room.beds.map((bed) => (
                          <form key={bed.id} action={toggleBedMaintenance}>
                            <input type="hidden" name="id" value={bed.id} />
                            <button
                              disabled={bed.status === "OCCUPIED"}
                              title={
                                bed.status === "OCCUPIED"
                                  ? "Occupied"
                                  : "Click to toggle maintenance"
                              }
                              className={`rounded border px-2 py-0.5 text-xs ${bedStyle[bed.status]} disabled:cursor-not-allowed`}
                            >
                              {bed.label}: {bed.status.toLowerCase()}
                            </button>
                          </form>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {!(room.isActive && anyOccupied) && (
                          <form action={toggleRoomActive}>
                            <input type="hidden" name="id" value={room.id} />
                            <button className="rounded border px-2 py-1">
                              {room.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </form>
                        )}
                        {user.role === "ADMIN" && !hasHistory && (
                          <form action={deleteRoom}>
                            <input type="hidden" name="id" value={room.id} />
                            <button className="rounded border px-2 py-1 text-red-600">
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
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
