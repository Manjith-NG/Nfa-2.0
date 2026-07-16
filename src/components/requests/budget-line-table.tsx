"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";

export interface BudgetLine {
  id: string;
  particulars: string;
  amount: string;
  quantity: string;
  remarks: string;
}

export function lineTotal(line: BudgetLine): number {
  const a = parseFloat(line.amount) || 0;
  const q = parseFloat(line.quantity) || 0;
  return a * q;
}

export function sumBudgetLines(lines: BudgetLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

function newLine(): BudgetLine {
  return {
    id: crypto.randomUUID(),
    particulars: "",
    amount: "",
    quantity: "1",
    remarks: "",
  };
}

function AmountInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "" || /^[0-9]*\.?[0-9]*$/.test(next)) {
          onChange(next);
        }
      }}
      placeholder="0"
    />
  );
}

function BudgetLineFields({
  line,
  totalLabel,
  remarksRequired,
  onUpdate,
}: {
  line: BudgetLine;
  totalLabel: string;
  remarksRequired: boolean;
  onUpdate: (patch: Partial<BudgetLine>) => void;
}) {
  const remarksNeeded =
    remarksRequired &&
    Boolean(
      line.particulars.trim() ||
        (parseFloat(line.amount) || 0) > 0 ||
        (parseFloat(line.quantity) || 0) > 0
    );

  return (
    <div className="space-y-3">
      <div>
        <label className="nfa-label">Particulars</label>
        <input
          className="nfa-input py-2"
          value={line.particulars}
          onChange={(e) => onUpdate({ particulars: e.target.value })}
          placeholder="Item description"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="nfa-label">Amount</label>
          <AmountInput
            className="nfa-input py-2"
            value={line.amount}
            onChange={(value) => onUpdate({ amount: value })}
          />
        </div>
        <div>
          <label className="nfa-label">Qty</label>
          <AmountInput
            className="nfa-input py-2"
            value={line.quantity}
            onChange={(value) => onUpdate({ quantity: value })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">{totalLabel}</span>
        <span className="font-semibold text-slate-800">
          Rs. {lineTotal(line).toLocaleString("en-IN")}
        </span>
      </div>
      <div>
        <label className="nfa-label">
          Remarks{remarksRequired && <span className="text-red-500"> *</span>}
        </label>
        <input
          className="nfa-input py-2"
          value={line.remarks}
          onChange={(e) => onUpdate({ remarks: e.target.value })}
          placeholder={remarksRequired ? "Required when line has data" : undefined}
          required={remarksNeeded}
        />
      </div>
    </div>
  );
}

export function BudgetLineTable({
  title,
  totalLabel,
  lines,
  onChange,
  grandTotal,
  onGrandTotalChange,
  remarksRequired = false,
}: {
  title: string;
  totalLabel: string;
  lines: BudgetLine[];
  onChange: (lines: BudgetLine[]) => void;
  grandTotal: string;
  onGrandTotalChange: (v: string) => void;
  remarksRequired?: boolean;
}) {
  const computedTotal = sumBudgetLines(lines);
  const [grandTotalManual, setGrandTotalManual] = useState(Boolean(grandTotal));

  useEffect(() => {
    if (!grandTotalManual) {
      onGrandTotalChange(computedTotal > 0 ? String(computedTotal) : "");
    }
  }, [computedTotal, grandTotalManual, onGrandTotalChange]);

  function updateLine(id: string, patch: Partial<BudgetLine>) {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addRow() {
    onChange([...lines, newLine()]);
  }

  function reset() {
    onChange([newLine()]);
    setGrandTotalManual(false);
    onGrandTotalChange("");
  }

  return (
    <section className="overflow-hidden rounded-xl border border-nfa-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-nfa-border bg-slate-50 px-4 py-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <div className="flex gap-2">
          <button type="button" className="nfa-btn-secondary py-1.5 text-xs" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </button>
          <button type="button" className="nfa-btn-secondary py-1.5 text-xs" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {lines.map((line, index) => (
          <div key={line.id} className="rounded-lg border border-nfa-border bg-slate-50/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Line {index + 1}
            </p>
            <BudgetLineFields
              line={line}
              totalLabel={totalLabel}
              remarksRequired={remarksRequired}
              onUpdate={(patch) => updateLine(line.id, patch)}
            />
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Particulars</th>
              <th className="w-28 px-3 py-2 text-left">Amount</th>
              <th className="w-24 px-3 py-2 text-left">Qty</th>
              <th className="w-32 px-3 py-2 text-left">{totalLabel}</th>
              <th className="px-3 py-2 text-left">
                Remarks{remarksRequired && <span className="text-red-500"> *</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-t border-nfa-border">
                <td className="px-2 py-2">
                  <input
                    className="nfa-input py-1.5"
                    value={line.particulars}
                    onChange={(e) => updateLine(line.id, { particulars: e.target.value })}
                    placeholder="Item description"
                  />
                </td>
                <td className="px-2 py-2">
                  <AmountInput
                    className="nfa-input py-1.5"
                    value={line.amount}
                    onChange={(value) => updateLine(line.id, { amount: value })}
                  />
                </td>
                <td className="px-2 py-2">
                  <AmountInput
                    className="nfa-input py-1.5"
                    value={line.quantity}
                    onChange={(value) => updateLine(line.id, { quantity: value })}
                  />
                </td>
                <td className="px-2 py-2 font-medium text-slate-600">
                  Rs. {lineTotal(line).toLocaleString("en-IN")}
                </td>
                <td className="px-2 py-2">
                  <input
                    className="nfa-input py-1.5"
                    value={line.remarks}
                    onChange={(e) => updateLine(line.id, { remarks: e.target.value })}
                    placeholder={remarksRequired ? "Required for every line with data" : undefined}
                    required={
                      remarksRequired &&
                      Boolean(
                        line.particulars.trim() ||
                          (parseFloat(line.amount) || 0) > 0 ||
                          (parseFloat(line.quantity) || 0) > 0
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-nfa-border bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Computed total: Rs. {computedTotal.toLocaleString("en-IN")}
        </p>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <label className="shrink-0 text-sm font-medium text-slate-700">Grand Total</label>
          <AmountInput
            className="nfa-input w-full py-1.5 sm:w-40"
            value={grandTotal}
            onChange={(value) => {
              setGrandTotalManual(true);
              onGrandTotalChange(value);
            }}
          />
        </div>
      </div>
    </section>
  );
}

export function createDefaultLines(): BudgetLine[] {
  return [newLine()];
}

export function serializeLines(lines: BudgetLine[]) {
  return lines
    .filter((l) => l.particulars.trim())
    .map((l) => ({
      particulars: l.particulars,
      amount: parseFloat(l.amount) || 0,
      quantity: parseFloat(l.quantity) || 0,
      remarks: l.remarks || undefined,
    }));
}
