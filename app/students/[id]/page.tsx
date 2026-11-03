import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

interface StudentPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(date: Date | null) {
  if (!date) return "Not provided";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default async function StudentDetailsPage({ params }: StudentPageProps) {
  await requireRole("ADMIN", "WARDEN");

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/students"
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back to Students
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Student Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View complete student information.
          </p>
        </div>

        <Link
          href={`/students/${student.id}/edit`}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Edit Student
        </Link>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Account Information
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                student.user.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {student.user.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem label="Full Name" value={student.user.name} />
            <InfoItem label="Email Address" value={student.user.email} />
            <InfoItem label="Student Code" value={student.studentCode} />
            <InfoItem label="Phone Number" value={student.phone} />
          </div>
        </section>

        {/* Personal Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Date of Birth"
              value={formatDate(student.dateOfBirth)}
            />

            <InfoItem label="Gender" value={student.gender} />

            <InfoItem label="Institution" value={student.institution} />

            <InfoItem label="Address" value={student.address} />
          </div>
        </section>

        {/* Guardian Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Guardian Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem label="Guardian Name" value={student.guardianName} />

            <InfoItem label="Guardian Phone" value={student.guardianPhone} />

            <InfoItem label="Relationship" value={student.guardianRelation} />
          </div>
        </section>

        {/* Hostel Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Hostel Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Check-in Date"
              value={formatDate(student.checkInDate)}
            />

            <InfoItem
              label="Check-out Date"
              value={formatDate(student.checkOutDate)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
