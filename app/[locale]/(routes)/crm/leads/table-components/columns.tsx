"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Lead } from "../table-data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

type ConfigItem = { id: string; name: string };

const formatDateTime = (value: Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(value)
    : "—";

export const createColumns = (
  leadSources: ConfigItem[],
  leadStatuses: ConfigItem[],
  leadTypes: ConfigItem[],
): ColumnDef<Lead>[] => [
  {
    id: "patient",
    accessorFn: (lead) => [lead.firstName, lead.lastName].filter(Boolean).join(" "),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hasta" />,
    cell: ({ row }) => (
      <Link
        href={`/crm/leads/${row.original.id}`}
        className="font-medium hover:underline"
        data-testid="lead-row-name"
      >
        {[row.original.firstName, row.original.lastName].filter(Boolean).join(" ")}
      </Link>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Telefon" />,
    cell: ({ row }) => row.original.phone || "—",
    enableHiding: false,
  },
  {
    accessorKey: "company",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    cell: ({ row }) => String(row.getValue("company") || "—"),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expected Close" />
    ),
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: "lead_source",
    accessorFn: (lead) => lead.lead_source?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kaynak" />,
    cell: ({ row }) => row.original.lead_source?.name || "—",
  },
  {
    id: "lead_type",
    accessorFn: (lead) => lead.lead_type?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tedavi İlgisi" />,
    cell: ({ row }) => row.original.lead_type?.name || "—",
  },
  {
    id: "lead_status",
    accessorFn: (lead) => lead.lead_status?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Durum" />,
    cell: ({ row }) => row.original.lead_status?.name
      ? <Badge variant="secondary">{row.original.lead_status.name}</Badge>
      : "—",
  },
  {
    accessorKey: "whatsapp_status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="WhatsApp" />,
    cell: ({ row }) => row.original.whatsapp_status
      ? <Badge variant="outline">{row.original.whatsapp_status}</Badge>
      : "—",
  },
  {
    accessorKey: "next_follow_up_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sonraki Takip" />,
    cell: ({ row }) => formatDateTime(row.original.next_follow_up_at),
  },
  {
    accessorKey: "appointment_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Randevu" />,
    cell: ({ row }) => formatDateTime(row.original.appointment_at),
  },
  {
    id: "assigned_to_user",
    accessorFn: (lead) => lead.assigned_to_user?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sorumlu" />,
    cell: ({ row }) => row.original.assigned_to_user?.name || "—",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        leadSources={leadSources}
        leadStatuses={leadStatuses}
        leadTypes={leadTypes}
      />
    ),
  },
];
