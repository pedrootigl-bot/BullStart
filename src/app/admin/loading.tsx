import { Skeleton } from "@/components/ui/misc";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
