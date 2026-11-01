import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { deleteBuilding } from "@/app/actions/rooms";
import StaffNav from "@/app/components/StaffNav";
import BuildingForm from "@/app/components/BuildingForm";

export default async function BuildingsPage() {
  const user = await requireRole("ADMIN", "WARDEN");

  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { rooms: true } } },
  });

  return (
    <>
      <StaffNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4">
        <h1 className="text-2xl font-semibold">Buildings</h1>

        <BuildingForm />

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Address</th>
                <th className="p-3">Floors</th>
                <th className="p-3">Rooms</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {buildings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No buildings yet. Add your first one above.
                  </td>
                </tr>
              )}
              {buildings.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3">{b.address ?? "-"}</td>
                  <td className="p-3">{b.floors}</td>
                  <td className="p-3">{b._count.rooms}</td>
                  <td className="p-3 text-right">
                    {user.role === "ADMIN" && b._count.rooms === 0 && (
                      <form action={deleteBuilding}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="rounded border px-2 py-1 text-red-600">
                          Delete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
