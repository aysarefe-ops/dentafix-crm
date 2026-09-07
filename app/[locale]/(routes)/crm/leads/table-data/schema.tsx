import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
// Display schema — must mirror what the DB can actually hold, not entry
// validation: dates are nullable columns, and lastName has no length
// constraint (2-char surnames and long names are valid data).
export const leadSchema = z.object({
  id: z.string(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp_status: z.string().optional().nullable(),
  next_follow_up_at: z.date().optional().nullable(),
  appointment_at: z.date().optional().nullable(),
  quote_amount: z.string().optional().nullable(),
  lead_source: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  lead_status: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  lead_type: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  assigned_to_user: z.object({
    id: z.string().optional(),
    name: z.string().optional().nullable(),
  }).optional().nullable(),
}).passthrough();

export type Lead = z.infer<typeof leadSchema>;
