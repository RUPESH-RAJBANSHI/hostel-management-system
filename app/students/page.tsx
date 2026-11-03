import Link from "next/link";
import { getStudents, setStudentActive } from "@/app/actions/students";
import { requireRole } from "@/lib/dal";

type Props = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function StudentsPage({ searchParams }: Props) {
  await requireRole("ADMIN", "WARDEN");

  const params = await searchParams;
  const search = params.search ?? "";

  const students = await getStudents(search);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student records and hostel accounts.
          </p>
        </div>

        <Link
          href="/students/new"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Register Student
        </Link>
      </div>

      <form method="GET" className="mb-6 flex gap-3">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search name, email, student code or phone..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Search
        </button>
      </form>

      <div className="mb-4 text-sm text-gray-500">
        Total students: {students.length}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Student</th>
              <th className="px-5 py-4 font-semibold">Student Code</th>
              <th className="px-5 py-4 font-semibold">Phone</th>
              <th className="px-5 py-4 font-semibold">Guardian</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">
                    {student.user.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {student.user.email}
                  </p>
                </td>

                <td className="px-5 py-4 text-gray-700">
                  {student.studentCode}
                </td>

                <td className="px-5 py-4 text-gray-700">{student.phone}</td>

                <td className="px-5 py-4">
                  <p className="text-gray-800">{student.guardianName}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {student.guardianPhone}
                  </p>
                </td>

                <td className="px-5 py-4">
                  {student.user.isActive ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                      Inactive
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/students/${student.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      View
                    </Link>

                    <Link
                      href={`/students/${student.id}/edit`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>

                    <form
                      action={async () => {
                        "use server";
                        await setStudentActive(
                          student.id,
                          !student.user.isActive,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className={`font-medium hover:underline ${
                          student.user.isActive
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {student.user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
