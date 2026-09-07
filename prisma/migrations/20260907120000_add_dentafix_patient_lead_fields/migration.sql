-- Optional patient workflow fields; existing lead records remain valid.
ALTER TABLE "crm_Leads"
    ADD COLUMN "whatsapp_status" TEXT,
    ADD COLUMN "last_contact_at" TIMESTAMP(3),
    ADD COLUMN "next_follow_up_at" TIMESTAMP(3),
    ADD COLUMN "quote_amount" DECIMAL(18,2),
    ADD COLUMN "appointment_at" TIMESTAMP(3);
