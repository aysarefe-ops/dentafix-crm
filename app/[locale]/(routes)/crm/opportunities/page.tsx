import { Suspense } from "react";

import Container from "../../components/ui/Container";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { LeadPipeline } from "../leads/components/LeadPipeline";

const PipelinePage = async () => {
  const crmData = await getAllCrmData();
  const leads = await getLeads();

  return (
    <Container
      title="Pipeline"
      description="Hasta adaylarını satış sürecine göre yönetin."
    >
      <Suspense fallback={null}>
        <LeadPipeline leads={leads} statuses={crmData.leadStatuses} />
      </Suspense>
    </Container>
  );
};

export default PipelinePage;
