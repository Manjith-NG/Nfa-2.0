"use client";

import { Plus, RotateCcw } from "lucide-react";

export interface BudgetLine {
  id: string;
  particulars: string;
  amount: string;
  quantity: string;
  remarks: string;
}

function lineTotal(line: BudgetLine): number {
  const a = parseFloat(line.amount) || 0;
  const q = parseFloat(line.quantity) || 0;
  return a * q;
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
  const computedTotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);

  function updateLine(id: string, patch: Partial<BudgetLine>) {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addRow() {
    onChange([...lines, newLine()]);
  }

  function reset() {
    onChange([newLine()]);
    onGrandTotalChange("");
  }

  return (
    <section className="rounded-xl border border-nfa-border bg-white overflow-hidden">
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Particulars</th>
              <th className="px-3 py-2 text-left w-28">Amount</th>
              <th className="px-3 py-2 text-left w-24">Qty</th>
              <th className="px-3 py-2 text-left w-32">{totalLabel}</th>
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
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="nfa-input py-1.5"
                    value={line.amount}
                    onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    className="nfa-input py-1.5"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 text-slate-600 font-medium">
                  ₹{lineTotal(line).toLocaleString("en-IN")}
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

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-nfa-border px-4 py-3 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          Computed total: ₹{computedTotal.toLocaleString("en-IN")}
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Grand Total</label>
          <input
            type="number"
            className="nfa-input w-40 py-1.5"
            value={grandTotal || (computedTotal ? String(computedTotal) : "")}
            onChange={(e) => onGrandTotalChange(e.target.value)}
            placeholder="0"
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
