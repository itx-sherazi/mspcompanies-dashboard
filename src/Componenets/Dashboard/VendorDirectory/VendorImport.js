"use client";

import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { importVendors } from "@/services/api";
import { Upload, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import * as XLSX from "xlsx";

// ── Column mapping: sheet header → internal field name ──
const COL_MAP = {
  "company name":          "name",
  "# employees":           "employees",
  "industry":              "industry",
  "website":               "website",
  "company linkedin url":  "linkedinUrl",
  "facebook url":          "facebookUrl",
  "twitter url":           "twitterUrl",
  "company street":        "street",
  "company city":          "city",
  "company state":         "state",
  "company country":       "country",
  "company postal code":   "postalCode",
  "company address":       "address",
  "keywords":              "keywords",
  "company phone":         "phone",
  "technologies":          "technologies",
  "sic codes":             "sicCodes",
  "naics codes":           "naicsCodes",
  "short description":     "description",
  "founded year":          "founded",
  "logo url":              "logoUrl",
};

// ── Simple CSV parser (handles quoted fields) ──
function parseCSVText(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (!lines.length) return [];

  const parseLine = (line) => {
    const fields = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "\t" && !inQuote) {
        fields.push(cur); cur = "";
      } else if (ch === "," && !inQuote) {
        fields.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      const key = COL_MAP[h.toLowerCase()] || h;
      obj[key] = (values[idx] || "").trim();
    });
    if (obj.name) rows.push(obj);
  }

  return rows;
}

const PREVIEW_COLS = ["name","website","city","country","industry","employees","description"];

export default function VendorImport() {
  const [rows, setRows]           = useState([]);
  const [fileName, setFileName]   = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
          // map column headers
          const mapped = jsonRows.map((row) => {
            const obj = {};
            for (const [h, v] of Object.entries(row)) {
              const key = COL_MAP[h.trim().toLowerCase()] || h;
              obj[key] = String(v ?? "").trim();
            }
            return obj;
          }).filter((r) => r.name);
          setRows(mapped);
          if (!mapped.length) toast.error("No rows found  check your file");
          else toast.success(`${mapped.length} rows parsed  review below then click Import`);
        } catch (err) {
          toast.error("Failed to read Excel file: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = parseCSVText(e.target.result);
        setRows(parsed);
        if (!parsed.length) toast.error("No rows found  check your file format");
        else toast.success(`${parsed.length} rows parsed  review below then click Import`);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    const res = await importVendors(rows);
    setImporting(false);
    if (res.data?.ok) {
      setResult(res.data);
      toast.success(`Done  ${res.data.created} created, ${res.data.updated} updated`);
    } else {
      toast.error(res.data?.error || "Import failed");
    }
  };

  const clearFile = () => { setRows([]); setFileName(""); setResult(null); };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Import Vendors from Sheet</h2>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV or TSV file. Existing vendors are updated (empty fields only); new ones are created.</p>
      </div>

      {/* Supported columns info */}
      <div className="mb-6 bg-[#EBF3FF] border border-[#C7DEFF] rounded-xl p-4">
        <p className="text-xs font-bold text-[#1d4882] uppercase tracking-wide mb-2">Supported Column Headers</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(COL_MAP).map((col) => (
            <span key={col} className="text-xs bg-white border border-[#C7DEFF] text-[#1d4882] px-2 py-0.5 rounded font-mono">
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      {!rows.length && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? "border-[#1d4882] bg-[#EBF3FF]" : "border-gray-300 hover:border-[#1d4882] hover:bg-gray-50"
          }`}
        >
          <Upload size={36} className="mx-auto mb-3 text-gray-400" />
          <p className="text-base font-semibold text-gray-700">Drop your file here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[".xlsx", ".csv", ".tsv"].map((ext) => (
              <span key={ext} className="text-xs bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded font-mono">{ext}</span>
            ))}
          </div>
          <p className="text-xs text-gray-300 mt-2">LinkedIn Sales Navigator, Apollo, Clearbit, etc.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* File loaded  preview */}
      {rows.length > 0 && (
        <div>
          {/* File bar */}
          <div className="flex items-center justify-between mb-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-[#1d4882]" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-400">{rows.length} rows ready to import</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 bg-[#1d4882] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                <Upload size={14} /> {importing ? "Importing…" : `Import ${rows.length} Vendors`}
              </button>
              <button onClick={clearFile} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />
                <span className="font-bold text-green-800">Import Complete</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-green-700"><strong>{result.created}</strong> created</span>
                <span className="text-blue-700"><strong>{result.updated}</strong> updated</span>
                <span className="text-gray-500"><strong>{result.skipped}</strong> skipped</span>
                {result.errors?.length > 0 && (
                  <span className="text-red-600"><strong>{result.errors.length}</strong> errors</span>
                )}
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowErrors((s) => !s)}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600"
                  >
                    {showErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showErrors ? "Hide" : "Show"} errors
                  </button>
                  {showErrors && (
                    <div className="mt-2 max-h-32 overflow-y-auto flex flex-col gap-1">
                      {result.errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
                          <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                          <span><strong>{e.name}</strong>: {e.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview (first 50 rows)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500">#</th>
                    {PREVIEW_COLS.map((c) => (
                      <th key={c} className="text-left px-3 py-2 font-semibold text-gray-500 whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className={`${!row.name ? "opacity-40" : ""} hover:bg-gray-50`}>
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      {PREVIEW_COLS.map((c) => (
                        <td key={c} className="px-3 py-1.5 text-gray-700 max-w-[200px] truncate">
                          {String(row[c] || "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && (
              <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 text-center">
                + {rows.length - 50} more rows not shown in preview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
