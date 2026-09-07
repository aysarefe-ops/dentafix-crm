import React from "react";
import Container from "../../components/ui/Container";
import { getTasks } from "@/actions/projects/get-tasks";
import { getLeads } from "@/actions/crm/get-leads";
import { TasksDataTable } from "./components/data-table";
import { columns } from "./components/columns";
import NewTaskDialog from "../dialogs/NewTask";
import { FollowUpList } from "./components/FollowUpList";

const TasksPage = async () => {
  const [tasks, leads] = await Promise.all([getTasks(), getLeads()]);

  return (
    <Container
      title="Görevler"
      description="Hasta takiplerini ve ekip görevlerini yönetin."
    >
      <div className="space-y-8 py-5">
        <FollowUpList leads={leads} />
        <section className="space-y-4 border-t border-border pt-8" aria-labelledby="manual-tasks-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="manual-tasks-heading" className="text-lg font-semibold">Manuel Görevler</h2>
              <p className="text-sm text-muted-foreground">Ekip için oluşturulan görevleri yönetin.</p>
            </div>
            <NewTaskDialog showProjectField={false} />
          </div>
          <TasksDataTable data={tasks as any} columns={columns} />
        </section>
      </div>
    </Container>
  );
};

export default TasksPage;
