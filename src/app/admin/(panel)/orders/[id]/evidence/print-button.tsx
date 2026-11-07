"use client";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="min-h-11 cursor-pointer rounded-md border border-gray-400 px-4 text-sm font-semibold print:hidden">Print / Save as PDF</button>;
}
