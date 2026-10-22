"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { fetchCompaniesAdmin, updateCompanyAdmin, deleteCompanyAdmin } from "@/services/api";
import CompanyForm, { DIRECTORY_LABEL } from "./CompanyForm";
import DangerZone from "./DangerZone";
import { Search, Plus, Pencil, Trash2, Globe, ExternalLink, MapPin, ChevronLeft, ChevronRight, Building2, AlertTriangle } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";
const PROFILE_PATH = { mit: "/managed-it-services", mssp: "/managed-security-service-providers", cyber: "/cybersecurity-companies" };
const BADGE = { mit: "bg-blue-50 text-blue-700", mssp: "bg-violet-50 text-violet-700", cyber: "bg-emerald-50 text-emerald-700" };
const LIMIT = 50;

/**
 * Every company of the Managed IT, MSSP and cybersecurity directories in one list: search, filter, add, edit, hide,
 * switch Index Eligible and delete. `role` is "admin" or "seo"; only an admin can delete.
 */
export default function AllCompanies({ role }) {
  const isAdmin = role !== "seo";
  const [directory, setDirectory] = useState("all");
  const [search, setSearch] = useState("");
  const [eligible, setEligible] = useState("");
  const [published, setPublished] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ mit: 0, mssp: 0, cyber: 0 });
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null); // { mode: "new" } or { mode: "edit", directory, slug }
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null); // companies about to be deleted
  const [deleting, setDeleting] = useState(false);
  const queryRef = useRef({});
  queryRef.current = { directory, search, eligible, published };

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const { directory: d, search: q, eligible: e, published: pub } = queryRef.current;
    const res = await fetchCompaniesAdmin({ directory: d, q, eligible: e, published: pub, page: p, limit: LIMIT });
    if (res.data?.ok) {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
      setCounts(res.data.counts || { mit: 0, mssp: 0, cyber: 0 });
      setSelected(new Set());
    } else {
      toast.error(res.data?.message || "Could not load the companies");
    }
    setLoading(false);
  }, []);

  // a filter changed: back to the first page (the search box waits until the typing stops)
  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [directory, search, eligible, published, load]);

  const key = (r) => `${r.directory}:${r.slug}`;
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(key(r)));
  const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(rows.map(key)));
  const toggleOne = (r) => setSelected((s) => { const n = new Set(s); if (n.has(key(r))) n.delete(key(r)); else n.add(key(r)); return n; });

  // switch Index Eligible or Published without opening the form
  const flip = async (r, field) => {
    const next = field === "indexEligible" ? !r.indexEligible : r.isPublished === false;
    const res = await updateCompanyAdmin(r.directory, r.slug, { [field]: next });
    if (res.data?.ok) setRows((list) => list.map((x) => (key(x) === key(r) ? { ...x, [field]: next } : x)));
    else toast.error(res.data?.message || "Could not save");
  };

  const doDelete = async () => {
    setDeleting(true);
    let failed = 0;
    for (const r of confirm) {
      const res = await deleteCompanyAdmin(r.directory, r.slug);
      if (!res.data?.ok) failed += 1;
    }
    setDeleting(false);
    setConfirm(null);
    if (failed) toast.error(`${failed} could not be deleted`);
    else toast.success(confirm.length === 1 ? "Company deleted" : `${confirm.length} companies deleted`);
    load(page);
  };

  const chips = [["all", "All", counts.mit + counts.mssp + counts.cyber], ["mit", "Managed IT", counts.mit], ["mssp", "MSSP", counts.mssp], ["cyber", "Cybersecurity", counts.cyber]];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Building2 size={22} className="text-[#1d4882]" /> All Companies
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Managed IT, MSSP and cybersecurity companies in one place. To add many at once, use Master Sheet.</p>
        </div>
        <button onClick={() => setEditor({ mode: "new" })} className="inline-flex items-center gap-2 rounded-xl bg-[#1d4882] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163a6d]">
          <Plus size={16} /> Add company
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map(([k, label, n]) => (
          <button
            key={k}
            onClick={() => setDirectory(k)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${directory === k ? "border-[#1d4882] bg-[#1d4882] text-white" : "border-gray-200 bg-white text-gray-700 hover:border-[#1d4882]"}`}
          >
            {label} <span className={directory === k ? "text-white/70" : "text-gray-400"}>{n.toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a name, city, state, country, website or slug"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1d4882] focus:ring-2 focus:ring-[#1d4882]/30"
          />
        </div>
        <select value={eligible} onChange={(e) => setEligible(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Index: all</option>
          <option value="yes">Index Eligible (Y)</option>
          <option value="no">Not Index Eligible</option>
        </select>
        <select value={published} onChange={(e) => setPublished(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Status: all</option>
          <option value="yes">Published</option>
          <option value="no">Hidden</option>
        </select>
        {isAdmin && selected.size > 0 ? (
          <button
            onClick={() => setConfirm(rows.filter((r) => selected.has(key(r))))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <Trash2 size={14} /> Delete selected ({selected.size})
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4882] border-t-transparent" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-white py-20 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No companies found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-600">
                  {isAdmin ? <th className="w-10 px-3 py-3"><input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" /></th> : null}
                  <th className="px-3 py-3 font-semibold">Company</th>
                  <th className="px-3 py-3 font-semibold">Directory</th>
                  <th className="px-3 py-3 font-semibold">Location</th>
                  <th className="px-3 py-3 font-semibold">Index</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Links</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={key(r)} className="transition hover:bg-gray-50">
                    {isAdmin ? <td className="px-3 py-3"><input type="checkbox" checked={selected.has(key(r))} onChange={() => toggleOne(r)} aria-label={`Select ${r.companyName}`} /></td> : null}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {r.image ? (
                          <img src={r.image} alt="" className="h-8 w-8 shrink-0 rounded border border-gray-100 bg-white object-contain p-0.5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 text-xs font-bold text-gray-400">{r.companyName.charAt(0)}</div>
                        )}
                        <div className="min-w-0">
                          <button onClick={() => setEditor({ mode: "edit", directory: r.directory, slug: r.slug })} className="block max-w-[260px] truncate text-left font-semibold text-gray-800 hover:text-[#1d4882]">{r.companyName}</button>
                          <p className="font-mono text-xs text-gray-400">{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[r.directory]}`}>{DIRECTORY_LABEL[r.directory]}</span></td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {r.companyCity || r.companyState || r.companyCountry ? (
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" />{[r.companyCity, r.companyState, r.companyCountry].filter(Boolean).join(", ")}</span>
                      ) : <span className="text-gray-300">none</span>}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => flip(r, "indexEligible")} title="Click to switch" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.indexEligible ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{r.indexEligible ? "Y" : "N"}</button>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => flip(r, "isPublished")} title="Click to switch" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.isPublished === false ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{r.isPublished === false ? "Hidden" : "Published"}</button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 text-xs">
                        {r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1d4882] hover:underline"><Globe size={11} />Site</a> : null}
                        <a href={`${SITE}${PROFILE_PATH[r.directory]}/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1d4882] hover:underline"><ExternalLink size={11} />Profile</a>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditor({ mode: "edit", directory: r.directory, slug: r.slug })} className="rounded p-1.5 text-gray-400 hover:bg-[#EBF3FF] hover:text-[#1d4882]" title="Edit"><Pencil size={14} /></button>
                        {isAdmin ? <button onClick={() => setConfirm([r])} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={14} /></button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total.toLocaleString()} companies</p>
              <div className="flex gap-1">
                <button onClick={() => load(page - 1)} disabled={page <= 1} className="rounded border p-1.5 text-gray-600 hover:bg-white disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="rounded border p-1.5 text-gray-600 hover:bg-white disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          ) : (
            <p className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500">{total.toLocaleString()} companies</p>
          )}
        </div>
      )}

      {isAdmin ? <DangerZone onDone={() => load(1)} /> : null}

      {editor ? (
        <CompanyForm
          mode={editor.mode}
          directory={editor.mode === "edit" ? editor.directory : directory}
          slug={editor.slug}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); load(page); }}
        />
      ) : null}

      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <AlertTriangle size={22} className="text-red-500" />
              <h3 className="font-bold text-gray-800">{confirm.length === 1 ? "Delete this company?" : `Delete ${confirm.length} companies?`}</h3>
            </div>
            <p className="mb-5 text-sm text-gray-600">
              {confirm.length === 1 ? <><b>{confirm[0].companyName}</b> ({DIRECTORY_LABEL[confirm[0].directory]})</> : "They"} will be removed from the directory and from its location pages. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} disabled={deleting} className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
