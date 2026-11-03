"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

type Props = { user: { name: string; role: string } };

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/buildings", label: "Buildings" },
  { href: "/rooms", label: "Rooms" },
  { href: "/students", label: "Students", roles: ["ADMIN", "WARDEN"] },
];

// Small spinner that appears inside a link while its page is loading.
function LinkSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
    />
  );
}

export default function StaffNav({ user }: Props) {
  const pathname = usePathname();

  return (
    <header className="bg-[#16213A] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-base font-semibold tracking-tight">
            Hostel Manager
          </span>
          <nav className="flex items-center gap-1 text-sm">
            {links
              .filter((l) => !l.roles || l.roles.includes(user.role))
              .map((l) => {
                const active =
                  pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      active
                        ? "bg-white/15 font-medium text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {l.label}
                    <LinkSpinner />
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/80">
            {user.name}
            <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>
          </span>
          <form action={logout}>
            <button className="rounded-md border border-white/25 px-3 py-1.5 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
