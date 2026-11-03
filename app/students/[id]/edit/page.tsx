import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { updateStudent } from "@/app/actions/students";

interface EditStudentPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDateForInput(date: Date | null) {
  if (!date) return "";

  return date.toISOString().split("T")[0];
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const labelClass = "block text-sm font-medium text-gray-700";

export default async function EditStudentPage({
  params,
}: EditStudentPageProps) {
  await requireRole("ADMIN", "WARDEN");

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  async function handleUpdate(formData: FormData): Promise<void> {
    "use server";

    await updateStudent({}, formData);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/students/${student.id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to Student Details
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">Edit Student</h1>

        <p className="mt-1 text-sm text-gray-500">
          Update the student's personal and guardian information.
        </p>
      </div>

      <form
        action={handleUpdate}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="studentId" value={student.id} />

        <section>
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={student.user.name}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={student.user.email}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="studentCode">
                Student Code *
              </label>
              <input
                id="studentCode"
                name="studentCode"
                required
                defaultValue={student.studentCode}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="phone">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                required
                defaultValue={student.phone}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={formatDateForInput(student.dateOfBirth)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={student.gender ?? ""}
                className={inputClass}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="institution">
                Institution
              </label>
              <input
                id="institution"
                name="institution"
                defaultValue={student.institution ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="address">
                Address
              </label>
              <input
                id="address"
                name="address"
                defaultValue={student.address ?? ""}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        <section>
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Guardian Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="guardianName">
                Guardian Name *
              </label>
              <input
                id="guardianName"
                name="guardianName"
                required
                defaultValue={student.guardianName}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="guardianPhone">
                Guardian Phone *
              </label>
              <input
                id="guardianPhone"
                name="guardianPhone"
                required
                defaultValue={student.guardianPhone}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="guardianRelation">
                Relationship
              </label>
              <input
                id="guardianRelation"
                name="guardianRelation"
                defaultValue={student.guardianRelation ?? ""}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        <section>
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Hostel Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="checkInDate">
                Check-in Date
              </label>
              <input
                id="checkInDate"
                name="checkInDate"
                type="date"
                defaultValue={formatDateForInput(student.checkInDate)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="checkOutDate">
                Check-out Date
              </label>
              <input
                id="checkOutDate"
                type="date"
                value={formatDateForInput(student.checkOutDate)}
                readOnly
                className={`${inputClass} bg-gray-100`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Check-out date is not currently editable through the update
                action.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/students/${student.id}`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Update Student
          </button>
        </div>
      </form>
    </main>
  );
}
