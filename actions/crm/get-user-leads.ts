import { serializeLead } from "@/lib/crm/lead-patient-fields";
import { prismadb } from "@/lib/prisma";

export const getUserLeads = async (userId: string) => {
  const data = await prismadb.crm_Leads.findMany({
    where: {
      assigned_to: userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data.map(serializeLead);
};
