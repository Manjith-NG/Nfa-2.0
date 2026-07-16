import { Bone } from "@/components/ui/page-skeleton";

/** Lightweight loading state while the app shell is already visible. */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="nfa-card space-y-3">
            <Bone className="h-4 w-20" />
            <Bone className="h-8 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
