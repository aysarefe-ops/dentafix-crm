"use client";

import { z } from "zod";
import {
  patientLeadFormFields,
  whatsappStatuses,
  toLeadDateTimeValue,
} from "@/lib/crm/lead-patient-fields";
import { useEffect } from "react";
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
import { createLead } from "@/actions/crm/leads/create-lead";
import { useSession } from "@/lib/auth-client";

//TODO: fix all the types
type ConfigItem = { id: string; name: string };

type NewTaskFormProps = {
  accounts: any[];
  leadSources: ConfigItem[];
  leadStatuses: ConfigItem[];
  leadTypes: ConfigItem[];
  accountId?: string;
  onFinish?: () => void;
};

export function NewLeadForm({ leadSources, leadStatuses, leadTypes, accountId, onFinish }: NewTaskFormProps) {
  const { data: session } = useSession();

  const formSchema = z.object({
    ...patientLeadFormFields,
    first_name: z.string().optional(),
    last_name: z.string().min(1, "Soyad zorunludur").max(30),
    email: z.string().email("Geçerli bir e-posta adresi girin").or(z.literal("")).optional(),
    phone: z.string().min(0).max(15).optional(),
    description: z.string().optional(),
    lead_source_id: z.string().optional(),
    lead_status_id: z.string().optional(),
    lead_type_id: z.string().optional(),
    assigned_to: z.string().optional(),
    accountIDs: z.string().optional(),
  });

  type NewLeadFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      whatsapp_status: "",
      last_contact_at: "",
      next_follow_up_at: "",
      quote_amount: "",
      appointment_at: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      description: "",
      lead_source_id: "",
      lead_status_id: "",
      lead_type_id: "",
      assigned_to: "",
      accountIDs: accountId ?? "",
    },
  });

  useEffect(() => {
    const uid = session?.user?.id;
    if (uid && !form.getValues("assigned_to")) form.setValue("assigned_to", uid);
  }, [session, form]);

  const onSubmit = async (data: NewLeadFormValues) => {
    const result = await createLead({
      ...data,
      last_contact_at: toLeadDateTimeValue(data.last_contact_at),
      next_follow_up_at: toLeadDateTimeValue(data.next_follow_up_at),
      appointment_at: toLeadDateTimeValue(data.appointment_at),
    });
    if (result?.error) {
      form.setError("root.serverError", { message: result.error });
    } else {
      toast.success("Hasta adayı oluşturuldu");
      form.reset();
      onFinish?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-4 md:px-10">
        <div className="w-full text-sm">
          <div className="pb-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Johny"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soyad</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Walker"
                        {...field}
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
                        // Safari shows today's date as a placeholder even when the value is empty.
                        className={!field.value ? "text-transparent focus:text-foreground" : undefined}
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
                        // Safari shows today's date as a placeholder even when the value is empty.
                        className={!field.value ? "[&:not(:focus)::-webkit-datetime-edit]:opacity-0" : undefined}
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
                        // Safari shows today's date as a placeholder even when the value is empty.
                        className={!field.value ? "[&:not(:focus)::-webkit-datetime-edit]:opacity-0" : undefined}
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
          <Button disabled={form.formState.isSubmitting} type="submit" data-testid="lead-submit-btn">
            {form.formState.isSubmitting ? (
              <span className="flex items-center animate-pulse">
                Kaydediliyor…
              </span>
            ) : (
              "Hasta Adayı Oluştur"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
