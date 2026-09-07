"use client";

import { z } from "zod";
import {
  patientLeadFormFields,
  whatsappStatuses,
  toLeadDateTimeInput,
  toLeadDateTimeValue,
} from "@/lib/crm/lead-patient-fields";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { updateLead } from "@/actions/crm/leads/update-lead";

//TODO: fix all the types
type ConfigItem = { id: string; name: string };

type NewTaskFormProps = {
  initialData: any;
  setOpen: (value: boolean) => void;
  leadSources: ConfigItem[];
  leadStatuses: ConfigItem[];
  leadTypes: ConfigItem[];
};

export function UpdateLeadForm({ initialData, setOpen, leadSources, leadStatuses, leadTypes }: NewTaskFormProps) {

  const formSchema = z.object({
    ...patientLeadFormFields,
    id: z.uuid(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().min(1, "Soyad zorunludur").max(30),
    company: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
    email: z.string().email("Geçerli bir e-posta adresi girin").nullable().optional().or(z.literal("")),
    phone: z.string().min(0).max(15).nullable().optional(),
    description: z.string().nullable().optional(),
    lead_source_id: z.string().nullable().optional(),
    lead_status_id: z.string().nullable().optional(),
    lead_type_id: z.string().nullable().optional(),
    refered_by: z.string().optional().nullable(),
    //TODO: add campaing schema from db as data source
    campaign: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    accountsIDs: z.string().optional().nullable(),
  });

  type NewLeadFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      ...initialData,
      whatsapp_status: initialData?.whatsapp_status ?? "",
      last_contact_at: toLeadDateTimeInput(initialData?.last_contact_at).slice(0, 16),
      next_follow_up_at: toLeadDateTimeInput(initialData?.next_follow_up_at).slice(0, 16),
      quote_amount: initialData?.quote_amount == null ? "" : String(initialData.quote_amount),
      appointment_at: toLeadDateTimeInput(initialData?.appointment_at).slice(0, 16),
      lead_source_id: initialData?.lead_source_id ?? "",
      lead_status_id: initialData?.lead_status_id ?? "",
      lead_type_id: initialData?.lead_type_id ?? "",
    },
  });

  const onSubmit = async (data: NewLeadFormValues) => {
    const result = await updateLead({
      ...data,
      last_contact_at: toLeadDateTimeValue(data.last_contact_at),
      next_follow_up_at: toLeadDateTimeValue(data.next_follow_up_at),
      appointment_at: toLeadDateTimeValue(data.appointment_at),
      lead_source_id: data.lead_source_id ?? undefined,
      lead_status_id: data.lead_status_id ?? undefined,
      lead_type_id: data.lead_type_id ?? undefined,
      assigned_to: data.assigned_to ?? undefined,
      accountIDs: data.accountsIDs ?? undefined,
    });
    if (result?.error) {
      form.setError("root.serverError", { message: result.error });
    } else {
      toast.success("Hasta adayı güncellendi");
      setOpen(false);
    }
  };

  if (!initialData)
    return <div>Bir hata oluştu</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-4 md:px-10">
        <div className="w-full text-sm">
          <div className="pb-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Johny"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soyad</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Walker"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="johny@domain.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="+11 123 456 789"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasta Notu</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={form.formState.isSubmitting}
                      placeholder="Hasta ile ilgili notlar"
                      {...field}
                        value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_source_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaynak</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Kaynak seçin…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="lead_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tedavi İlgisi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Tedavi ilgisi seçin…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sorumlu Personel</FormLabel>
                    <FormControl>
                      <UserSearchCombobox
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Personel seçin…"
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lead_status_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Durum seçin…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="whatsapp_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Durumu</FormLabel>
                    <Select
                      value={field.value || "__none"}
                      onValueChange={(value) => field.onChange(value === "__none" ? "" : value)}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="WhatsApp durumu seçin…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">Belirtilmedi</SelectItem>
                        {whatsappStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_contact_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Son Görüşme</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        step="60"
                        disabled={form.formState.isSubmitting}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="next_follow_up_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sonraki Takip</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        step="60"
                        disabled={form.formState.isSubmitting}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quote_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teklif Tutarı</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01" min="0" max="9999999999999999.99"
                        disabled={form.formState.isSubmitting}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="appointment_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Randevu Tarihi</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        step="60"
                        disabled={form.formState.isSubmitting}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <div className="grid gap-2 py-5">
          {form.formState.errors.root?.serverError && (
            <p className="text-sm text-destructive" aria-live="polite">
              {form.formState.errors.root.serverError.message}
            </p>
          )}
          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? (
              <span className="flex items-center animate-pulse">
                Kaydediliyor…
              </span>
            ) : (
              "Hasta Adayını Güncelle"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
