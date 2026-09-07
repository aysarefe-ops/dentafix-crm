import { getLeads } from "@/actions/crm/get-leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "../components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { DentaFixReportFilters } from "./components/DentaFixReportFilters";

type Lead = Awaited<ReturnType<typeof getLeads>>[number];
type DateRange = "7d" | "30d" | "month" | "all";

const dateRanges: DateRange[] = ["7d", "30d", "month", "all"];

function leadName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "İsimsiz hasta adayı";
}

function dateRangeStart(range: DateRange, now: Date) {
  if (range === "all") return null;
  const start = new Date(now);
  if (range === "month") {
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
    return start;
  }
  start.setDate(start.getDate() - (range === "7d" ? 7 : 30));
  return start;
}

function currency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

function percent(value: number, total: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(total === 0 ? 0 : value / total);
}

function statusCount(leads: Lead[], status: string) {
  return leads.filter((lead) => lead.lead_status?.name === status).length;
}

type Summary = {
  name: string;
  total: number;
  appointments: number;
  treatments: number;
  lost: number;
  quote: number;
};

function groupLeads(leads: Lead[], nameFor: (lead: Lead) => string) {
  const summaries = new Map<string, Summary>();
  for (const lead of leads) {
    const name = nameFor(lead);
    const summary = summaries.get(name) ?? {
      name,
      total: 0,
      appointments: 0,
      treatments: 0,
      lost: 0,
      quote: 0,
    };
    summary.total += 1;
    summary.quote += Number(lead.quote_amount ?? 0);
    if (lead.lead_status?.name === "Randevu Aldı") summary.appointments += 1;
    if (lead.lead_status?.name === "Tedavi Başladı") summary.treatments += 1;
    if (lead.lead_status?.name === "Kaybedildi") summary.lost += 1;
    summaries.set(name, summary);
  }
  return Array.from(summaries.values()).sort(
    (left, right) => right.total - left.total || left.name.localeCompare(right.name, "tr")
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReportTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-y border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-muted-foreground">Kayıt bulunamadı</td>
              </tr>
            ) : rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="border-b border-border/70 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="whitespace-nowrap px-4 py-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const requestedRange = resolvedParams.range;
  const range: DateRange = dateRanges.includes(requestedRange as DateRange)
    ? (requestedRange as DateRange)
    : "30d";
  const now = new Date();
  const start = dateRangeStart(range, now);
  const [allLeads, configuredStatuses] = await Promise.all([
    getLeads(),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
  ]);
  const leads = allLeads.filter(
    (lead) =>
      leadName(lead) !== "Seed Demo Lead" &&
      (!start || (lead.createdAt && new Date(lead.createdAt) >= start && new Date(lead.createdAt) <= now))
  );
  const totalQuote = leads.reduce((sum, lead) => sum + Number(lead.quote_amount ?? 0), 0);
  const appointments = statusCount(leads, "Randevu Aldı");
  const treatments = statusCount(leads, "Tedavi Başladı");
  const lost = statusCount(leads, "Kaybedildi");
  const sources = groupLeads(leads, (lead) => lead.lead_source?.name ?? "Belirtilmedi");
  const treatmentsByType = groupLeads(leads, (lead) => lead.lead_type?.name ?? "Belirtilmedi");
  const staff = groupLeads(leads, (lead) => lead.assigned_to_user?.name ?? "Atanmamış");
  const statusCounts = new Map(leads.map((lead) => [lead.lead_status?.name ?? "Durumsuz", 0]));
  for (const lead of leads) {
    const name = lead.lead_status?.name ?? "Durumsuz";
    statusCounts.set(name, (statusCounts.get(name) ?? 0) + 1);
  }
  const statusRows = [
    ...configuredStatuses.map((status) => [status.name, statusCounts.get(status.name) ?? 0]),
    ...(statusCounts.has("Durumsuz") ? [["Durumsuz", statusCounts.get("Durumsuz") ?? 0]] : []),
  ];

  return (
    <Container title="Raporlar" description="Hasta adayı, randevu ve satış performansını analiz edin.">
      <div className="space-y-6 pt-4">
        <DentaFixReportFilters activeRange={range} />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Toplam Hasta Adayı" value={leads.length} />
          <MetricCard title="Toplam Teklif Tutarı" value={currency(totalQuote)} />
          <MetricCard title="Randevu Alan" value={appointments} />
          <MetricCard title="Tedavi Başlayan" value={treatments} />
          <MetricCard title="Kaybedilen" value={lost} />
          <MetricCard title="Randevu Dönüşüm Oranı" value={percent(appointments, leads.length)} />
          <MetricCard title="Tedavi Dönüşüm Oranı" value={percent(treatments, leads.length)} />
          <MetricCard title="Ortalama Teklif Tutarı" value={currency(leads.length ? totalQuote / leads.length : 0)} />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <ReportTable
            title="Kaynak Performansı"
            headers={["Kaynak", "Hasta Adayı", "Randevu", "Tedavi Başladı", "Kaybedildi", "Toplam Teklif", "Randevu Dönüşüm %"]}
            rows={sources.map((row) => [row.name, row.total, row.appointments, row.treatments, row.lost, currency(row.quote), percent(row.appointments, row.total)])}
          />
          <ReportTable
            title="Tedavi Performansı"
            headers={["Tedavi", "Hasta Adayı", "Randevu", "Tedavi Başladı", "Toplam Teklif"]}
            rows={treatmentsByType.map((row) => [row.name, row.total, row.appointments, row.treatments, currency(row.quote)])}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <ReportTable
            title="Personel Performansı"
            headers={["Personel", "Atanmış Lead", "Randevu", "Tedavi Başladı", "Kaybedildi", "Toplam Teklif"]}
            rows={staff.map((row) => [row.name, row.total, row.appointments, row.treatments, row.lost, currency(row.quote)])}
          />
          <ReportTable title="Durum Dağılımı" headers={["Durum", "Hasta Adayı"]} rows={statusRows} />
        </section>
      </div>
    </Container>
  );
}
