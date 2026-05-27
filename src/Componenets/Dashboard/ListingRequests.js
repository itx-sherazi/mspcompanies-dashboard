"use client";
import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "@/services/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

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

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API}/api/v1/listing-requests?${params}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(data.data);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/listing-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await res.json();
      if (data.ok) {
        setSelected(null);
        setAdminNote("");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRequest = async (id) => {
    if (!confirm("Delete this listing request?")) return;
    try {
      await fetch(`${API}/api/v1/listing-requests/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
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
      </div>

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
                    <p className="text-xs text-gray-500">{req.contactEmail} · {req.personOfContact} ({req.jobTitle})</p>
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
                  <button onClick={() => { setSelected(req); setAdminNote(req.adminNote || ""); }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelected(null)}>
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
              <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_COLORS[selected.status]}`}>
                {selected.status}
              </span>
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

            <div className="mt-5 border-t border-gray-100 pt-4">
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
              <button onClick={() => setSelected(null)}
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
