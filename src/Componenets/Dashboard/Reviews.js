"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAuthHeaders } from "@/services/api";
import { Search, Trash2, Mail, ExternalLink, ChevronLeft, ChevronRight, Star, Check, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";
const LIMIT = 10;

const STATUSES = [
  ["pending", "Waiting for approval", "bg-amber-100 text-amber-800 border-amber-200"],
  ["approved", "Approved", "bg-green-100 text-green-800 border-green-200"],
  ["rejected", "Rejected", "bg-gray-100 text-gray-700 border-gray-200"],
];
const colorOf = (s) => (STATUSES.find((x) => x[0] === s) || STATUSES[0])[2];
const labelOf = (s) => (STATUSES.find((x) => x[0] === s) || [])[1] || s;

const TYPE_LABEL = { msp: "MSP", mssp: "MSSP", cyber: "Cybersecurity", vendor: "Vendor" };
const PROFILE_PATH = { msp: "/managed-it-services", mssp: "/managed-security-service-providers", cyber: "/cybersecurity-companies", vendor: "/tools" };
const DETAIL_LABEL = { quality: "Service quality", communication: "Communication", support: "Support", value: "Value for money", ease: "Ease of use", features: "Features" };

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function Stars({ n }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={15} className={i <= n ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
      ))}
    </span>
  );
}

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const res = await fetch(`${API}/api/v1/admin/reviews?${params}`, { headers: getAuthHeaders(), credentials: "include" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Could not load reviews");
      setRows(json.data);
      setTotal(json.total);
      setPages(json.pages);
      if (json.counts) setCounts(json.counts);
      setNotes(Object.fromEntries(json.data.map((r) => [r._id, r.adminNote || ""])));
    } catch (e) {
      toast.error(e.message || "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    const res = await fetch(`${API}/api/v1/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || "Update failed");
    return json.data;
  };

  const setReviewStatus = async (row, next) => {
    try {
      await patch(row._id, { status: next });
      toast.success(next === "approved" ? "Approved. It is on the profile now." : next === "rejected" ? "Rejected" : "Moved back to waiting");
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
    if (!window.confirm(`Delete the review "${row.title}" of ${row.targetName}? This cannot be undone.`)) return;
    const res = await fetch(`${API}/api/v1/admin/reviews/${row._id}`, { method: "DELETE", headers: getAuthHeaders(), credentials: "include" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Deleted");
      load();
    } else {
      toast.error(json.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Star size={22} className="text-[#1d4882]" /> Reviews
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Reviews written on company and vendor profiles. A review is only on the website after you approve it. Every reviewer used a business email.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
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

      <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }} className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the company, the reviewer, the email or the title"
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-[#1d4882] focus:outline-none focus:ring-2 focus:ring-[#1d4882]/30"
          />
        </div>
        <button type="submit" className="rounded-lg bg-[#1d4882] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163a6e]">Search</button>
        {(search || status !== "pending") && (
          <button type="button" onClick={() => { setQ(""); setSearch(""); setStatus("pending"); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Reset
          </button>
        )}
        <span className="text-xs text-gray-500">{total} review{total === 1 ? "" : "s"}</span>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4882] border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center text-sm text-gray-500">
          {status === "pending" ? "No reviews are waiting for approval." : "No reviews here."}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const details = Object.entries(r.ratings || {}).filter(([, v]) => v);
            return (
              <div key={r._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{r.targetName}</h3>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#1d4882]">{TYPE_LABEL[r.targetType] || r.targetType}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colorOf(r.status)}`}>{labelOf(r.status)}</span>
                      {!r.mailSent ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600" title="The email to the editor inbox did not go out. The review is saved here.">Email not sent</span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Stars n={r.rating} />
                      <span className="text-sm font-semibold text-gray-800">{r.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      <b>{r.name}</b>{r.hideName ? <span className="text-gray-500"> (name hidden on the site)</span> : null} ·{" "}
                      <a href={`mailto:${r.email}`} className="text-[#1d4882] hover:underline">{r.email}</a>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {[r.role, r.companySize && `${r.companySize} employees`, r.timeUsing].filter(Boolean).join(" · ") || "No extra details"} · {fmtDate(r.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`${SITE}${r.pagePath || `${PROFILE_PATH[r.targetType] || ""}/${r.targetSlug}`}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink size={13} /> Profile
                    </a>
                    <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      <Mail size={13} /> Email
                    </a>
                    <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-green-50/60 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-green-700">What they like</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{r.pros}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50/60 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">What could be better</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{r.cons}</p>
                  </div>
                </div>

                {details.length > 0 ? (
                  <p className="mt-2 text-xs text-gray-500">
                    {details.map(([k, v]) => `${DETAIL_LABEL[k] || k}: ${v}/5`).join("  ·  ")}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  {r.status !== "approved" ? (
                    <button onClick={() => setReviewStatus(r, "approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-green-700">
                      <Check size={15} /> Approve
                    </button>
                  ) : (
                    <button onClick={() => setReviewStatus(r, "pending")} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      Take it off the website
                    </button>
                  )}
                  {r.status !== "rejected" ? (
                    <button onClick={() => setReviewStatus(r, "rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                      <X size={15} /> Reject
                    </button>
                  ) : null}
                  <input
                    value={notes[r._id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                    placeholder="Internal note (not shown on the website)"
                    className="min-w-[200px] flex-1 rounded-lg border px-3 py-1.5 text-sm"
                  />
                  <button onClick={() => saveNote(r)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Save note</button>
                </div>
              </div>
            );
          })}
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
