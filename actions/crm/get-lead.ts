import { serializeLead } from "@/lib/crm/lead-patient-fields";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  assertCanReadLead,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getLead = async (leadId: string) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    throw e;
  }

  try {
    await assertCanReadLead(user, leadId);
  } catch (e) {
    if (e instanceof AuthorizationError) return null;
    throw e;
  }

  const data = await prismadb.crm_Leads.findFirst({
    where: {
      id: leadId,
      deletedAt: null,
    },
    include: {
      // Include FK relation name fields
      lead_source: { select: { id: true, name: true } },
      lead_status: { select: { id: true, name: true } },
      lead_type:   { select: { id: true, name: true } },
      // Include assigned user (uses "LeadAssignedTo" relation)
      assigned_to_user: {
        select: {
          id: true,
          name: true,
        },
      },
      // Include assigned accounts
      assigned_accounts: true,
      // Include documents through DocumentsToLeads junction table
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
              document_type: true,
              document_file_url: true,
              document_file_mimeType: true,
              createdAt: true,
              created_by: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!data) return null;

  const metadataUserIds = [data.createdBy, data.updatedBy].filter(
    (id): id is string => Boolean(id)
  );
  const metadataUsers = metadataUserIds.length
    ? await prismadb.users.findMany({
        where: { id: { in: metadataUserIds } },
        select: { id: true, name: true },
      })
    : [];
  const userById = new Map(
    metadataUsers.map((metadataUser) => [metadataUser.id, metadataUser])
  );

  return serializeLead({
    ...data,
    created_by_user: data.createdBy
      ? userById.get(data.createdBy) ?? null
      : null,
    updated_by_user: data.updatedBy
      ? userById.get(data.updatedBy) ?? null
      : null,
  });
};
