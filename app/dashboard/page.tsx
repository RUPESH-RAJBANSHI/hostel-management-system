import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import StaffNav from "@/app/components/StaffNav";
import { requireUser } from "@/lib/dal";
import { redirect } from "next/navigation";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

const STATUS: Record<BedStatus, { label: string; bar: string }> = {
  AVAILABLE: { label: "Available", bar: "#14907F" },
  OCCUPIED: { label: "Occupied", bar: "#3949B8" },
  MAINTENANCE: { label: "Maintenance", bar: "#D9962B" },
};

function bedClasses(status: BedStatus) {
  if (status === "OCCUPIED") {
    return "border-[#3949B8] bg-[#3949B8] text-white";
  }

  if (status === "MAINTENANCE") {
    return "border-[#D9962B] text-[#6B4608]";
  }

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

function formatDate(date: Date | null) {
  if (!date) return "Not provided";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(amount: number) {
  return `NPR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusClass(status: string) {
  switch (status) {
    case "PAID":
    case "RESOLVED":
    case "CLOSED":
    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "PARTIAL":
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700";

    case "OVERDUE":
    case "OPEN":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        allocations: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            startDate: "desc",
          },
          take: 1,
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
        },
        fees: {
          orderBy: {
            dueDate: "asc",
          },
          include: {
            payments: {
              orderBy: {
                paidAt: "desc",
              },
            },
          },
        },
        complaints: {
          orderBy: {
            createdAt: "desc",
          },
        },
        leaveRequests: {
          orderBy: {
            createdAt: "desc",
          },
        },
        visitors: {
          orderBy: {
            checkIn: "desc",
          },
        },
      },
    });

    if (!student) {
      return (
        <main className="min-h-screen bg-[#F7F8FC] p-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Student Profile Not Found
            </h1>
            <p className="mt-2 text-gray-500">
              Your account exists, but no student profile is connected to it.
              Please contact your hostel administrator.
            </p>
            <form action={logout} className="mt-5">
              <button className="rounded-lg bg-indigo-600 px-5 py-2 text-white">
                Log out
              </button>
            </form>
          </div>
        </main>
      );
    }

    const allocation = student.allocations[0];
    const room = allocation?.bed.room;
    const building = room?.building;

    const totalFees = student.fees.reduce(
      (total, fee) => total + Number(fee.amount),
      0,
    );

    const totalPaid = student.fees.reduce(
      (total, fee) =>
        total +
        fee.payments.reduce(
          (paymentTotal, payment) => paymentTotal + Number(payment.amount),
          0,
        ),
      0,
    );

    const outstanding = Math.max(0, totalFees - totalPaid);

    const firstName = user.name.split(" ")[0];

    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <main className="min-h-screen bg-[#F7F8FC]">
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#17143A]">
                My Hostel
              </h1>
              <p className="text-xs text-[#5B6784]">Student Portal</p>
            </div>
            <form action={logout}>
              <button className="rounded-lg border border-[#DDE2EC] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Log out
              </button>
            </form>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-7">
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-[#17143A]">
              Welcome back, {firstName}!
            </h2>
            <p className="mt-1 text-sm text-[#5B6784]">
              {today} · Here is your hostel information.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Student Code"
              value={student.studentCode}
              subtitle="Your identification"
              color="indigo"
            />
            <DashboardCard
              title="Room Number"
              value={room?.roomNumber ?? "Not assigned"}
              subtitle={building?.name ?? "No building assigned"}
              color="blue"
            />
            <DashboardCard
              title="Total Paid"
              value={money(totalPaid)}
              subtitle="Recorded payments"
              color="green"
            />
            <DashboardCard
              title="Outstanding Fees"
              value={money(outstanding)}
              subtitle="Remaining balance"
              color="orange"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
                My Room Details
              </h3>

              {allocation && room ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Info label="Building" value={building?.name ?? "-"} />
                    <Info label="Room Number" value={room.roomNumber} />
                    <Info label="Floor" value={String(room.floor)} />
                    <Info label="Bed Number" value={allocation.bed.label} />
                  </div>

                  <ReadMore>
                    <div className="grid grid-cols-2 gap-4">
                      <Info label="Room Type" value={room.type} />
                      <Info
                        label="Monthly Rent"
                        value={money(Number(room.monthlyRent))}
                      />
                      <Info
                        label="Allocation Date"
                        value={formatDate(allocation.startDate)}
                      />
                      <Info
                        label="Check-in Date"
                        value={formatDate(student.checkInDate)}
                      />
                    </div>

                    {room.amenities.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Amenities
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {room.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full bg-[#F0EEFF] px-3 py-1.5 text-xs font-medium text-[#5145CD]"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </ReadMore>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="font-medium text-yellow-800">
                    No room assigned yet
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    Please contact your hostel administrator to get a room and
                    bed allocation.
                  </p>
                </div>
              )}
            </div>

            <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
                My Personal Information
              </h3>

              <div className="mt-4 space-y-4">
                <Info label="Full Name" value={user.name} />
                <Info label="Email Address" value={user.email} />
                <Info label="Student Code" value={student.studentCode} />
              </div>

              <ReadMore>
                <div className="space-y-4">
                  <Info label="Phone Number" value={student.phone} />
                  <Info
                    label="Date of Birth"
                    value={formatDate(student.dateOfBirth)}
                  />
                  <Info label="Gender" value={student.gender ?? "-"} />
                  <Info
                    label="Institution"
                    value={student.institution ?? "-"}
                  />
                  <Info label="Address" value={student.address ?? "-"} />
                </div>
              </ReadMore>
            </div>

            <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
                Guardian Information
              </h3>

              <div className="mt-4">
                <Info label="Guardian Name" value={student.guardianName} />
              </div>

              <ReadMore>
                <div className="space-y-4">
                  <Info label="Guardian Phone" value={student.guardianPhone} />
                  <Info
                    label="Relationship"
                    value={student.guardianRelation ?? "-"}
                  />
                </div>
              </ReadMore>
            </div>
          </section>

          <section className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
                  My Fees & Payments
                </h3>
                <p className="text-sm text-gray-500">
                  Your hostel fee records and payment history.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Outstanding Balance</p>
                <p className="text-xl font-bold text-orange-600">
                  {money(outstanding)}
                </p>
              </div>
            </div>

            {student.fees.length === 0 ? (
              <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No fee records are available yet.
              </p>
            ) : (
              <>
                <div className="mt-5 overflow-x-auto">
                  <FeeTable fees={student.fees.slice(0, 2)} />
                </div>

                {student.fees.length > 2 && (
                  <ReadMore>
                    <div className="overflow-x-auto">
                      <FeeTable fees={student.fees.slice(2)} />
                    </div>
                  </ReadMore>
                )}
              </>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info label="Total Fees" value={money(totalFees)} />
              <Info label="Total Paid" value={money(totalPaid)} />
              <Info label="Remaining Balance" value={money(outstanding)} />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
                My Complaints
              </h3>

              {student.complaints.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  You have not submitted any complaints.
                </p>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {student.complaints.slice(0, 2).map((complaint) => (
                      <ComplaintItem key={complaint.id} complaint={complaint} />
                    ))}
                  </div>

                  {student.complaints.length > 2 && (
                    <ReadMore>
                      <div className="space-y-3">
                        {student.complaints.slice(2).map((complaint) => (
                          <ComplaintItem
                            key={complaint.id}
                            complaint={complaint}
                          />
                        ))}
                      </div>
                    </ReadMore>
                  )}
                </>
              )}
            </div>

            <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
                My Leave Requests
              </h3>

              {student.leaveRequests.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  You have not submitted any leave requests.
                </p>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {student.leaveRequests.slice(0, 2).map((request) => (
                      <LeaveItem key={request.id} request={request} />
                    ))}
                  </div>

                  {student.leaveRequests.length > 2 && (
                    <ReadMore>
                      <div className="space-y-3">
                        {student.leaveRequests.slice(2).map((request) => (
                          <LeaveItem key={request.id} request={request} />
                        ))}
                      </div>
                    </ReadMore>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-lg font-bold tracking-tight text-[#17143A]">
              Recent Visitors
            </h3>

            {student.visitors.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No visitor records available.
              </p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <VisitorTable visitors={student.visitors.slice(0, 2)} />
                </div>

                {student.visitors.length > 2 && (
                  <ReadMore>
                    <div className="overflow-x-auto">
                      <VisitorTable visitors={student.visitors.slice(2)} />
                    </div>
                  </ReadMore>
                )}
              </>
            )}
          </section>

          <footer className="pb-5 text-center text-xs font-medium tracking-wide text-gray-400">
            Hostel Management System · Student Portal
          </footer>
        </div>
      </main>
    );
  }

  if (user.role !== "ADMIN" && user.role !== "WARDEN") {
    redirect("/login");
  }

  const [
    buildings,
    totalStudents,
    totalFees,
    totalCollections,
    openComplaints,
    pendingLeaves,
    recentStudents,
    recentPayments,
  ] = await Promise.all([
    prisma.building.findMany({
      orderBy: { name: "asc" },
      include: {
        rooms: {
          orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
          include: {
            beds: {
              orderBy: { label: "asc" },
            },
          },
        },
      },
    }),

    prisma.student.count(),

    prisma.fee.aggregate({
      _sum: { amount: true },
    }),

    prisma.payment.aggregate({
      _sum: { amount: true },
    }),

    prisma.complaint.count({
      where: { status: "OPEN" },
    }),

    prisma.leaveRequest.count({
      where: { status: "PENDING" },
    }),

    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 5,
      include: {
        fee: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const feeAmount = Number(totalFees._sum.amount ?? 0);
  const collectedAmount = Number(totalCollections._sum.amount ?? 0);
  const allRooms = buildings.flatMap((b) => b.rooms);
  const allBeds = allRooms.flatMap((r) => r.beds);

  const count = (status: BedStatus) =>
    allBeds.filter((bed) => bed.status === status).length;

  const counts = {
    AVAILABLE: count("AVAILABLE"),
    OCCUPIED: count("OCCUPIED"),
    MAINTENANCE: count("MAINTENANCE"),
  };

  const totalBeds = allBeds.length;

  const occupancy = totalBeds
    ? Math.round((counts.OCCUPIED / totalBeds) * 100)
    : 0;

  const activeRooms = allRooms.filter((room) => room.isActive).length;

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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Total Students"
            value={totalStudents}
            subtitle="Registered students"
            color="indigo"
          />

          <DashboardCard
            title="Total Fees"
            value={money(feeAmount)}
            subtitle="Total recorded fees"
            color="blue"
          />

          <DashboardCard
            title="Total Collections"
            value={money(collectedAmount)}
            subtitle="Payments received"
            color="green"
          />

          <DashboardCard
            title="Open Complaints"
            value={openComplaints}
            subtitle="Awaiting resolution"
            color="orange"
          />

          <DashboardCard
            title="Pending Leaves"
            value={pendingLeaves}
            subtitle="Awaiting approval"
            color="indigo"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[#DDE2EC] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Recent Students</h2>
                <p className="mt-1 text-xs text-[#5B6784]">
                  Latest student registrations
                </p>
              </div>

              <Link
                href="/students"
                className="text-sm font-medium text-[#3949B8] hover:underline"
              >
                View all
              </Link>
            </div>

            {recentStudents.length === 0 ? (
              <p className="mt-5 text-sm text-[#5B6784]">
                No students registered yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentStudents.slice(0, 3).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F8FB] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#17143A]">
                        {student.user.name}
                      </p>
                      <p className="truncate text-xs text-[#5B6784]">
                        {student.studentCode} · {student.user.email}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-[#77718F]">
                      {formatDate(student.createdAt)}
                    </span>
                  </div>
                ))}

                {recentStudents.length > 3 && (
                  <ReadMore>
                    {recentStudents.slice(3).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F8FB] p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#17143A]">
                            {student.user.name}
                          </p>
                          <p className="truncate text-xs text-[#5B6784]">
                            {student.studentCode} · {student.user.email}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-[#77718F]">
                          {formatDate(student.createdAt)}
                        </span>
                      </div>
                    ))}
                  </ReadMore>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#DDE2EC] bg-white p-5">
            <div>
              <h2 className="font-semibold">Recent Payments</h2>
              <p className="mt-1 text-xs text-[#5B6784]">
                Latest payments received
              </p>
            </div>

            {recentPayments.length === 0 ? (
              <p className="mt-5 text-sm text-[#5B6784]">
                No payments recorded yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentPayments.slice(0, 3).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F8FB] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#17143A]">
                        {payment.fee.student.user.name}
                      </p>
                      <p className="truncate text-xs text-[#5B6784]">
                        {payment.fee.title} · {payment.method.replace("_", " ")}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-green-700">
                        {money(Number(payment.amount))}
                      </p>
                      <p className="text-xs text-[#77718F]">
                        {formatDate(payment.paidAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {recentPayments.length > 3 && (
                  <ReadMore>
                    {recentPayments.slice(3).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F8FB] p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#17143A]">
                            {payment.fee.student.user.name}
                          </p>
                          <p className="truncate text-xs text-[#5B6784]">
                            {payment.fee.title} ·{" "}
                            {payment.method.replace("_", " ")}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-green-700">
                            {money(Number(payment.amount))}
                          </p>
                          <p className="text-xs text-[#77718F]">
                            {formatDate(payment.paidAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ReadMore>
                )}
              </div>
            )}
          </div>
        </section>

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
                  (status) =>
                    counts[status] > 0 && (
                      <div
                        key={status}
                        style={{
                          flexGrow: counts[status],
                          backgroundColor: STATUS[status].bar,
                        }}
                      />
                    ),
                )}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-4">
                {(Object.keys(STATUS) as BedStatus[]).map((status) => (
                  <div key={status} className="flex items-center gap-3">
                    <BedCell status={status} size="h-6 w-6" />
                    <div>
                      <dd className="text-xl font-semibold leading-none">
                        {counts[status]}
                      </dd>
                      <dt className="mt-1 text-xs text-[#5B6784]">
                        {STATUS[status].label}
                      </dt>
                    </div>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        <section className="grid grid-cols-3 divide-x divide-[#DDE2EC] rounded-xl border border-[#DDE2EC] bg-white">
          <Figure label="Buildings" value={buildings.length} />
          <Figure label="Active rooms" value={activeRooms} />
          <Figure label="Total beds" value={totalBeds} />
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold">Bed map</h2>
            <div className="flex flex-wrap gap-4 text-xs text-[#5B6784]">
              {(Object.keys(STATUS) as BedStatus[]).map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <BedCell status={status} size="h-4 w-4" />
                  {STATUS[status].label}
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

          {buildings.map((building) => {
            const beds = building.rooms.flatMap((room) => room.beds);
            const occupied = beds.filter(
              (bed) => bed.status === "OCCUPIED",
            ).length;

            return (
              <article
                key={building.id}
                className="rounded-xl border border-[#DDE2EC] bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{building.name}</h3>
                    <p className="text-xs text-[#5B6784]">
                      {building.floors}{" "}
                      {building.floors === 1 ? "floor" : "floors"},{" "}
                      {building.rooms.length}{" "}
                      {building.rooms.length === 1 ? "room" : "rooms"},{" "}
                      {occupied} of {beds.length} beds in use
                    </p>
                  </div>

                  <Link
                    href={`/rooms?building=${building.id}`}
                    className="text-sm font-medium text-[#3949B8] hover:underline"
                  >
                    Manage rooms
                  </Link>
                </div>

                {building.rooms.length === 0 ? (
                  <p className="mt-3 text-sm text-[#5B6784]">
                    No rooms in this building yet.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                    {building.rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`rounded-lg border border-[#E3E7F0] bg-[#F7F8FB] p-2.5 ${
                          room.isActive ? "" : "opacity-50"
                        }`}
                      >
                        <div className="mb-2 text-xs font-medium text-[#5B6784]">
                          Room {room.roomNumber}
                          {!room.isActive && " (inactive)"}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {room.beds.map((bed) => (
                            <BedCell
                              key={bed.id}
                              status={bed.status}
                              label={bed.label}
                              title={`Room ${room.roomNumber}, bed ${bed.label}: ${STATUS[bed.status].label.toLowerCase()}`}
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

function ReadMore({ children }: { children: ReactNode }) {
  return (
    <details className="read-more mt-4 border-t border-gray-100 pt-3">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg bg-[#F0EEFF] px-4 py-2 text-sm font-semibold text-[#5145CD] transition-colors hover:bg-[#E5DFFF]">
        <span className="read-more-label">Read More</span>
        <span className="read-less-label">Read Less</span>
        <span aria-hidden="true">⌄</span>
      </summary>

      <div className="mt-4 space-y-4">{children}</div>

      <style>{`
        .read-more[open] > summary .read-more-label {
          display: none;
        }

        .read-more:not([open]) > summary .read-less-label {
          display: none;
        }

        .read-more > summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </details>
  );
}

function FeeTable({ fees }: { fees: Array<any> }) {
  return (
    <table className="w-full min-w-[650px] text-left text-sm">
      <thead className="bg-[#F5F3FF] text-[#5145CD]">
        <tr>
          <th className="p-3">Fee Title</th>
          <th className="p-3">Amount</th>
          <th className="p-3">Paid</th>
          <th className="p-3">Balance</th>
          <th className="p-3">Due Date</th>
          <th className="p-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {fees.map((fee) => {
          const paid = fee.payments.reduce(
            (sum: number, payment: { amount: unknown }) =>
              sum + Number(payment.amount),
            0,
          );

          const balance = Math.max(0, Number(fee.amount) - paid);

          return (
            <tr key={fee.id} className="transition-colors hover:bg-[#FAF9FF]">
              <td className="p-3 font-medium text-gray-800">{fee.title}</td>
              <td className="p-3">{money(Number(fee.amount))}</td>
              <td className="p-3 text-green-700">{money(paid)}</td>
              <td className="p-3 text-orange-700">{money(balance)}</td>
              <td className="p-3">{formatDate(fee.dueDate)}</td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                    fee.status,
                  )}`}
                >
                  {fee.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ComplaintItem({ complaint }: { complaint: any }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#FAF9FF] p-4 transition-colors hover:border-[#C6B8FF]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-gray-800">{complaint.title}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs ${statusClass(
            complaint.status,
          )}`}
        >
          {complaint.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{complaint.description}</p>
      <p className="mt-2 text-xs text-gray-400">
        {formatDate(complaint.createdAt)} · Priority: {complaint.priority}
      </p>
      {complaint.resolution && (
        <p className="mt-2 text-sm text-green-700">
          Resolution: {complaint.resolution}
        </p>
      )}
    </div>
  );
}

