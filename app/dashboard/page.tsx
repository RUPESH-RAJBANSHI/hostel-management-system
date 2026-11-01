import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import StaffNav from "@/app/components/StaffNav";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

const STATUS: Record<BedStatus, { label: string; bar: string }> = {
  AVAILABLE: { label: "Available", bar: "#14907F" },
  OCCUPIED: { label: "Occupied", bar: "#3949B8" },
  MAINTENANCE: { label: "Maintenance", bar: "#D9962B" },
};

// Beds look different by shape as well as colour:
// available = tinted, occupied = solid, maintenance = striped.
function bedClasses(status: BedStatus) {
  if (status === "OCCUPIED") return "border-[#3949B8] bg-[#3949B8] text-white";
  if (status === "MAINTENANCE") return "border-[#D9962B] text-[#6B4608]";
  return "border-[#14907F] bg-[#D8F0EB] text-[#0B5B50]";
}

const stripes = {
  backgroundImage:
    "repeating-linear-gradient(45deg,#F7DFAE,#F7DFAE 3px,#FFF4DA 3px,#FFF4DA 6px)",
};

function BedCell({
  status,
  label,
  title,
  size = "h-7 w-7 text-xs",
}: {
  status: BedStatus;
  label?: string;
  title?: string;
  size?: string;
}) {
  return (
    <span
      title={title}
      style={status === "MAINTENANCE" ? stripes : undefined}
      className={`inline-flex items-center justify-center rounded-md border-2 font-semibold ${size} ${bedClasses(status)}`}
    >
      {label}
    </span>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My hostel</h1>
          <form action={logout}>
            <button className="rounded-md border border-[#DDE2EC] bg-white px-3 py-1.5 text-sm">
              Log out
            </button>
          </form>
        </div>
        <p className="text-[#5B6784]">
          Welcome, <strong className="text-[#16213A]">{user.name}</strong>. Your
          room and fee details will appear here in a later step.
        </p>
      </main>
    );
  }

  // One query gives us everything the dashboard needs.
  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    include: {
      rooms: {
        orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
        include: { beds: { orderBy: { label: "asc" } } },
      },
    },
  });

  const allRooms = buildings.flatMap((b) => b.rooms);
  const allBeds = allRooms.flatMap((r) => r.beds);
  const count = (s: BedStatus) => allBeds.filter((b) => b.status === s).length;
  const counts = {
    AVAILABLE: count("AVAILABLE"),
    OCCUPIED: count("OCCUPIED"),
    MAINTENANCE: count("MAINTENANCE"),
  };
  const totalBeds = allBeds.length;
  const occupancy = totalBeds
    ? Math.round((counts.OCCUPIED / totalBeds) * 100)
    : 0;
  const activeRooms = allRooms.filter((r) => r.isActive).length;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <StaffNav user={user} />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-[#5B6784]">{today}</p>
        </div>

        {/* Occupancy */}
        <section className="rounded-xl border border-[#DDE2EC] bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Bed occupancy</h2>
            <p className="text-sm text-[#5B6784]">
              {totalBeds === 0
                ? "No beds yet"
                : `${counts.OCCUPIED} of ${totalBeds} beds in use (${occupancy}%)`}
            </p>
          </div>

          {totalBeds === 0 ? (
            <p className="mt-4 text-sm text-[#5B6784]">
              Add a building, then add rooms to it. Each room creates its beds,
              and they will show up here.
            </p>
          ) : (
            <>
              <div
                className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#EEF1F6]"
                role="img"
                aria-label={`${counts.AVAILABLE} available, ${counts.OCCUPIED} occupied, ${counts.MAINTENANCE} in maintenance`}
              >
                {(Object.keys(STATUS) as BedStatus[]).map(
                  (s) =>
                    counts[s] > 0 && (
                      <div
                        key={s}
                        style={{
                          flexGrow: counts[s],
                          backgroundColor: STATUS[s].bar,
                        }}
                      />
                    ),
                )}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-4">
                {(Object.keys(STATUS) as BedStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <BedCell status={s} size="h-6 w-6" />
                    <div>
                      <dd className="text-xl font-semibold leading-none">
                        {counts[s]}
                      </dd>
                      <dt className="mt-1 text-xs text-[#5B6784]">
                        {STATUS[s].label}
                      </dt>
                    </div>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        {/* Totals in one strip */}
        <section className="grid grid-cols-3 divide-x divide-[#DDE2EC] rounded-xl border border-[#DDE2EC] bg-white">
          <Figure label="Buildings" value={buildings.length} />
          <Figure label="Active rooms" value={activeRooms} />
          <Figure label="Total beds" value={totalBeds} />
        </section>

        {/* Bed map */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold">Bed map</h2>
            <div className="flex flex-wrap gap-4 text-xs text-[#5B6784]">
              {(Object.keys(STATUS) as BedStatus[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <BedCell status={s} size="h-4 w-4" />
                  {STATUS[s].label}
                </span>
              ))}
            </div>
          </div>

          {buildings.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#C5CDDD] bg-white p-8 text-center">
              <p className="font-medium">Your hostel is empty for now</p>
              <p className="mt-1 text-sm text-[#5B6784]">
                Start by adding your first building.
              </p>
              <Link
                href="/buildings"
                className="mt-4 inline-block rounded-md bg-[#16213A] px-4 py-2 text-sm font-medium text-white hover:bg-[#223256]"
              >
                Add a building
              </Link>
            </div>
          )}

          {buildings.map((b) => {
            const beds = b.rooms.flatMap((r) => r.beds);
            const occupied = beds.filter((x) => x.status === "OCCUPIED").length;
            return (
              <article
                key={b.id}
                className="rounded-xl border border-[#DDE2EC] bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{b.name}</h3>
                    <p className="text-xs text-[#5B6784]">
                      {b.floors} {b.floors === 1 ? "floor" : "floors"},{" "}
                      {b.rooms.length} {b.rooms.length === 1 ? "room" : "rooms"}
                      , {occupied} of {beds.length} beds in use
                    </p>
                  </div>
                  <Link
                    href={`/rooms?building=${b.id}`}
                    className="text-sm font-medium text-[#3949B8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3949B8]"
                  >
                    Manage rooms
                  </Link>
                </div>

                {b.rooms.length === 0 ? (
                  <p className="mt-3 text-sm text-[#5B6784]">
                    No rooms in this building yet.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                    {b.rooms.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-lg border border-[#E3E7F0] bg-[#F7F8FB] p-2.5 ${
                          r.isActive ? "" : "opacity-50"
                        }`}
                      >
                        <div className="mb-2 text-xs font-medium text-[#5B6784]">
                          Room {r.roomNumber}
                          {!r.isActive && " (inactive)"}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.beds.map((bed) => (
                            <BedCell
                              key={bed.id}
                              status={bed.status}
                              label={bed.label}
                              title={`Room ${r.roomNumber}, bed ${bed.label}: ${STATUS[bed.status].label.toLowerCase()}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4">
      <div className="text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1.5 text-sm text-[#5B6784]">{label}</div>
    </div>
  );
}
