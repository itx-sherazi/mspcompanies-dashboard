"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  uploadManagedItSheet,
  fetchManagedItAdmin,
  deleteManagedItCompany,
  deleteAllManagedIt,
} from "@/services/api";
import {
  Upload,
  Search,
  Trash2,
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  Globe,
  MapPin,
} from "lucide-react";

const REQUIRED_COLUMNS = [
  "Company Name", "# Employees", "Industry", "Website",
  "Company Services", "Company Partners", "Company Linkedin Url",
  "Facebook Url", "Twitter Url", "Company Street", "Company City",
  "Company State", "Company Country", "Company Postal Code",
  "Company Address", "Keywords", "Company Phone", "Technologies",
  "SIC Codes", "NAICS Codes", "Short Description", "Founded Year", "Logo Url",
];

export default function ManagedItServicesManagement() {
  const [companies, setCompanies]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [uploadMode, setUploadMode] = useState("append");
  const [uploadFile, setUploadFile] = useState(null);
  const [tab, setTab]               = useState("list"); // "list" | "upload"
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    const res = await fetchManagedItAdmin({ q, page: p, limit: 50 });
    if (res.data?.ok) {
      setCompanies(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
    } else {
      toast.error(res.data?.message || "Could not load companies");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(1, ""); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, search);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) { toast.error("Select an Excel file first"); return; }
    setUploading(true);
    const res = await uploadManagedItSheet(uploadFile, uploadMode);
    setUploading(false);
    if (res.data?.ok) {
      toast.success(res.data.message || "Upload successful");
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setTab("list");
      load(1, "");
    } else {
      toast.error(res.data?.message || "Upload failed");
    }
  };

  const handleDelete = async (slug, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const res = await deleteManagedItCompany(slug);
    if (res.data?.ok) {
      toast.success("Company deleted");
      load(page, search);
    } else {
      toast.error(res.data?.message || "Delete failed");
    }
  };

  const handleDeleteAll = async () => {
    const res = await deleteAllManagedIt();
    if (res.data?.ok) {
      toast.success(res.data.message);
      setConfirmDeleteAll(false);
      load(1, "");
    } else {
      toast.error(res.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 size={22} className="text-[#1d4882]" />
            Managed IT Services Directory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} companies · /managed-it-services
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "list" ? "bg-[#1d4882] text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
          >
            Company List
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${tab === "upload" ? "bg-[#1d4882] text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
          >
            <Upload size={14} /> Upload Sheet
          </button>
        </div>
      </div>

      {/* Upload Tab */}
      {tab === "upload" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm max-w-xl">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#1d4882]" />
            Upload Excel Sheet
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Sheet must have these columns (any order):
          </p>
          <div className="flex flex-wrap gap-1 mb-5">
            {REQUIRED_COLUMNS.map((c) => (
              <span key={c} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-mono">
                {c}
              </span>
            ))}
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Upload Mode</label>
              <div className="flex gap-4">
                {[["append", "Append / Upsert", "Add new, update existing by slug"], ["replace", "Replace All", "Delete everything, then insert fresh"]].map(([val, label, desc]) => (
                  <label key={val} className={`flex-1 cursor-pointer rounded-lg border p-3 text-sm transition ${uploadMode === val ? "border-[#1d4882] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" value={val} checked={uploadMode === val} onChange={() => setUploadMode(val)} className="mr-2" />
                    <span className="font-semibold">{label}</span>
                    <p className="text-xs text-gray-500 mt-0.5 ml-5">{desc}</p>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Excel File (.xlsx / .xls)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1d4882] file:text-white hover:file:bg-[#163a6e] cursor-pointer"
              />
              {uploadFile && (
                <p className="text-xs text-green-600 mt-1 font-medium">✓ {uploadFile.name}</p>
              )}
            </div>
            {uploadMode === "replace" && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>Replace mode will <strong>delete all existing companies</strong> before inserting. This cannot be undone.</span>
              </div>
            )}
            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="w-full py-2.5 bg-[#1d4882] text-white rounded-lg font-semibold text-sm hover:bg-[#163a6e] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? <><RefreshCw size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload Companies</>}
            </button>
          </form>
        </div>
      )}

      {/* List Tab */}
      {tab === "list" && (
        <>
          {/* Search + Delete All */}
          <div className="flex flex-wrap gap-3 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[220px]">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company name, city, state…"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4882]/30 focus:border-[#1d4882]"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-[#1d4882] text-white rounded-lg text-sm font-semibold hover:bg-[#163a6e]">
                Search
              </button>
              {search && (
                <button type="button" onClick={() => { setSearch(""); load(1, ""); }} className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Clear
                </button>
              )}
            </form>
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              <Trash2 size={13} /> Delete All
            </button>
          </div>

          {/* Confirm delete all modal */}
          {confirmDeleteAll && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={22} className="text-red-500" />
                  <h3 className="font-bold text-gray-800">Delete All Companies?</h3>
                </div>
                <p className="text-sm text-gray-500 mb-5">This will permanently delete all {total.toLocaleString()} managed IT companies. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDeleteAll(false)} className="flex-1 py-2 border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleDeleteAll} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Delete All</button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#1d4882] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No companies found. Upload an Excel sheet to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-left">
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Company</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Location</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Industry</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Employees</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Website</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.map((c, i) => (
                      <tr key={c.slug} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * 50 + i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{c.companyName}</div>
                          <div className="text-xs text-gray-400 font-mono">{c.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          {c.companyCity || c.companyState ? (
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin size={11} className="text-gray-400" />
                              {[c.companyCity, c.companyState].filter(Boolean).join(", ")}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">{c.industry || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.employees || "—"}</td>
                        <td className="px-4 py-3">
                          {c.website ? (
                            <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#1d4882] hover:underline">
                              <Globe size={11} /> Visit
                            </a>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(c.slug, c.companyName)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Page {page} of {totalPages} · {total.toLocaleString()} total
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => load(page - 1, search)}
                      disabled={page <= 1}
                      className="p-1.5 rounded border text-gray-600 hover:bg-white disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => load(page + 1, search)}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded border text-gray-600 hover:bg-white disabled:opacity-40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
