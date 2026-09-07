import Link from "next/link";
import {
  Banknote,
  BellRing,
  CalendarCheck,
  CalendarDays,
  MessageCircle,
  PhoneCall,
  Stethoscope,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

import { getSession } from "@/lib/auth-server";
import { getLeads } from "@/actions/crm/get-leads";
import Container from "./components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Lead = Awaited<ReturnType<typeof getLeads>>[number];

const timeZone = "Europe/Istanbul";

function localDayKey(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
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

function leadName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "İsimsiz hasta adayı";
}

function statusCount(leads: Lead[], status: string) {
  return leads.filter((lead) => lead.lead_status?.name === status).length;
}

function distribution(leads: Lead[], key: "lead_source" | "lead_type") {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const name = lead[key]?.name ?? "Belirtilmedi";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort(([leftName, leftCount], [rightName, rightCount]) => rightCount - leftCount || leftName.localeCompare(rightName, "tr"));
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof Users }) {
  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function DistributionCard({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz veri yok.</p>
        ) : items.map(([name, count]) => (
          <div key={name} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">{count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const DashboardPage = async () => {
  const session = await getSession();
  if (!session) return null;

  const allLeads = await getLeads();
  const leads = allLeads.filter((lead) => leadName(lead) !== "Seed Demo Lead");
  const today = localDayKey(new Date());
  const now = new Date();
  const totalQuote = leads.reduce((sum, lead) => sum + Number(lead.quote_amount ?? 0), 0);
  const staff = new Map<string, { total: number; appointments: number; treatments: number }>();

  for (const lead of leads) {
    const name = lead.assigned_to_user?.name;
    if (!name) continue;
    const summary = staff.get(name) ?? { total: 0, appointments: 0, treatments: 0 };
    summary.total += 1;
    if (lead.lead_status?.name === "Randevu Aldı") summary.appointments += 1;
    if (lead.lead_status?.name === "Tedavi Başladı") summary.treatments += 1;
    staff.set(name, summary);
  }

  const upcomingFollowUps = leads
    .filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at) >= now)
    .sort((left, right) => new Date(left.next_follow_up_at!).getTime() - new Date(right.next_follow_up_at!).getTime())
    .slice(0, 5);
  const metrics = [
    ["Toplam Hasta Adayı", leads.length, Users],
    ["Bugün Gelen", leads.filter((lead) => lead.createdAt && localDayKey(lead.createdAt) === today).length, UserPlus],
    ["Yeni Lead", statusCount(leads, "Yeni Lead"), PhoneCall],
    ["Görüşülüyor", statusCount(leads, "Görüşülüyor"), MessageCircle],
    ["Randevu Aldı", statusCount(leads, "Randevu Aldı"), CalendarCheck],
    ["Tedavi Başladı", statusCount(leads, "Tedavi Başladı"), Stethoscope],
    ["Takip Bekleyen", statusCount(leads, "Takip Edilecek"), BellRing],
    ["Bugünkü Randevular", leads.filter((lead) => lead.appointment_at && localDayKey(lead.appointment_at!) === today).length, CalendarDays],
    ["Toplam Teklif", new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(totalQuote), Banknote],
  ] as const;

  return (
    <Container title="Dashboard" description="DentaFIX hasta adayı ve satış süreci özeti">
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(([title, value, icon]) => <MetricCard key={title} title={title} value={value} icon={icon} />)}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <DistributionCard title="Kaynak Dağılımı" items={distribution(leads, "lead_source")} />
          <DistributionCard title="Tedavi Dağılımı" items={distribution(leads, "lead_type")} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personel Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.size === 0 ? (
                <p className="text-sm text-muted-foreground">Atanmış hasta adayı yok.</p>
              ) : Array.from(staff.entries()).sort(([left], [right]) => left.localeCompare(right, "tr")).map(([name, summary]) => (
                <div key={name} className="rounded-md border border-border/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium"><UserRound className="size-4 text-muted-foreground" />{name}</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><p className="text-base font-semibold">{summary.total}</p><p className="text-muted-foreground">Atanmış</p></div>
                    <div><p className="text-base font-semibold">{summary.appointments}</p><p className="text-muted-foreground">Randevu</p></div>
                    <div><p className="text-base font-semibold">{summary.treatments}</p><p className="text-muted-foreground">Tedavi</p></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Yaklaşan Takipler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Yaklaşan takip yok.</p>
              ) : upcomingFollowUps.map((lead) => (
                <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="block rounded-md border border-border/70 p-3 transition-colors hover:bg-muted/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{leadName(lead)}</p><p className="truncate text-xs text-muted-foreground">{lead.lead_type?.name ?? "Tedavi belirtilmedi"} · {lead.assigned_to_user?.name ?? "Sorumlu atanmadı"}</p></div>
                    <time className="shrink-0 text-xs text-muted-foreground">{formatDateTime(lead.next_follow_up_at!)}</time>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </Container>
  );
};

export default DashboardPage;
