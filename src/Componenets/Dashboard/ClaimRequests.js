"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAuthHeaders } from "@/services/api";
import { Search, Trash2, Mail, ExternalLink, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";
const LIMIT = 15;

const STATUSES = [
  ["new", "New", "bg-amber-100 text-amber-800 border-amber-200"],
  ["contacted", "Contacted", "bg-blue-100 text-blue-800 border-blue-200"],
  ["verified", "Verified", "bg-green-100 text-green-800 border-green-200"],
  ["rejected", "Rejected", "bg-red-100 text-red-800 border-red-200"],
];
const colorOf = (s) => (STATUSES.find((x) => x[0] === s) || STATUSES[0])[2];

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function ClaimRequests() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ new: 0, contacted: 0, verified: 0, rejected: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({}); // admin note being typed per claim

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const res = await fetch(`${API}/api/v1/claim-requests?${params}`, { headers: getAuthHeaders(), credentials: "include" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Could not load claims");
      setRows(json.data);
      setTotal(json.total);
      setPages(json.pages);
      setCounts(json.counts || counts);
      setNotes(Object.fromEntries(json.data.map((r) => [r._id, r.adminNote || ""])));
    } catch (e) {
      toast.error(e.message || "Could not load claims");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    const res = await fetch(`${API}/api/v1/claim-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || "Update failed");
    return json.data;
  };

  const changeStatus = async (row, next) => {
    try {
      await patch(row._id, { status: next });
      toast.success(`Marked ${next}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveNote = async (row) => {
    try {
      await patch(row._id, { adminNote: notes[row._id] || "" });
      toast.success("Note saved");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the claim from ${row.name} for ${row.companyName}?`)) return;
    const res = await fetch(`${API}/api/v1/claim-requests/${row._id}`, { method: "DELETE", headers: getAuthHeaders(), credentials: "include" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Deleted");
      load();
    } else {
      toast.error(json.message || "Delete failed");
    }
  };

  const mailto = (r) =>
    `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(`Your claim for ${r.companyName} on MSP Companies`)}&body=${encodeURIComponent(`Hi ${r.name},\n\n`)}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <UserCheck size={22} className="text-[#1d4882]" /> Claim Requests
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          People who clicked "Claim or update this profile". Each claim is also emailed to the admin inbox and a confirmation goes to the sender.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUSES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setStatus(status === key ? "" : key); setPage(1); }}
            className={`rounded-xl border p-4 text-left transition ${status === key ? "border-[#1d4882] bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{counts[key] ?? 0}</p>
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, name or email"
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-[#1d4882] focus:outline-none focus:ring-2 focus:ring-[#1d4882]/30"
          />
        </div>
        <button type="submit" className="rounded-lg bg-[#1d4882] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163a6e]">Search</button>
        {(search || status) && (
          <button type="button" onClick={() => { setQ(""); setSearch(""); setStatus(""); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Clear
          </button>
        )}
        <span className="text-xs text-gray-500">{total} claim{total === 1 ? "" : "s"}</span>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4882] border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center text-sm text-gray-500">No claim requests yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{r.companyName}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colorOf(r.status)}`}>
                      {(STATUSES.find((x) => x[0] === r.status) || [])[1] || r.status}
                    </span>
                    {r.domainMatch ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        <CheckCircle2 size={12} /> Email matches company website
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle size={12} /> Different domain, verify
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    <b>{r.name}</b> ·{" "}
                    <a href={mailto(r)} className="text-[#1d4882] hover:underline">{r.email}</a>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {fmtDate(r.createdAt)}
                    {r.companyWebsite ? <> · site <a href={r.companyWebsite} target="_blank" rel="noreferrer" className="text-[#1d4882] hover:underline">{r.companyWebsite.replace(/^https?:\/\//, "")}</a></> : null}
                    {" · "}
                    emails: admin {r.adminEmailSent ? "sent" : "NOT sent"}, user {r.userEmailSent ? "sent" : "NOT sent"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`${SITE}${r.pagePath || `/managed-it-services/${r.companySlug}`}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink size={13} /> Profile
                  </a>
                  <a href={mailto(r)} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Mail size={13} /> Reply
                  </a>
                  <select
                    value={r.status}
                    onChange={(e) => changeStatus(r, e.target.value)}
                    className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-gray-700"
                    aria-label="Claim status"
                  >
                    {STATUSES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                  <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {r.notes ? (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{r.notes}</p>
              ) : null}

              <div className="mt-3 flex items-center gap-2">
                <input
                  value={notes[r._id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                  placeholder="Internal note (not sent to the claimant)"
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
                />
                <button onClick={() => saveNote(r)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Save note</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border p-1.5 text-gray-600 hover:bg-white disabled:opacity-40"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="rounded border p-1.5 text-gray-600 hover:bg-white disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
