"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const filters = [
  ["7d", "Son 7 Gün"],
  ["30d", "Son 30 Gün"],
  ["month", "Bu Ay"],
  ["all", "Tüm Zamanlar"],
] as const;

export function DentaFixReportFilters({ activeRange }: { activeRange: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectRange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2" aria-label="Rapor tarih aralığı">
      {filters.map(([range, label]) => (
        <Button
          key={range}
          type="button"
          size="sm"
          variant={activeRange === range ? "default" : "outline"}
          onClick={() => selectRange(range)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
