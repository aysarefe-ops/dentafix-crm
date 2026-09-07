import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getLeads } from "@/actions/crm/get-leads";

type Lead = Awaited<ReturnType<typeof getLeads>>[number];

const timeZone = "Europe/Istanbul";
const inactiveFollowUpStatuses = new Set(["Kaybedildi", "Tedavi Başladı"]);

function localDayKey(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function leadName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "İsimsiz hasta adayı";
}

function isActiveFollowUp(lead: Lead) {
  return !inactiveFollowUpStatuses.has(lead.lead_status?.name ?? "");
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type FollowUpState = "Gecikmiş" | "Bugün" | "Yaklaşıyor";

function followUpState(value: Date | string, now: Date, today: string): FollowUpState {
  const date = new Date(value);
  if (date < now) return "Gecikmiş";
  if (localDayKey(date) === today) return "Bugün";
  return "Yaklaşıyor";
}

function FollowUpBadge({ state }: { state: FollowUpState }) {
  const className = {
    Gecikmiş: "border-destructive/40 bg-destructive/10 text-destructive",
    Bugün: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Yaklaşıyor: "border-primary/40 bg-primary/10 text-primary",
  }[state];

  return <Badge variant="outline" className={className}>{state}</Badge>;
}

function FollowUpDetails({ lead }: { lead: Lead }) {
  const details = [
    ["Telefon", lead.phone ?? "Belirtilmedi"],
    ["Tedavi", lead.lead_type?.name ?? "Belirtilmedi"],
    ["Durum", lead.lead_status?.name ?? "Belirtilmedi"],
    ["WhatsApp", lead.whatsapp_status ?? "Belirtilmedi"],
    ["Sorumlu Personel", lead.assigned_to_user?.name ?? "Atanmamış"],
  ];

  return (
    <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2 xl:grid-cols-5">
      {details.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function FollowUpList({ leads }: { leads: Lead[] }) {
  const now = new Date();
  const today = localDayKey(now);
  const followUps = leads
    .filter(
      (lead) =>
        leadName(lead) !== "Seed Demo Lead" &&
        lead.next_follow_up_at &&
        isActiveFollowUp(lead)
    )
    .sort(
      (left, right) =>
        new Date(left.next_follow_up_at!).getTime() -
        new Date(right.next_follow_up_at!).getTime()
    );
  const counts = followUps.reduce<Record<FollowUpState, number>>(
    (summary, lead) => {
      summary[followUpState(lead.next_follow_up_at!, now, today)] += 1;
      return summary;
    },
    { Gecikmiş: 0, Bugün: 0, Yaklaşıyor: 0 }
  );

  return (
    <section className="space-y-4" aria-labelledby="follow-ups-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="follow-ups-heading" className="text-lg font-semibold">Hasta Takipleri</h2>
          <p className="text-sm text-muted-foreground">Planlanan hasta takiplerini görüntüleyin.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {(["Gecikmiş", "Bugün", "Yaklaşıyor"] as const).map((state) => (
            <span key={state} className="rounded-full border border-border bg-muted/40 px-3 py-1">
              {state}: <strong>{counts[state]}</strong>
            </span>
          ))}
        </div>
      </div>

      {followUps.length === 0 ? (
        <Card className="border-border/80 bg-card">
          <CardContent className="py-6 text-sm text-muted-foreground">Planlanmış hasta takibi yok.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {followUps.map((lead) => {
            const state = followUpState(lead.next_follow_up_at!, now, today);
            return (
              <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="block">
                <Card className="border-border/80 bg-card transition-colors hover:border-primary/60 hover:bg-muted/30">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{leadName(lead)}</p>
                        <p className="text-xs text-muted-foreground">Sonraki Takip: {formatDateTime(lead.next_follow_up_at!)}</p>
                      </div>
                      <FollowUpBadge state={state} />
                    </div>
                    <FollowUpDetails lead={lead} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
