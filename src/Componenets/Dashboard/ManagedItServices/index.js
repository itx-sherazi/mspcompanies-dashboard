"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchManagedItAdmin,
  deleteManagedItCompany,
  deleteAllManagedIt,
  wipeListingCompanies,
} from "@/services/api";
import { Search, Trash2, AlertTriangle, Building2, ChevronLeft, ChevronRight, Globe, MapPin } from "lucide-react";

export default function ManagedItServicesManagement() {
  const [companies, setCompanies]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const tab = "list"; // the old Upload Sheet tab is gone; the Master Sheet tab fills this list
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState("");
  const [wiping, setWiping] = useState(false);
  const eligibleRef = useRef("all"); // Index Eligible filter, read by load()
  const [eligible, setEligible] = useState("all");
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [directoryTotal, setDirectoryTotal] = useState(0);

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    const res = await fetchManagedItAdmin({ q, page: p, limit: 50, eligible: eligibleRef.current === "all" ? "" : eligibleRef.current });
    if (res.data?.ok) {
      setEligibleTotal(res.data.eligibleTotal || 0);
      setDirectoryTotal(res.data.directoryTotal || 0);
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

  const handleWipeListings = async () => {
    if (wipeText.trim() !== "DELETE_COMPANIES") {
      toast.error("Type DELETE_COMPANIES exactly to confirm");
      return;
    }
    setWiping(true);
    const res = await wipeListingCompanies();
    setWiping(false);
    if (res.data?.ok) {
      toast.success(res.data.message);
      setWipeOpen(false);
      setWipeText("");
      load(1, "");
    } else {
      toast.error(res.data?.message || "Wipe failed");
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
            {directoryTotal.toLocaleString()} companies in the directory. Use the Master Sheet tab to fill the directory and every city, state and country page.
          </p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-800">Wipe listing companies</p>
        <p className="text-xs text-red-700/80 mt-1 mb-3">
          Deletes companies only from Managed IT Services, all /msp city pages, and /top-msps country pages.
          City/country pages, SEO, Cyber, and MSSP stay.
        </p>
        <button
          type="button"
          onClick={() => { setWipeOpen(true); setWipeText(""); }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          Delete MIT + city + Top MSPs companies
        </button>
      </div>

      {wipeOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={22} className="text-red-500" />
              <h3 className="font-bold text-gray-800">Delete listing companies?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              This permanently removes companies from:
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 mb-4 space-y-1">
              <li>/managed-it-services</li>
              <li>Every /msp city page</li>
              <li>Every /top-msps country page</li>
            </ul>
            <p className="text-xs text-gray-500 mb-3">
              Type <span className="font-mono font-semibold text-red-700">DELETE_COMPANIES</span> to confirm.
            </p>
            <input
              value={wipeText}
              onChange={(e) => setWipeText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 font-mono"
              placeholder="DELETE_COMPANIES"
              autoComplete="off"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setWipeOpen(false); setWipeText(""); }}
                className="flex-1 py-2 border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={wiping}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeListings}
                disabled={wiping || wipeText.trim() !== "DELETE_COMPANIES"}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40"
              >
                {wiping ? "Deleting…" : "Delete companies"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Tab */}
      {tab === "list" && (
        <>
          {/* Index Eligible counter */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Index eligible (Y)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{eligibleTotal.toLocaleString()}</p>
              <p className="text-xs text-emerald-800/80">Google may index these profiles</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Not eligible (N)</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{Math.max(0, directoryTotal - eligibleTotal).toLocaleString()}</p>
              <p className="text-xs text-gray-500">These profiles stay noindex</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Share indexable</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{directoryTotal ? Math.round((eligibleTotal / directoryTotal) * 100) : 0}%</p>
              <p className="text-xs text-gray-500">of {directoryTotal.toLocaleString()} companies</p>
            </div>
          </div>

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
            <select
              value={eligible}
              onChange={(e) => { eligibleRef.current = e.target.value; setEligible(e.target.value); load(1, search); }}
              className="px-3 py-2 border rounded-lg text-sm text-gray-700 bg-white"
              aria-label="Filter by Index Eligible"
            >
              <option value="all">All companies</option>
              <option value="yes">Index eligible only</option>
              <option value="no">Not eligible only</option>
            </select>
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
              <p className="text-gray-500 text-sm">No companies found. Use Dashboard, Master Sheet to fill the directory.</p>
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
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Index</th>
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
                          ) : <span className="text-gray-300 text-xs"></span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">{c.industry || ""}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.employees || ""}</td>
                        <td className="px-4 py-3">
                          {c.indexEligible ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Y</span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">N</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.website ? (
                            <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#1d4882] hover:underline">
                              <Globe size={11} /> Visit
                            </a>
                          ) : <span className="text-gray-300 text-xs"></span>}
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
