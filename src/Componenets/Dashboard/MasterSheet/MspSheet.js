"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { uploadMasterSheet, downloadMasterReport } from "@/services/api";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Search, RefreshCw, Download } from "lucide-react";

const KIND_LABEL = { city: "City", state: "State", country: "Country", skip: "Not covered" };

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}

export default function MspSheet() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [metro, setMetro] = useState(false);
  const [createPages, setCreatePages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [preview, setPreview] = useState(null); // result of the last preview
  const [applied, setApplied] = useState(null); // result of the last apply
  const [confirmText, setConfirmText] = useState("");
  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState("all");

  const result = applied || preview;

  const rows = useMemo(() => {
    const list = result?.rows || [];
    const q = filter.trim().toLowerCase();
    return list.filter((r) => (kind === "all" || r.kind === kind) && (!q || `${r.name} ${r.slug}`.toLowerCase().includes(q)));
  }, [result, filter, kind]);

  const onPick = (e) => {
    setFile(e.target.files?.[0] || null);
    setPreview(null);
    setApplied(null);
    setConfirmText("");
  };

  const run = async (mode) => {
    if (!file) {
      toast.error("Choose the master Excel file first");
      return;
    }
    setBusy(true);
    const res = await uploadMasterSheet(file, { mode, metro, createPages });
    setBusy(false);
    if (!res.data?.ok) {
      toast.error(res.data?.message || "Master upload failed");
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
      toast.success("Master sheet applied");
    }
  };

  const downloadReport = async () => {
    if (!file) return;
    setReporting(true);
    const res = await downloadMasterReport(file, { metro, createPages });
    setReporting(false);
    if (res.data?.ok) toast.success("Report downloaded");
    else toast.error(res.data?.message || "Report failed");
  };

  const canApply = Boolean(preview) && !applied && confirmText.trim() === "APPLY" && !busy;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-600">
          One Excel file fills the main directory and every city, state and country page. Always run a preview first. Sponsored
          companies on a page are kept.
        </p>
      </div>

      {/* Step 1: file + options */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-800">1. Choose the file</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <FileSpreadsheet className="h-4 w-4" />
            {file ? file.name : "Select master-msp-final.xlsx"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onPick} className="hidden" />
          </label>
          {file ? <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span> : null}
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
            An upload <b>adds</b> new companies and <b>updates</b> the ones that are already in the Managed IT directory. Nothing is deleted, and a blank cell in the sheet never wipes a value that is stored. At most 5,000 companies per upload.
          </p>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={createPages} onChange={(e) => { setCreatePages(e.target.checked); setPreview(null); }} className="mt-1" />
            <span>
              <b>Create missing pages</b> (city, state and country pages that are not in the database yet). Existing pages keep their text; only their companies change.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={metro} onChange={(e) => { setMetro(e.target.checked); setPreview(null); }} className="mt-1" />
            <span>
              <b>Include nearby cities</b> on city pages (for example Plano on the Dallas page). Off means exact city only.
            </span>
          </label>
        </div>

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

      {/* Results */}
      {result ? (
        <>
          {applied ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Applied in {(applied.tookMs / 1000).toFixed(1)} s</p>
                <p>
                  {applied.pages.updated + (applied.pages.created || 0)} pages filled with {applied.pages.companiesPlaced} companies ({applied.pages.createdNow ?? applied.pages.created ?? 0} created). Directory: {applied.directory.added} added, {applied.directory.updated} updated, {applied.directory.kept} left as they were.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Sheet rows" value={result.sheet.sheetRows} sub={`${result.sheet.kept} kept, ${result.sheet.skippedDuplicates} duplicates skipped`} />
            <Stat label="Directory" value={`${result.directory.before} to ${result.directory.after}`} sub={`${result.directory.added} added, ${result.directory.updated} updated, ${result.directory.kept} unchanged`} />
            <Stat label="Index eligible (Y)" value={(result.sheet.indexEligible ?? 0).toLocaleString()} sub={`${(result.sheet.withFaq ?? 0).toLocaleString()} companies have FAQs`} />
            <Stat label="Pages filled" value={result.pages.updated + (result.pages.created || 0)} sub={`${result.pages.created || 0} new, ${result.pages.updated} existing`} />
            <Stat label="Companies placed on pages" value={result.pages.companiesPlaced} />
          </div>

          {result.sheet.unknownHeaders?.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Columns not recognised (their data is not saved): {result.sheet.unknownHeaders.join(", ")}
            </div>
          ) : null}

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
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                <option value="all">All types</option>
                <option value="city">City</option>
                <option value="state">State</option>
                <option value="country">Country</option>
                <option value="skip">Not covered</option>
              </select>
              <span className="text-xs text-gray-500">{rows.length} shown</span>
            </div>
            <div className="max-h-[480px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Page</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Rule</th>
                    <th className="px-4 py-2 text-right">Now</th>
                    <th className="px-4 py-2 text-right">After</th>
                    <th className="px-4 py-2 text-right">Kept (sponsored / listed)</th>
                    <th className="px-4 py-2 text-right">Removed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.hub}-${r.slug}`} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {r.name}
                        {r.willCreate ? <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">new</span> : null}
                        {!r.published && !r.isNew ? <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">draft</span> : null}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{KIND_LABEL[r.kind] || r.kind}</td>
                      <td className="px-4 py-2 text-gray-500">{r.rule}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{r.before}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${r.after < 10 && r.kind !== "skip" ? "text-amber-600" : "text-gray-900"}`}>{r.after}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{r.sponsoredKept}</td>
                      <td className={`px-4 py-2 text-right ${r.removed ? "font-semibold text-red-600" : "text-gray-400"}`}>{r.removed || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3: apply */}
          {!applied ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-900">3. Apply to the live data</p>
              <p className="mt-1 text-sm text-red-800">
                This fills {result.pages.updated + (result.pages.created || 0)} pages ({result.pages.created || 0} of them new) and adds {result.directory.added} and updates {result.directory.updated} companies in the main directory. Nothing is deleted. No backup copy is
                kept, so this cannot be undone. Type <b>APPLY</b> to continue.
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
                  <Upload className="h-4 w-4" /> Apply master sheet
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