function LeaveItem({ request }: { request: any }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#FAF9FF] p-4 transition-colors hover:border-[#C6B8FF]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-gray-800">{request.reason}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs ${statusClass(
            request.status,
          )}`}
        >
          {request.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {formatDate(request.fromDate)} – {formatDate(request.toDate)}
      </p>
    </div>
  );
}

function VisitorTable({ visitors }: { visitors: Array<any> }) {
  return (
    <table className="w-full min-w-[500px] text-left text-sm">
      <thead className="bg-[#F5F3FF] text-[#5145CD]">
        <tr>
          <th className="p-3">Visitor Name</th>
          <th className="p-3">Relationship</th>
          <th className="p-3">Purpose</th>
          <th className="p-3">Check-in</th>
          <th className="p-3">Check-out</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {visitors.map((visitor) => (
          <tr key={visitor.id} className="transition-colors hover:bg-[#FAF9FF]">
            <td className="p-3 font-medium">{visitor.name}</td>
            <td className="p-3">{visitor.relation ?? "-"}</td>
            <td className="p-3">{visitor.purpose ?? "-"}</td>
            <td className="p-3">{formatDate(visitor.checkIn)}</td>
            <td className="p-3">{formatDate(visitor.checkOut)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#FAF9FF] p-3 transition-colors hover:border-[#C6B8FF]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77718F]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-semibold text-[#17143A]">
        {value}
      </p>
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  color: "indigo" | "blue" | "green" | "orange";
};

function DashboardCard({ title, value, subtitle, color }: DashboardCardProps) {
  const colors: Record<DashboardCardProps["color"], string> = {
    indigo: "border-l-indigo-500",
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    orange: "border-l-orange-500",
  };

  return (
    <div
      className={`rounded-xl border border-[#DDE2EC] border-l-4 ${colors[color]} bg-white p-4`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 break-words text-xl font-bold text-[#16213A]">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </div>
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
