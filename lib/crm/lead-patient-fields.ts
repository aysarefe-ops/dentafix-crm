import { z } from "zod";
import { serializeDecimals } from "@/lib/serialize-decimals";

export const whatsappStatuses = [
  "Yeni",
  "Mesaj Gönderildi",
  "Yanıt Bekleniyor",
  "Görüşülüyor",
  "Tamamlandı",
] as const;

const quotePattern = /^\d{1,16}(\.\d{1,2})?$/;
const quoteMessage = "En fazla 16 tam ve 2 ondalık basamak içeren pozitif bir tutar girin.";
const whatsappStatus = z.enum(whatsappStatuses).or(z.literal(""));
const localDateTime = z.iso.datetime({ local: true }).or(z.literal(""));

// Inputs stay strings in React Hook Form; convert local times at submission.
export const patientLeadFormFields = {
  whatsapp_status: whatsappStatus.optional(),
  last_contact_at: localDateTime.optional(),
  next_follow_up_at: localDateTime.optional(),
  quote_amount: z.string().refine(
    (value) => value === "" || quotePattern.test(value),
    quoteMessage,
  ).optional(),
  appointment_at: localDateTime.optional(),
};

const optionalDate = z.union([z.date(), z.iso.datetime({ offset: true }), z.literal("")])
  .nullish()
  .transform((value) => value === "" ? null : typeof value === "string" ? new Date(value) : value);

export const patientLeadSchema = z.object({
  whatsapp_status: whatsappStatus.nullish().transform((value) => value === "" ? null : value),
  last_contact_at: optionalDate,
  next_follow_up_at: optionalDate,
  quote_amount: z.union([z.string(), z.number()]).nullish()
    .transform((value) => value === "" ? null : value == null ? value : String(value))
    .pipe(z.string().regex(quotePattern, quoteMessage).nullish()),
  appointment_at: optionalDate,
});

export type PatientLeadInput = z.input<typeof patientLeadSchema>;

export function toLeadDateTimeInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, -1);
}

export function toLeadDateTimeValue(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === "" ? null : new Date(value).toISOString();
}

// Keep all lead data serializable, preserving the full Decimal(18,2) precision.
export function serializeLead<T extends { quote_amount?: { toString(): string } | null }>(lead: T) {
  return serializeDecimals({
    ...lead,
    quote_amount: lead.quote_amount == null ? lead.quote_amount : lead.quote_amount.toString(),
  });
}
