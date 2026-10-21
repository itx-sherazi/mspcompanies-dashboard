"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { uploadPlaceSheet, downloadPlaceReport } from "@/services/api";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Search, RefreshCw, Download } from "lucide-react";

const TYPE_LABEL = { city: "City", state: "State", country: "Country" };

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}

/**
 * Upload box of a master sheet that fills a directory and its location pages (MSSP, cybersecurity).
 * kind: "mssp" | "cyber". label is the noun used in the messages.
 */
export default function PlaceSheet({ kind, reportName, fileHint, intro, rule, label }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [applied, setApplied] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("all");
  const fileRef = useRef(null);

  const result = applied || preview;

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (result?.rows || []).filter((r) => (type === "all" || r.type === type) && (!q || `${r.name} ${r.slug} ${r.country}`.toLowerCase().includes(q)));
  }, [result, filter, type]);

  const onPick = (e) => {
    setFile(e.target.files?.[0] || null);
    setPreview(null);
    setApplied(null);
    setConfirmText("");
  };

  const run = async (mode) => {
    if (!file) {
      toast.error("Choose the Excel file first");
      return;
    }
    setBusy(true);
    const res = await uploadPlaceSheet(kind, file, { mode });
    setBusy(false);
    if (!res.data?.ok) {
      toast.error(res.data?.message || "Upload failed");
      return;
    }
    if (res.data.ignored) {
      toast.info(res.data.message);
      return;
    }
    if (mode === "preview") {
      setPreview(res.data);
      setApplied(null);
      toast.success("Preview ready. Nothing has been saved yet.");
    } else {
      setApplied(res.data);
      setConfirmText("");
      toast.success("Sheet applied");
    }
  };

  const downloadReport = async () => {
    if (!file) return;
    setReporting(true);
    const res = await downloadPlaceReport(kind, file, reportName);
    setReporting(false);
    if (res.data?.ok) toast.success("Report downloaded");
    else toast.error(res.data?.message || "Report failed");
  };

  const canApply = Boolean(preview) && !applied && confirmText.trim() === "APPLY" && !busy;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">{intro}</p>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-800">1. Choose the file</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <FileSpreadsheet className="h-4 w-4" />
            {file ? file.name : fileHint}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onPick} className="hidden" />
          </label>
          {file ? <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span> : null}
        </div>

        <p className="mt-4 text-xs text-gray-500">{rule}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => run("preview")}
            disabled={busy || !file}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0356A6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#024486] disabled:opacity-50"
          >
            {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {busy ? "Working..." : "2. Preview (nothing is saved)"}
          </button>
          <button
            onClick={downloadReport}
            disabled={reporting || busy || !file}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {reporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {reporting ? "Preparing report..." : "Download report (Excel)"}
          </button>
        </div>
      </div>

      {result ? (
        <>
          {applied ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Applied in {(applied.tookMs / 1000).toFixed(1)} s</p>
                <p>
                  {applied.pages.total} pages saved. Directory: {applied.directory.added} added, {applied.directory.updated} updated, {applied.directory.kept} left as they were.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Sheet rows" value={result.sheet.sheetRows} sub={`${result.sheet.kept} kept, ${result.sheet.skippedDuplicates} duplicates skipped`} />
            <Stat label="Directory" value={`${result.directory.before} to ${result.directory.after}`} sub={`${result.directory.added} added, ${result.directory.updated} updated, ${result.directory.kept} unchanged`} />
            <Stat label="Index eligible (Y)" value={(result.sheet.indexEligible ?? 0).toLocaleString()} sub={`${(result.sheet.withFaq ?? 0).toLocaleString()} companies have FAQs`} />
            <Stat label="Pages" value={result.pages.total} sub={`${result.pages.country} country, ${result.pages.state} state, ${result.pages.city} city`} />
          </div>

          {result.warnings?.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> {result.warnings.length} things to check
              </p>
              <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-800">Pages</p>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search a page"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
              <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                <option value="all">All types</option>
                <option value="country">Country</option>
                <option value="state">State</option>
                <option value="city">City</option>
              </select>
              <span className="text-xs text-gray-500">{rows.length} shown</span>
            </div>
            <div className="max-h-[480px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Page</th>
                    <th className="px-4 py-2">URL</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Country</th>
                    <th className="px-4 py-2 text-right">Companies</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.slug} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {r.name}
                        {r.state ? <span className="ml-2 text-xs font-normal text-gray-500">{r.state}</span> : null}
                      </td>
                      <td className="px-4 py-2 text-gray-500">{r.url}</td>
                      <td className="px-4 py-2 text-gray-600">{TYPE_LABEL[r.type] || r.type}</td>
                      <td className="px-4 py-2 text-gray-600">{r.country}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{r.companies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!applied ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-900">3. Apply to the live data</p>
              <p className="mt-1 text-sm text-red-800">
                This adds {result.directory.added} and updates {result.directory.updated} companies in the {label} directory (it will hold {result.directory.after}) and saves {result.pages.total} pages. Nothing is deleted. No backup copy is kept, so this cannot be undone.
                Type <b>APPLY</b> to continue.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="APPLY"
                  className="w-32 rounded-lg border border-red-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => run("apply")}
                  disabled={!canApply}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  <Upload className="h-4 w-4" /> Apply {label} sheet
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
