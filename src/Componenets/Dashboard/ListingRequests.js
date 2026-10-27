"use client";
import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "@/services/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

// The deal with a company, apart from the listing status: who pays and when, who is not interested, who gives a link.
const DEALS = [
  { key: "new", label: "New", badge: "bg-gray-100 text-gray-600 border-gray-200", chip: "border-gray-300 text-gray-700" },
  { key: "following_up", label: "Following up", badge: "bg-sky-100 text-sky-700 border-sky-200", chip: "border-sky-300 text-sky-700" },
  { key: "paid", label: "Paid", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", chip: "border-emerald-300 text-emerald-700" },
  { key: "link_exchange", label: "Link exchange", badge: "bg-violet-100 text-violet-700 border-violet-200", chip: "border-violet-300 text-violet-700" },
  { key: "not_interested", label: "Not interested", badge: "bg-rose-100 text-rose-700 border-rose-200", chip: "border-rose-300 text-rose-700" },
];
const dealOf = (key) => DEALS.find((d) => d.key === key) || DEALS[0];
const day = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const dayInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const money = (n) => (typeof n === "number" ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "");

export default function ListingRequests() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [dealFilter, setDealFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deals, setDeals] = useState({});
  const [mailFilter, setMailFilter] = useState("");
  const [mails, setMails] = useState({ sent: 0, pending: 0 });
  const [paidTotal, setPaidTotal] = useState(0);
  const [dealForm, setDealForm] = useState({ deal: "new", paidAt: "", paidAmount: "", linkExchangeUrl: "" });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set("status", statusFilter);
      if (dealFilter) params.set("deal", dealFilter);
      if (mailFilter) params.set("mail", mailFilter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`${API}/api/v1/listing-requests?${params}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(data.data);
        setTotal(data.total);
        setPages(data.pages);
        setDeals(data.deals || {});
        setMails(data.mails || { sent: 0, pending: 0 });
        setPaidTotal(data.paidTotal || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dealFilter, mailFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`${API}/api/v1/listing-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await res.json();
      if (!data.ok) {
        setActionError(data.message || "No city found");
        return;
      }
      if (status === "approved" && data.published) {
        setActionSuccess(`Approved and added to ${data.published.cityName}`);
      } else if (status === "approved") {
        setActionSuccess("Approved");
      }
      setSelected(null);
      setAdminNote("");
      fetchRequests();
    } catch (err) {
      console.error(err);
      setActionError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Saves the deal of a company. `extra` carries the date, the amount, the link and the note.
  const saveDeal = async (id, deal, extra = {}) => {
    setActionError("");
    try {
      const res = await fetch(`${API}/api/v1/listing-requests/${id}/deal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ deal, ...extra }),
      });
      const data = await res.json();
      if (!data.ok) {
        setActionError(data.message || "Could not save the deal");
        return false;
      }
      setActionSuccess(`${dealOf(deal).label} saved`);
      fetchRequests();
      return data.data;
    } catch (err) {
      console.error(err);
      setActionError("Something went wrong. Please try again.");
      return false;
    }
  };

  // The tick of "mail sent": the company has been written to.
  const setMailSent = async (id, sent) => {
    setActionError("");
    try {
      const res = await fetch(`${API}/api/v1/listing-requests/${id}/mail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ sent }),
      });
      const data = await res.json();
      if (!data.ok) return setActionError(data.message || "Could not save");
      fetchRequests();
    } catch (err) {
      console.error(err);
      setActionError("Something went wrong. Please try again.");
    }
  };

  const openReview = (req) => {
    setSelected(req);
    setAdminNote(req.adminNote || "");
    setActionError("");
    setDealForm({ deal: req.deal || "new", paidAt: dayInput(req.paidAt), paidAmount: req.paidAmount ?? "", linkExchangeUrl: req.linkExchangeUrl || "" });
  };

  const submitDeal = async () => {
    const saved = await saveDeal(selected._id, dealForm.deal, {
      paidAt: dealForm.deal === "paid" ? dealForm.paidAt || undefined : undefined,
      paidAmount: dealForm.deal === "paid" ? dealForm.paidAmount : undefined,
      linkExchangeUrl: dealForm.deal === "link_exchange" ? dealForm.linkExchangeUrl : undefined,
      adminNote,
    });
    if (saved) setSelected(saved);
  };

  const deleteRequest = async (id) => {
    const req = requests.find((r) => r._id === id);
    const live = req?.publishedCompanySlug;
    const ok = confirm(
      live
        ? `Delete "${req.companyName}"?\n\nThis also deletes the company from the directory, from every city, state and country page it is on, and its pictures from Cloudinary. It cannot be undone.`
        : `Delete the request of "${req?.companyName || "this company"}" and its logo from Cloudinary? It cannot be undone.`,
    );
    if (!ok) return;
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`${API}/api/v1/listing-requests/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) return setActionError(data.message || "Could not delete");
      const r = data.removed || {};
      const pages = (r.pages || []).map((p) => p.path).join(", ");
      setActionSuccess(
        `Deleted${r.company ? ` and removed from the directory${pages ? ` and from ${pages}` : ""}` : ""}${r.pictures ? `. ${r.pictures} picture${r.pictures === 1 ? "" : "s"} deleted from Cloudinary` : ""}.`,
      );
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Listing Requests</h2>
          <p className="text-sm text-gray-500">{total} total requests</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={mailFilter}
          onChange={(e) => { setMailFilter(e.target.value); setPage(1); }}
          aria-label="Mail"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Mail: all</option>
          <option value="sent">Mail sent ({mails.sent})</option>
          <option value="pending">Mail not sent ({mails.pending})</option>
        </select>
      </div>

      {/* The deal with each company: who pays, who is not interested, who gives a link */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setDealFilter(""); setPage(1); }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${dealFilter === "" ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            All deals
          </button>
          {DEALS.map((d) => (
            <button key={d.key} onClick={() => { setDealFilter(dealFilter === d.key ? "" : d.key); setPage(1); }}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${dealFilter === d.key ? `${d.badge} ring-2 ring-offset-1 ring-current` : `bg-white hover:bg-gray-50 ${d.chip}`}`}>
              {d.label} <span className="ml-1 opacity-70">{deals[d.key] ?? 0}</span>
            </button>
          ))}
          {paidTotal > 0 ? <span className="ml-auto text-xs font-semibold text-emerald-700">Paid in total: {money(paidTotal)}</span> : null}
        </div>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search a company, an email or a website"
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-sm" />
      </div>

      {actionSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {actionSuccess}
        </div>
      )}
      {actionError && !selected && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-500">No listing requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  {req.logoUrl ? (
                    <img src={req.logoUrl} alt={req.companyName} className="h-12 w-12 rounded-lg object-contain border border-gray-100 bg-gray-50 p-1" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-lg">
                      {req.companyName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-800">{req.companyName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{req.website || "No website"} · {req.companySize || "Size N/A"}</p>
                    <p className="text-xs text-gray-500">
                      City: <span className="font-semibold text-gray-700">{req.requestedCity || "Not specified"}</span>
                    </p>
                    <p className="text-xs text-gray-500">{req.contactEmail} · {req.personOfContact} ({req.jobTitle})</p>
                    <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
                      <input type="checkbox" checked={req.mailSent === true} onChange={(e) => setMailSent(req._id, e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                      {req.mailSent ? <span className="text-emerald-700">Mail sent{req.mailSentAt ? ` on ${day(req.mailSentAt)}` : ""}</span> : <span>Mail not sent yet</span>}
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${dealOf(req.deal).badge}`}>
                        {dealOf(req.deal).label}
                        {req.deal === "paid" && req.paidAt ? ` on ${day(req.paidAt)}` : ""}
                        {req.deal === "paid" && typeof req.paidAmount === "number" ? ` (${money(req.paidAmount)})` : ""}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                        {req.listingType === "fast" ? "Fast listing" : "Free listing"}{req.featuredAddon ? " + featured" : ""}
                      </span>
                      {req.deal === "link_exchange" && req.linkExchangeUrl ? (
                        <a href={req.linkExchangeUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-700 hover:underline">their link page</a>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {req.services?.slice(0, 4).map((s) => (
                        <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{s}</span>
                      ))}
                      {req.services?.length > 4 && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">+{req.services.length - 4} more</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_COLORS[req.status]}`}>
                    {req.status}
                  </span>
                  <select value={req.deal || "new"} onChange={(e) => saveDeal(req._id, e.target.value)} aria-label="Deal"
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DEALS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  <button onClick={() => openReview(req)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition">
                    Review
                  </button>
                  <button onClick={() => deleteRequest(req._id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              Previous
            </button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => { setSelected(null); setActionError(""); }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                {selected.logoUrl && (
                  <img src={selected.logoUrl} alt={selected.companyName} className="h-16 w-16 rounded-lg object-contain border border-gray-100 bg-gray-50 p-1 shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selected.companyName}</h3>
                  <p className="text-sm text-gray-500">{selected.contactEmail}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_COLORS[selected.status]}`}>
                  {selected.status}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${dealOf(selected.deal).badge}`}>{dealOf(selected.deal).label}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              {[
                ["Requested City", selected.requestedCity],
                ["Website", selected.website],
                ["LinkedIn", selected.linkedinUrl],
                ["Phone", selected.phone],
                ["Founded", selected.foundedYear],
                ["Company Size", selected.companySize],
                ["Address", selected.mainOfficeAddress],
                ["Contact Person", `${selected.personOfContact} ${selected.jobTitle}`],
                ["Full Name", selected.fullName],
                ["Vertical Focus", selected.verticalFocus],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex gap-2">
                  <span className="w-32 shrink-0 font-semibold text-gray-500">{label}</span>
                  <span>{val}</span>
                </div>
              ) : null)}

              {selected.companyDescription && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 leading-relaxed">{selected.companyDescription}</p>
                </div>
              )}

              {selected.certifications?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Certifications</p>
                  <div className="flex flex-wrap gap-1">{selected.certifications.map((c) => <span key={c} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{c}</span>)}</div>
                </div>
              )}
              {selected.services?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Services</p>
                  <div className="flex flex-wrap gap-1">{selected.services.map((s) => <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{s}</span>)}</div>
                </div>
              )}
              {selected.partners?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Partners</p>
                  <div className="flex flex-wrap gap-1">{selected.partners.map((p) => <span key={p} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{p}</span>)}</div>
                </div>
              )}
              {selected.note && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Note from submitter</p>
                  <p className="text-gray-700">{selected.note}</p>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-bold text-gray-800">Deal with this company</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-600">
                  Deal
                  <select value={dealForm.deal} onChange={(e) => setDealForm((f) => ({ ...f, deal: e.target.value, paidAt: e.target.value === "paid" && !f.paidAt ? dayInput(new Date()) : f.paidAt }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DEALS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                </label>
                {dealForm.deal === "paid" ? (
                  <>
                    <label className="block text-xs font-semibold text-gray-600">
                      Paid on
                      <input type="date" value={dealForm.paidAt} onChange={(e) => setDealForm((f) => ({ ...f, paidAt: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                    <label className="block text-xs font-semibold text-gray-600">
                      Amount (optional)
                      <input type="number" min="0" step="0.01" value={dealForm.paidAmount} onChange={(e) => setDealForm((f) => ({ ...f, paidAmount: e.target.value }))} placeholder="for example 299"
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </label>
                  </>
                ) : null}
                {dealForm.deal === "link_exchange" ? (
                  <label className="block text-xs font-semibold text-gray-600 sm:col-span-2">
                    The page where they link to us (optional)
                    <input value={dealForm.linkExchangeUrl} onChange={(e) => setDealForm((f) => ({ ...f, linkExchangeUrl: e.target.value }))} placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </label>
                ) : null}
              </div>
              {selected.dealUpdatedAt ? <p className="mt-2 text-[11px] text-gray-400">Deal last changed on {day(selected.dealUpdatedAt)}. The note below is saved with the deal.</p> : <p className="mt-2 text-[11px] text-gray-400">The note below is saved with the deal.</p>}
              <button onClick={submitDeal} className="mt-3 rounded-lg bg-[#1d4882] px-4 py-2 text-sm font-bold text-white hover:bg-[#163a6b] transition">Save deal</button>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              {actionError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {actionError}
                </div>
              )}
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Note</label>
              <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Internal note (optional)..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => updateStatus(selected._id, "approved")} disabled={actionLoading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition">
                ✓ Approve
              </button>
              <button onClick={() => updateStatus(selected._id, "rejected")} disabled={actionLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition">
                ✗ Reject
              </button>
              <button onClick={() => updateStatus(selected._id, "pending")} disabled={actionLoading}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">
                Mark Pending
              </button>
              <button onClick={() => { setSelected(null); setActionError(""); }}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
