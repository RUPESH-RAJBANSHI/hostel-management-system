import { requireUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action={logout}>
          <button className="rounded border px-3 py-1 text-sm">Log out</button>
        </form>
      </div>

      <p>
        Welcome, <strong>{user.name}</strong> ({user.role})
      </p>

      {user.role !== "STUDENT" && (
        <p className="text-sm text-gray-500">
          Staff area: rooms, students and fees will appear here in the next
          steps.
        </p>
      )}
    </main>
  );
}
