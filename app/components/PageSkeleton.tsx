export default function PageSkeleton() {
  const block =
    "animate-pulse rounded-xl border border-[#DDE2EC] bg-white motion-reduce:animate-none";
  const line =
    "animate-pulse rounded bg-[#DDE2EC] motion-reduce:animate-none";

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-[#3949B8]/15"
        role="progressbar"
        aria-label="Loading page"
      >
        <div className="loading-bar h-full w-1/3 bg-[#3949B8]" />
      </div>

      <header className="bg-[#16213A] text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 text-base font-semibold tracking-tight">
          Hostel Manager
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6" aria-busy="true">
        <div className="space-y-2">
          <div className={`h-7 w-64 ${line}`} />
          <div className={`h-4 w-40 ${line}`} />
        </div>

        <div className={`h-32 ${block}`} />

        <div className="grid grid-cols-3 gap-3">
          <div className={`h-20 ${block}`} />
          <div className={`h-20 ${block}`} />
          <div className={`h-20 ${block}`} />
        </div>

        <div className={`h-64 ${block}`} />
      </main>
    </>
  );
}