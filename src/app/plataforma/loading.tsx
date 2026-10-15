import { Skeleton } from "@/components/ui/misc";

export default function PlatformLoading() {
  return (
    <div className="flex flex-col gap-12" role="status" aria-label="Carregando">
      <Skeleton className="h-64 rounded-3xl" />
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((card) => (
              <Skeleton key={card} className="h-60" />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando conteúdo...</span>
    </div>
  );
}
