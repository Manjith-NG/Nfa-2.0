import { Bone } from "@/components/ui/page-skeleton";

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-4 w-28" />
        <Bone className="h-8 w-96 max-w-full" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Bone className="h-48 rounded-xl" />
          <Bone className="h-40 rounded-xl" />
        </div>
        <Bone className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
