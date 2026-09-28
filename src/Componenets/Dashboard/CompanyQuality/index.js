"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchCompanyQualitySources,
  fetchQualityPages,
  fetchBadCharCompanies,
  fetchDuplicateCompanies,
  updateQualityCompany,
  autoFixCompanies,
  deleteQualityCompanies,
  dedupeCompanies,
} from "@/services/api";
import {
  AlertTriangle,
  Copy,
  Search,
  Wand2,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

const FIELD_LABELS = {
  companyName: "Company name",
  description: "Description",
  address: "Address",
  companyStreet: "Street",
  companyCity: "City",
  companyState: "State",
  companyCountry: "Country",
  companyServices: "Services",
  companyPartners: "Partners",
  keywords: "Keywords",
  industryTags: "Industry",
  technologies: "Technologies",
};

const STATUS_INFO = {
  verified: { label: "Verified duplicate", hint: "Same name and same LinkedIn", cls: "bg-red-100 text-red-700" },
  conflict: { label: "LinkedIn differs", hint: "Name matches but LinkedIn doesn't (or vice versa) — maybe different companies", cls: "bg-amber-100 text-amber-800" },
  unverified: { label: "No LinkedIn", hint: "Same name, no LinkedIn URL to verify", cls: "bg-gray-100 text-gray-700" },
};

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));
const itemRef = (c) => ({ source: c.source, id: c.id });

