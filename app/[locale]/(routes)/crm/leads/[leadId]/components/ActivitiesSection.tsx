import { getActivitiesByEntity } from "@/actions/crm/activities/get-activities-by-entity";
import { ActivitiesView } from "@/components/crm/activities/ActivitiesView";

interface Props {
  leadId: string;
}

export async function ActivitiesSection({ leadId }: Props) {
  const initialData = await getActivitiesByEntity("lead", leadId);
  return (
    <ActivitiesView
      entityType="lead"
      entityId={leadId}
      initialData={initialData}
      copy={{
        title: "Aktiviteler",
        create: "Aktivite Ekle",
        empty: "Henüz aktivite yok. Arama, görüşme veya not ekleyebilirsiniz.",
      }}
    />
  );
}
