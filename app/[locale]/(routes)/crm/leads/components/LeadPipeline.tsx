"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { updateLead } from "@/actions/crm/leads/update-lead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeadStatus = { id: string; name: string };
type Lead = any;

type PipelineColumn = {
  id: string;
  name: string;
  statusId: string | null;
  leads: Lead[];
};

const unassignedColumnId = "unassigned";
const preferredStatusOrder = [
  "Yeni Lead",
  "Arandı",
  "Görüşülüyor",
  "Ulaşılamadı",
  "Fiyat Verildi",
  "Takip Edilecek",
  "Randevu Aldı",
  "Gelmedi",
  "Tedavi Başladı",
  "Kaybedildi",
];

function leadName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ");
}

function buildColumns(leads: Lead[], statuses: LeadStatus[]): PipelineColumn[] {
  const orderedStatuses = [...statuses].sort((left, right) => {
    const leftIndex = preferredStatusOrder.indexOf(left.name);
    const rightIndex = preferredStatusOrder.indexOf(right.name);
    if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name, "tr");
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
  const columns = orderedStatuses.map((status) => ({
    id: `status:${status.id}`,
    name: status.name,
    statusId: status.id,
    leads: leads.filter((lead) => lead.lead_status_id === status.id),
  }));
  const unassignedLeads = leads.filter(
    (lead) => !lead.lead_status_id || !statuses.some((status) => status.id === lead.lead_status_id),
  );

  return unassignedLeads.length
    ? [...columns, { id: unassignedColumnId, name: "Durumsuz", statusId: null, leads: unassignedLeads }]
    : columns;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function LeadDetails({ lead }: { lead: Lead }) {
  const rows = [
    ["Telefon", lead.phone],
    ["Tedavi", lead.lead_type?.name],
    ["Kaynak", lead.lead_source?.name],
    ["WhatsApp", lead.whatsapp_status],
    ["Teklif", lead.quote_amount == null ? null : `${lead.quote_amount} ₺`],
    ["Takip", formatDate(lead.next_follow_up_at)],
    ["Sorumlu", lead.assigned_to_user?.name],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <span>{label}</span>
          <span className="max-w-[11rem] truncate text-right text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lead:${lead.id}`,
  });
  const fullName = leadName(lead) || "İsimsiz hasta adayı";

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
      className="group cursor-pointer border-border/80 bg-card shadow-sm transition-colors hover:border-primary/60"
      onClick={() => onOpen(lead.id)}
      {...attributes}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
        <CardTitle className="text-sm font-semibold leading-5">{fullName}</CardTitle>
        <button
          type="button"
          aria-label={`${fullName} kartını taşı`}
          className="cursor-grab rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          onClick={(event) => event.stopPropagation()}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <LeadDetails lead={lead} />
      </CardContent>
    </Card>
  );
}

function PipelineColumn({ column, onOpen }: { column: PipelineColumn; onOpen: (id: string) => void }) {
  const { setNodeRef } = useDroppable({ id: column.id, disabled: column.statusId === null });

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/35" aria-label={column.name}>
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold">{column.name}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{column.leads.length}</span>
      </header>
      <div ref={setNodeRef} className="min-h-28 space-y-2 overflow-y-auto p-2" data-testid={`pipeline-column-${column.statusId ?? "unassigned"}`}>
        <SortableContext items={column.leads.map((lead) => `lead:${lead.id}`)} strategy={verticalListSortingStrategy}>
          {column.leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpen} />)}
        </SortableContext>
        {column.leads.length === 0 && column.statusId && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Hasta adayı yok</p>}
      </div>
    </section>
  );
}

export function LeadPipeline({ leads, statuses }: { leads: Lead[]; statuses: LeadStatus[] }) {
  const router = useRouter();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const columns = useMemo(
    () => buildColumns(
      leads
        .filter((lead) => leadName(lead) !== "Seed Demo Lead")
        .map((lead) => ({ ...lead, lead_status_id: statusOverrides[lead.id] ?? lead.lead_status_id })),
      statuses,
    ),
    [leads, statuses, statusOverrides],
  );
  const columnByLeadId = useMemo(
    () => new Map(columns.flatMap((column) => column.leads.map((lead) => [lead.id, column]))),
    [columns],
  );

  const persistStatus = async (lead: Lead, statusId: string) => {
    const result = await updateLead({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      company: lead.company,
      jobTitle: lead.jobTitle,
      email: lead.email,
      phone: lead.phone,
      description: lead.description,
      lead_source_id: lead.lead_source_id,
      lead_status_id: statusId,
      lead_type_id: lead.lead_type_id,
      refered_by: lead.refered_by,
      campaign: lead.campaign,
      assigned_to: lead.assigned_to,
      accountIDs: lead.accountsIDs,
      whatsapp_status: lead.whatsapp_status ?? "",
      last_contact_at: lead.last_contact_at ?? "",
      next_follow_up_at: lead.next_follow_up_at ?? "",
      quote_amount: lead.quote_amount == null ? "" : String(lead.quote_amount),
      appointment_at: lead.appointment_at ?? "",
    });

    if (result?.error) throw new Error(result.error);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveLead(null);
    if (!over) return;

    const leadId = String(active.id).replace("lead:", "");
    const sourceColumn = columnByLeadId.get(leadId);
    const destinationColumn = columns.find((column) => column.id === over.id)
      ?? columnByLeadId.get(String(over.id).replace("lead:", ""));
    if (!sourceColumn || !destinationColumn || !destinationColumn.statusId || sourceColumn.id === destinationColumn.id) return;

    const lead = sourceColumn.leads.find((item) => item.id === leadId);
    if (!lead) return;
    const previousOverrides = statusOverrides;
    setStatusOverrides((current) => ({ ...current, [leadId]: destinationColumn.statusId! }));

    try {
      await persistStatus(lead, destinationColumn.statusId);
      toast.success("Hasta adayı durumu güncellendi");
      router.refresh();
    } catch (error) {
      setStatusOverrides(previousOverrides);
      toast.error(error instanceof Error ? error.message : "Durum güncellenemedi");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveLead(columnByLeadId.get(String(active.id).replace("lead:", ""))?.leads.find((lead) => lead.id === String(active.id).replace("lead:", "")) ?? null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex min-h-[34rem] gap-3">
          {columns.map((column) => <PipelineColumn key={column.id} column={column} onOpen={(id) => router.push(`/crm/leads/${id}`)} />)}
        {columns.length === 0 && <p className="py-10 text-sm text-muted-foreground">Pipeline için henüz durum tanımlanmadı.</p>}
      </div>
      </div>
      <DragOverlay>{activeLead ? <div className="w-72"><LeadDetails lead={activeLead} /></div> : null}</DragOverlay>
    </DndContext>
  );
}
