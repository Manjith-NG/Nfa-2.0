import { Bone } from "@/components/ui/page-skeleton";
import { BrandLogo } from "@/components/layout/brand-logo";
import { APP_NAME } from "@/lib/constants";

/** Shown while session/auth resolves — keeps layout stable during navigation. */
export function AppShellFallback() {
  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r border-nfa-border bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-nfa-border px-4">
          <BrandLogo size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-nfa-primary">{APP_NAME}</p>
            <Bone className="mt-1 h-2 w-24" />
          </div>
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <div className="ml-[var(--sidebar-width)]">
        <div className="flex h-16 items-center justify-between border-b border-nfa-border bg-white px-6">
          <Bone className="h-6 w-40" />
          <Bone className="h-9 w-32 rounded-full" />
        </div>
        <main className="p-6">
          <Bone className="h-8 w-56" />
          <Bone className="mt-2 h-4 w-72" />
        </main>
      </div>
    </div>
  );
}
