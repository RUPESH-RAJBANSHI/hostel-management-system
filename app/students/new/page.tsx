import Link from "next/link";
import StudentForm from "@/app/components/StudentForm";
import { requireRole } from "@/lib/dal";

export default async function NewStudentPage() {
  await requireRole("ADMIN", "WARDEN");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/students"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to Students
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Register New Student
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Enter student and guardian information below.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <StudentForm mode="create" />
      </div>
    </main>
  );
}
