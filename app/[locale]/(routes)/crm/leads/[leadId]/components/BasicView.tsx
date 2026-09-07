import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Stethoscope,
  User,
  Users,
} from "lucide-react";

import { prismadb } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadDetailActions } from "./LeadDetailActions";

const timeZone = "Europe/Istanbul";

function display(value: string | null | undefined) {
  return value || "—";
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

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

type FollowUpState = "Gecikmiş" | "Bugün" | "Yaklaşıyor";

function followUpState(value: Date | string): FollowUpState {
  const now = new Date();
  const date = new Date(value);
  if (date < now) return "Gecikmiş";
  if (localDayKey(date) === localDayKey(now)) return "Bugün";
  return "Yaklaşıyor";
}

function FollowUpBadge({ value }: { value: Date | string | null | undefined }) {
  if (!value) return null;
  const state = followUpState(value);
  const className = {
    Gecikmiş: "border-destructive/40 bg-destructive/10 text-destructive",
    Bugün: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Yaklaşıyor: "border-primary/40 bg-primary/10 text-primary",
  }[state];

  return <Badge variant="outline" className={className}>{state}</Badge>;
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-md border border-border/70 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="break-words text-sm">{children}</div>
      </div>
    </div>
  );
}

interface LeadViewProps {
  data: any;
}

export async function BasicView({ data }: LeadViewProps) {
  if (!data) return <div>Hasta adayı bulunamadı.</div>;

  const [leadSources, leadStatuses, leadTypes] = await Promise.all([
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
  ]);
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "İsimsiz hasta adayı";
  const quoteAmount = data.quote_amount == null
    ? "—"
    : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(data.quote_amount));

  return (
    <div className="space-y-5 pb-3">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <CardTitle className="text-lg">{fullName}</CardTitle>
          <LeadDetailActions
            lead={data}
            leadSources={leadSources}
            leadStatuses={leadStatuses}
            leadTypes={leadTypes}
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DetailField icon={User} label="Ad Soyad">{fullName}</DetailField>
            <DetailField icon={Phone} label="Telefon">
              {data.phone ? <Link href={`tel:${data.phone}`} className="hover:underline">{data.phone}</Link> : "—"}
            </DetailField>
            <DetailField icon={Mail} label="E-posta">
              {data.email ? <Link href={`mailto:${data.email}`} className="hover:underline">{data.email}</Link> : "—"}
            </DetailField>
            <DetailField icon={FileText} label="Hasta Notu">{display(data.description)}</DetailField>
            <DetailField icon={Users} label="Kaynak">{display(data.lead_source?.name)}</DetailField>
            <DetailField icon={Users} label="Durum">{display(data.lead_status?.name)}</DetailField>
            <DetailField icon={Stethoscope} label="Tedavi İlgisi">{display(data.lead_type?.name)}</DetailField>
            <DetailField icon={User} label="Sorumlu Personel">{display(data.assigned_to_user?.name)}</DetailField>
            <DetailField icon={MessageCircle} label="WhatsApp Durumu">{display(data.whatsapp_status)}</DetailField>
            <DetailField icon={Clock3} label="Son Görüşme">{formatDateTime(data.last_contact_at)}</DetailField>
            <DetailField icon={Clock3} label="Sonraki Takip">
              <div className="flex flex-wrap items-center gap-2">
                <span>{formatDateTime(data.next_follow_up_at)}</span>
                <FollowUpBadge value={data.next_follow_up_at} />
              </div>
            </DetailField>
            <DetailField icon={CircleDollarSign} label="Teklif Tutarı">{quoteAmount}</DetailField>
            <DetailField icon={CalendarDays} label="Randevu Tarihi">{formatDateTime(data.appointment_at)}</DetailField>
          </section>

          <section className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <DetailField icon={CalendarDays} label="Oluşturulma Tarihi">{formatDate(data.createdAt)}</DetailField>
            <DetailField icon={User} label="Oluşturan">{display(data.created_by_user?.name)}</DetailField>
            <DetailField icon={CalendarDays} label="Son Güncelleme">{formatDate(data.updatedAt)}</DetailField>
            <DetailField icon={User} label="Son Güncelleyen">{display(data.updated_by_user?.name)}</DetailField>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
