import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { RequestForm } from "@/components/requests/request-form";
import type { BudgetLine } from "@/components/requests/budget-line-table";

function mapBudgetLines(value: unknown): BudgetLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((line, index) => ({
    id: `line-${index}`,
    particulars: String((line as { particulars?: string }).particulars ?? ""),
    amount: String((line as { amount?: string | number }).amount ?? ""),
    quantity: String((line as { quantity?: string | number }).quantity ?? "1"),
    remarks: String((line as { remarks?: string }).remarks ?? ""),
  }));
}

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
  });

  if (!request || request.raisedById !== user.id) {
    redirect("/requests");
  }
  if (!["DRAFT", "RESEND"].includes(request.status)) {
    redirect(`/requests/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {request.status === "RESEND" ? "Edit & Resubmit Request" : "Edit Draft Request"}
        </h2>
        <p className="text-slate-500">
          {request.status === "RESEND"
            ? "Update the details below, then resubmit to the authority who sent it back."
            : "Update your draft and submit when ready."}
        </p>
      </div>
      <RequestForm
        user={user}
        editRequestId={id}
        initialEditData={{
          status: request.status as "DRAFT" | "RESEND",
          category: request.category,
          academicSectionId: request.academicSectionId,
          clubId: request.clubId,
          departmentId: request.departmentId,
          title: request.title,
          briefNote: request.briefNote,
          needForProposal: request.needForProposal,
          proposalDate: request.proposalDate?.toISOString() ?? null,
          eventStartDate: request.eventStartDate?.toISOString() ?? null,
          eventEndDate: request.eventEndDate?.toISOString() ?? null,
          links: request.links,
          naacCategory: request.naacCategory,
          metricsCategory: request.metricsCategory,
          financialDescription: request.financialDescription,
          expenditures: mapBudgetLines(request.expenditures),
          receivables: mapBudgetLines(request.receivables),
          grandTotalExpenditure: request.grandTotalExpenditure,
          grandTotalReceivable: request.grandTotalReceivable,
        }}
      />
    </div>
  );
}
