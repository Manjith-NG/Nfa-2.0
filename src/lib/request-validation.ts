import type { BudgetLine } from "@/components/requests/budget-line-table";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function validateProposalAndEventDates(
  proposalDate: string | undefined,
  eventStartDate: string | undefined,
  eventEndDate: string | undefined,
  submit: boolean
): string | null {
  if (!submit) return null;

  if (!proposalDate?.trim()) {
    return "Proposal date is required when submitting a request";
  }
  if (!eventStartDate?.trim()) {
    return "Event start date is required when submitting a request";
  }

  const proposal = parseDateOnly(proposalDate);
  const eventStart = parseDateOnly(eventStartDate);

  if (Number.isNaN(proposal.getTime()) || Number.isNaN(eventStart.getTime())) {
    return "Please enter valid proposal and event dates";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (proposal < today) {
    return "Proposal date cannot be in the past";
  }

  const minEventStart = new Date(proposal.getTime() + MS_PER_DAY);
  if (eventStart < minEventStart) {
    return "Event start date must be at least one day after the proposal date";
  }

  if (eventEndDate?.trim()) {
    const eventEnd = parseDateOnly(eventEndDate);
    if (Number.isNaN(eventEnd.getTime())) {
      return "Please enter a valid event end date";
    }
    if (eventEnd < eventStart) {
      return "Event end date cannot be before event start date";
    }
  }

  return null;
}

export function validateRequestFormFields(
  fields: {
    briefNote: string;
    needForProposal: string;
    proposalDate?: string;
    eventStartDate?: string;
    eventEndDate?: string;
    submit: boolean;
  },
  budgetLines: { expenditures: BudgetLine[]; receivables: BudgetLine[] }
): string | null {
  if (!fields.submit) return null;

  if (!fields.briefNote.trim()) {
    return "Brief note of your proposal is required";
  }
  if (!fields.needForProposal.trim()) {
    return "Need for proposal is required";
  }

  const dateError = validateProposalAndEventDates(
    fields.proposalDate,
    fields.eventStartDate,
    fields.eventEndDate,
    true
  );
  if (dateError) return dateError;

  return null;
}

export function validateApprovalRemarks(remarks: string | undefined): string | null {
  if (!remarks?.trim()) {
    return "Remarks are required for all approval actions";
  }
  return null;
}