/** "U+200B" -> the actual invisible character, so it can be highlighted. */
function seqToText(seq) {
  const m = /^U\+([0-9A-F]{4})$/.exec(seq);
  return m ? String.fromCharCode(parseInt(m[1], 16)) : seq;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Text with each bad sequence wrapped in a red mark. */
function Highlighted({ text, bad }) {
  if (!text) return null;
  const seqs = bad.map(seqToText).sort((a, b) => b.length - a.length);
  if (!seqs.length) return <>{text}</>;
  const parts = String(text).split(new RegExp(`(${seqs.map(escapeRe).join("|")})`, "g"));
  return (
    <>
      {parts.map((p, i) =>
        seqs.includes(p) ? (
          <mark key={i} className="bg-red-200 text-red-800 rounded px-0.5 font-semibold">
            {/^[\u0000-\u001F\u007F-\u009F​-‍⁠﻿]$/.test(p)
              ? `⟨U+${p.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}⟩`
              : p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Pager({ page, totalPages, total, onPage, noun }) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>{total.toLocaleString()} {noun}</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded border bg-white disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span>Page {page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded border bg-white disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function CompanyMeta({ c }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1d4882] font-medium">{c.sourceLabel}</span>
      {c.cityName && <span>{c.cityName}</span>}
      <a href={`${SITE}${c.publicPath}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
        View live <ExternalLink size={11} />
      </a>
      {c.linkedinUrl ? (
        <a href={c.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[260px]">
          {c.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      ) : (
        <span className="italic">no LinkedIn</span>
      )}
      {c.website && (
        <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[220px]">
          {c.website.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      )}
    </div>
  );
}

function EditModal({ company, onClose, onSaved }) {
  const suggested = company.issues?.find((i) => i.field === "description")?.fixed;
  const suggestedName = company.issues?.find((i) => i.field === "companyName")?.fixed;
  const [form, setForm] = useState({
    companyName: company.companyName || "",
    description: company.description || "",
    linkedinUrl: company.linkedinUrl || "",
    website: company.website || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const res = await updateQualityCompany(company.source, company.id, form);
    setSaving(false);
    if (res.data?.ok) {
      toast.success("Company updated");
      onSaved();
    } else {
      toast.error(res.data?.message || "Update failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit company</h3>
            <CompanyMeta c={company} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="space-y-4 mt-5">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Company name</span>
            <input value={form.companyName} onChange={set("companyName")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            {suggestedName && suggestedName !== form.companyName && (
              <button onClick={() => setForm((f) => ({ ...f, companyName: suggestedName }))} className="mt-1 text-xs text-green-700 hover:underline">
                Use fixed name: {suggestedName}
              </button>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <textarea value={form.description} onChange={set("description")} rows={9} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-[inherit]" />
            {suggested && suggested !== form.description && (
              <button onClick={() => setForm((f) => ({ ...f, description: suggested }))} className="mt-1 text-xs text-green-700 hover:underline inline-flex items-center gap-1">
                <Wand2 size={12} /> Replace with auto-fixed description
              </button>
            )}
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">LinkedIn URL</span>
              <input value={form.linkedinUrl} onChange={set("linkedinUrl")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Website</span>
              <input value={form.website} onChange={set("website")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-[#1d4882] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pages that had bad characters at some point, so they can be shown as "Fixed" once clean.
const HAD_ISSUES_KEY = "companyQuality.pagesWithIssues";
function readHadIssues() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HAD_ISSUES_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function saveHadIssues(set) {
  try {
    localStorage.setItem(HAD_ISSUES_KEY, JSON.stringify([...set]));
  } catch {}
}

/** "issues" | "fixed" | "clean" for one page. */
const pageState = (p, hadIssues) => (p.bad > 0 ? "issues" : hadIssues.has(p.key) ? "fixed" : "clean");

function PageList({ pages, hadIssues, selected, onSelect, loading, error, onRetry }) {
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(true);

  const groups = [...new Map(pages.map((p) => [p.group, p.groupLabel])).entries()];
  const rank = { issues: 0, fixed: 1, clean: 2 };
  const needle = search.trim().toLowerCase();
  const shown = pages
    .filter((p) => !group || p.group === group)
    .filter((p) => !onlyIssues || pageState(p, hadIssues) !== "clean")
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.path.includes(needle))
    .sort((a, b) =>
      rank[pageState(a, hadIssues)] - rank[pageState(b, hadIssues)] || b.bad - a.bad || a.name.localeCompare(b.name));

  return (
    <div className="bg-white rounded-xl border flex flex-col lg:max-h-[calc(100vh-220px)]">
      <div className="p-3 border-b space-y-2">
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="w-full border rounded-lg px-2.5 py-1.5 text-sm">
          <option value="">All page types</option>
          {groups.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a page (city, country)…"
          className="w-full border rounded-lg px-2.5 py-1.5 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
          Only pages with issues (and fixed ones)
        </label>
      </div>
      <div className="overflow-y-auto divide-y">
        <button
          onClick={() => onSelect("")}
          className={`w-full text-left px-3 py-2.5 text-sm font-semibold ${selected === "" ? "bg-blue-50 text-[#1d4882]" : "hover:bg-gray-50"}`}
        >
          All pages
        </button>
        {loading && pages.length === 0 && <p className="px-3 py-6 text-sm text-gray-500 text-center">Loading pages…</p>}
        {!loading && error && (
          <div className="px-3 py-6 text-center">
            <p className="text-sm font-semibold text-red-700">Could not scan pages</p>
            <p className="text-xs text-red-600 mt-1 break-words">{error}</p>
            <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded-lg bg-[#1d4882] text-white text-xs font-semibold">Retry</button>
          </div>
        )}
        {!loading && !error && shown.length === 0 && (
          <p className="px-3 py-6 text-sm text-green-700 text-center">No pages with issues 🎉</p>
        )}
        {shown.map((p) => {
          const state = pageState(p, hadIssues);
          return (
            <button
              key={p.key}
              onClick={() => onSelect(p.key)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition ${
                selected === p.key ? "bg-blue-50 ring-1 ring-inset ring-[#1d4882]" : state === "fixed" ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {p.path}{!p.isPublished && " · unpublished"}
                </p>
              </div>
              {state === "issues" && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{p.bad}/{p.total}</span>
              )}
              {state === "fixed" && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-600 text-white text-xs font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 size={12} /> Fixed
                </span>
              )}
              {state === "clean" && <span className="shrink-0 text-xs text-gray-400">Clean</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BadCharsTab({ q, removeEmoji, onEdit, reloadKey, onCount }) {
  const [pages, setPages] = useState([]);
  const [hadIssues, setHadIssues] = useState(new Set());
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState("");
  const [target, setTarget] = useState("");
  const [rows, setRows] = useState([]);
  const [chars, setChars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [field, setField] = useState("");
  const [char, setChar] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadPages = useCallback(async (refresh = false) => {
    setPagesLoading(true);
    const res = await fetchQualityPages(refresh);
    setPagesLoading(false);
    if (!res.data?.ok) {
      setPagesError(res.data?.message || "Request failed");
      return toast.error(res.data?.message || "Could not load pages");
    }
    setPagesError("");
    const had = readHadIssues();
    res.data.data.forEach((p) => p.bad > 0 && had.add(p.key));
    saveHadIssues(had);
    setHadIssues(had);
    setPages(res.data.data);
    onCount(res.data.totalBad);
  }, [onCount]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const res = await fetchBadCharCompanies(clean({ target, field, char, q, page, limit: 25 }));
    setLoading(false);
    if (!res.data?.ok) return toast.error(res.data?.message || "Could not load companies");
    setRows(res.data.data);
    setChars(res.data.chars);
    setMeta(res.data);
    setSelected(new Set());
  }, [target, field, char, q]);

  // Rescan button / after an edit: refresh the page list, then the companies.
  useEffect(() => { loadPages(reloadKey > 0); }, [loadPages, reloadKey]);
  useEffect(() => { load(1); }, [load, reloadKey]);

  const selectPage = (key) => {
    setTarget(key);
    setChar("");
  };

  const afterChange = async () => {
    await loadPages();
    load(meta.page);
  };

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedItems = rows.filter((r) => selected.has(r.id)).map(itemRef);

  const fix = async (payload, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const res = await autoFixCompanies({ ...payload, removeEmoji });
    setBusy(false);
    if (res.data?.ok) {
      toast.success(res.data.message);
      afterChange();
    } else {
      toast.error(res.data?.message || "Fix failed");
    }
  };

  const remove = async (items, label) => {
    if (!window.confirm(`Delete ${label}? This removes it from the live site.`)) return;
    setBusy(true);
    const res = await deleteQualityCompanies(items);
    setBusy(false);
    if (res.data?.ok) {
      toast.success(res.data.message);
      afterChange();
    } else {
      toast.error(res.data?.message || "Delete failed");
    }
  };

  const current = pages.find((p) => p.key === target);
  const currentState = current ? pageState(current, hadIssues) : null;

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
      <PageList pages={pages} hadIssues={hadIssues} selected={target} onSelect={selectPage} loading={pagesLoading} error={pagesError} onRetry={() => loadPages(true)} />

      <div className="space-y-4 min-w-0">
        <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{current ? current.name : "All pages"}</p>
            <p className="text-xs text-gray-500">
              {current ? (
                <>
                  {current.groupLabel} ·{" "}
                  <a href={`${SITE}${current.path}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    {current.path} <ExternalLink size={11} />
                  </a>{" "}
                  · {current.total} companies
                </>
              ) : (
                `${pages.filter((p) => p.bad > 0).length} pages have companies with bad characters`
              )}
            </p>
          </div>
          <button
            disabled={busy || !meta.total}
            onClick={() => fix(
              { all: true, target, char },
              `Auto-fix ${char ? `"${char}" in ` : ""}all ${meta.total} companies ${current ? `on ${current.name}` : "on every page"}?`,
            )}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            <Wand2 size={14} /> Auto-fix all {meta.total} {current ? "on this page" : ""}
          </button>
        </div>

        {current && currentState !== "issues" && !loading && (
          <div className={`rounded-xl border p-5 flex items-center gap-3 ${currentState === "fixed" ? "bg-green-50 border-green-300" : "bg-gray-50"}`}>
            <CheckCircle2 size={28} className="text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                {currentState === "fixed" ? "Is page ka issue fix ho gaya ✓" : "Is page pe koi bad character nahi hai"}
              </p>
              <p className="text-sm text-gray-600">All {current.total} companies on {current.path} have clean text.</p>
            </div>
          </div>
        )}

        {(chars.length > 0 || field) && (
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-semibold text-gray-800">
                Bad characters <span className="text-gray-400 font-normal">· click one to filter</span>
              </p>
              <select value={field} onChange={(e) => setField(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                <option value="">All fields</option>
                {Object.entries(FIELD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {chars.map((c) => (
                <button
                  key={c.seq}
                  onClick={() => setChar(char === c.seq ? "" : c.seq)}
                  className={`px-2.5 py-1 rounded-lg border text-sm font-mono transition ${char === c.seq ? "bg-[#1d4882] text-white border-[#1d4882]" : "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"}`}
                  title={`Auto-fix turns it into: ${c.fixed || "(removed)"}`}
                >
                  {c.seq} <span className="opacity-60">→ {c.fixed || "∅"}</span> <span className="font-sans font-semibold">({c.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 mr-2">
              <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))} />
              Select all on this list
            </label>
            <button
              disabled={busy || !selectedItems.length}
              onClick={() => fix({ items: selectedItems })}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <Wand2 size={14} /> Auto-fix selected ({selectedItems.length})
            </button>
            <button
              disabled={busy || !selectedItems.length}
              onClick={() => remove(selectedItems, `${selectedItems.length} companies`)}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Delete selected
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading companies…</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1.5" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{r.companyName}</p>
                        <CompanyMeta c={r} />
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button disabled={busy} onClick={() => fix({ items: [itemRef(r)] })} title="Auto-fix and mark done" className="px-2.5 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold inline-flex items-center gap-1">
                          <Wand2 size={15} /> Fix
                        </button>
                        <button onClick={() => onEdit(r)} title="Edit" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <Pencil size={16} />
                        </button>
                        <button disabled={busy} onClick={() => remove([itemRef(r)], `"${r.companyName}"`)} title="Delete" className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {r.issues.map((i) => (
                        <div key={i.field} className="text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            {FIELD_LABELS[i.field] || i.field} · <span className="font-mono normal-case text-red-700">{i.bad.join("  ")}</span>
                          </p>
                          <div className="grid md:grid-cols-2 gap-2">
                            <div className="bg-red-50/50 border border-red-100 rounded-lg p-2.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-gray-800">
                              <Highlighted text={i.value} bad={i.bad} />
                            </div>
                            <div className="bg-green-50/60 border border-green-100 rounded-lg p-2.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-gray-800">
                              <span className="block text-[10px] font-semibold text-green-700 uppercase mb-1">After auto-fix</span>
                              {i.fixed}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta.total > 0 && (
          <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={load} noun="companies with bad characters" />
        )}
      </div>
    </div>
  );
}

function DuplicatesTab({ source, q, onEdit, reloadKey, onCount }) {
  const [by, setBy] = useState("name");
  const [scope, setScope] = useState("page");
  const [status, setStatus] = useState("");
  const [groups, setGroups] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, scanned: 0, statusCounts: {}, duplicateCompanies: 0 });
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const res = await fetchDuplicateCompanies(clean({ source, by, scope, status, q, page, limit: 20 }));
    setLoading(false);
    if (!res.data?.ok) return toast.error(res.data?.message || "Could not load duplicates");
    setGroups(res.data.data);
    setMeta(res.data);
    setSelected(new Set());
    if (!status && !q && by === "name" && scope === "page") onCount(res.data.total);
  }, [source, by, scope, status, q, onCount]);

  useEffect(() => { load(1); }, [load, reloadKey]);

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const remove = async (companies, intro = "") => {
    const lines = companies.map((c) => `• ${c.companyName} — ${c.sourceLabel}${c.cityName ? ` / ${c.cityName}` : ""}`);
    const names = lines.slice(0, 15).join("\n") + (lines.length > 15 ? `\n…and ${lines.length - 15} more` : "");
    if (!window.confirm(`${intro}Permanently delete ${companies.length} ${companies.length === 1 ? "company" : "companies"}?\n\n${names}`)) return;
    setBusy(true);
    const res = await deleteQualityCompanies(companies.map(itemRef));
    setBusy(false);
    if (res.data?.ok) {
      toast.success(res.data.message);
      load(meta.page);
    } else {
      toast.error(res.data?.message || "Delete failed");
    }
  };

  // Every group matching the current filters (all result pages): keep the first, delete the rest.
  const dedupeAll = async () => {
    const answer = window.prompt(
      `This keeps 1 company in each of ${meta.total} duplicate groups and PERMANENTLY deletes ${meta.toDelete} companies from the live site.\n\nType DELETE to confirm.`,
    );
    if (answer?.trim() !== "DELETE") return;
    setBusy(true);
    const res = await dedupeCompanies(clean({ source, by, scope, status, q }));
    setBusy(false);
    if (res.data?.ok) {
      toast.success(res.data.message);
      load(1);
    } else {
      toast.error(res.data?.message || "Cleanup failed");
    }
  };

  const allCompanies = groups.flatMap((g) => g.companies);
  const selectedCompanies = allCompanies.filter((c) => selected.has(c.id));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-800">Match by</span>
        {[
          ["name", "Company name"],
          ["linkedin", "LinkedIn URL"],
          ["both", "Name + LinkedIn (verified only)"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => { setBy(k); setStatus(""); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${by === k ? "bg-[#1d4882] text-white border-[#1d4882]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
        {by !== "both" && (
          <div className="flex flex-wrap gap-2 ml-auto">
            {Object.entries(STATUS_INFO)
              .filter(([k]) => by === "name" || k !== "unverified")
              .map(([k, s]) => (
                <button
                  key={k}
                  title={s.hint}
                  onClick={() => setStatus(status === k ? "" : k)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls} ${status === k ? "ring-2 ring-offset-1 ring-[#1d4882]" : ""}`}
                >
                  {s.label} ({meta.statusCounts?.[k] || 0})
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-800">Scope</span>
        {[
          ["page", "Same page only", "Same company listed 2+ times on ONE page (e.g. twice on /msp/houston)"],
          ["all", "Across all pages", "Same company on different pages too (e.g. Miami page + Florida page + Managed IT)"],
        ].map(([k, label, hint]) => (
          <button
            key={k}
            title={hint}
            onClick={() => { setScope(k); setStatus(""); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${scope === k ? "bg-[#1d4882] text-white border-[#1d4882]" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
        {scope === "all" && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
            Deleting here removes the company from the other pages (e.g. its city page or the Managed IT directory).
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={busy || !selectedCompanies.length}
          onClick={() => remove(selectedCompanies)}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Trash2 size={14} /> Delete selected ({selectedCompanies.length})
        </button>
        <button
          disabled={busy || !meta.total}
          onClick={dedupeAll}
          className="ml-auto px-3 py-1.5 rounded-lg bg-red-700 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
          title="For every group below (all pages): keep the company marked KEEP and delete the rest"
        >
          <Trash2 size={14} /> Keep first, delete rest in all {meta.total} groups ({meta.toDelete || 0} companies)
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Looking for duplicates…</div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center text-green-700 flex items-center justify-center gap-2"><ShieldCheck size={18} /> No duplicates found</div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const s = STATUS_INFO[g.status];
            return (
              <div key={g.key} className="bg-white rounded-xl border">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                  <span className="font-semibold text-gray-900">{g.companies[0].companyName}</span>
                  <span className="text-sm text-gray-500">{g.count} listings</span>
                  <span title={s.hint} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                  <button
                    disabled={busy}
                    onClick={() => remove(g.companies.slice(1), `Keeping: ${g.companies[0].companyName} — ${g.companies[0].sourceLabel}${g.companies[0].cityName ? ` / ${g.companies[0].cityName}` : ""}\n\n`)}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={13} /> Keep first, delete rest ({g.count - 1})
                  </button>
                </div>
                <div className="divide-y">
                  {g.companies.map((c) => (
                    <div key={c.id} className={`flex items-start gap-3 px-4 py-3 ${c.keep ? "bg-green-50/60" : ""}`}>
                      <input type="checkbox" className="mt-1.5" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {c.keep && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white font-bold" title="Most complete listing: this one stays">KEEP</span>
                          )}
                          {c.companyName}
                          {c.badChars && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">bad characters</span>
                          )}
                        </p>
                        <CompanyMeta c={c} />
                        {c.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{c.description}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => onEdit(c)} title="Edit" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <Pencil size={16} />
                        </button>
                        <button disabled={busy} onClick={() => remove([c])} title="Delete" className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={load} noun={`duplicate groups · ${meta.duplicateCompanies} listings (of ${meta.scanned.toLocaleString()} scanned)`} />
    </div>
  );
}

export default function CompanyQuality() {
  const [tab, setTab] = useState("badChars");
  const [sources, setSources] = useState([]);
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [removeEmoji, setRemoveEmoji] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [counts, setCounts] = useState({ badChars: null, duplicates: null });

  useEffect(() => {
    fetchCompanyQualitySources().then((res) => res.data?.ok && setSources(res.data.data));
  }, []);

  const setBadCount = useCallback((n) => setCounts((c) => ({ ...c, badChars: n })), []);
  const setDupCount = useCallback((n) => setCounts((c) => ({ ...c, duplicates: n })), []);

  const tabBtn = (key, label, icon, count) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition inline-flex items-center gap-1.5 ${tab === key ? "bg-[#1d4882] text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
    >
      {icon} {label}
      {count != null && <span className={`ml-1 px-1.5 rounded-full text-xs ${tab === key ? "bg-white/20" : "bg-gray-100"}`}>{count}</span>}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={22} className="text-[#1d4882]" />
            Company Data Quality
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Broken characters (e.g. <span className="font-mono">â€“ ðŸ’¬</span>) and duplicate companies across city hubs, Managed IT and Cybersecurity.
          </p>
        </div>
        <div className="flex gap-2">
          {tabBtn("badChars", "Bad characters", <AlertTriangle size={14} />, counts.badChars)}
          {tabBtn("duplicates", "Duplicates", <Copy size={14} />, counts.duplicates)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {tab === "duplicates" && (
          <select value={source} onChange={(e) => setSource(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">All sources</option>
            {sources.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        )}
        <form onSubmit={(e) => { e.preventDefault(); setQ(search.trim().toLowerCase()); }} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "badChars" ? "Search companies on the selected page…" : "Search name, city, LinkedIn, website…"}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-white"
            />
          </div>
          <button className="px-4 py-2 rounded-lg bg-[#1d4882] text-white text-sm font-semibold">Search</button>
        </form>
        {tab === "badChars" && (
          <label className="flex items-center gap-2 text-sm text-gray-700" title="Auto-fix normally turns ðŸ’¬ into 💬. Tick this to remove emojis instead.">
            <input type="checkbox" checked={removeEmoji} onChange={(e) => setRemoveEmoji(e.target.checked)} />
            Remove emojis when fixing
          </label>
        )}
        <button onClick={() => setReloadKey((k) => k + 1)} title="Rescan" className="p-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-50">
          <RefreshCw size={16} />
        </button>
      </div>

      {tab === "badChars" ? (
        <BadCharsTab q={q} removeEmoji={removeEmoji} onEdit={setEditing} reloadKey={reloadKey} onCount={setBadCount} />
      ) : (
        <DuplicatesTab source={source} q={q} onEdit={setEditing} reloadKey={reloadKey} onCount={setDupCount} />
      )}

      {editing && (
        <EditModal
          company={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setReloadKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
