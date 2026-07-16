import { requireUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { WorkflowTemplateManager } from "@/components/flow-control/workflow-template-manager";
import { SectionManager } from "@/components/flow-control/section-manager";
import { listActiveClubs } from "@/lib/services/club-service";
import { listActiveAcademicSections } from "@/lib/services/academic-section-service";

export default async function FlowControlPage() {
  const user = await requireUser();
  if (!hasPermission(user, "flow:control")) {
    redirect("/dashboard");
  }

  const [initialClubs, initialAcademicSections] = await Promise.all([
    listActiveClubs(),
    listActiveAcademicSections(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Flow Control</h2>
        <p className="text-slate-500">
          Configure approval workflows per academic section or club. Each flow applies to one
          section/club, or one All default — add IQAC, PMSEB, HR, COE before Registrar and final clearance.
        </p>
      </div>
      <SectionManager
        initialClubs={initialClubs}
        initialAcademicSections={initialAcademicSections}
      />
      <WorkflowTemplateManager
        initialClubs={initialClubs}
        initialAcademicSections={initialAcademicSections}
      />
    </div>
  );
}
