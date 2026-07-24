"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchVendors, deleteVendor } from "@/services/api";
import VendorEditor from "./VendorEditor";
import VendorImport from "./VendorImport";
import { Plus, Search, Pencil, Trash2, RefreshCw, ExternalLink, ChevronDown, Upload, List } from "lucide-react";

const GROUPS = ["All Groups","MSP Software","Cybersecurity","Backup & DR","Communications","Monitoring","Compliance","Cloud","Network","AI","Microsoft","Infrastructure"];

export default function VendorManager() {
  const [innerTab, setInnerTab] = useState("list"); // "list" | "import"
  const [vendors, setVendors]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [groupFilter, setGroup]   = useState("All Groups");
  const [editing, setEditing]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = search, g = groupFilter) => {
    setLoading(true);
    const params = { limit: LIMIT, page: p };
    if (g !== "All Groups") params.group = g;
    if (s.trim()) params.search = s.trim();

    const res = await fetchVendors(params);
    if (res.data?.ok) {
      setVendors(res.data.data || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [page]);

  const handleFilter = () => { setPage(1); load(1, search, groupFilter); };

  // Auto-search on type (debounced)
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search, groupFilter); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async () => {
    if (!confirmDel) return;
    const res = await deleteVendor(confirmDel.slug);
    if (res.data?.ok) {
      toast.success(`${confirmDel.name} deleted`);
      setConfirmDel(null);
      load(page);
    } else {
      toast.error(res.data?.error || "Delete failed");
    }
  };

  const handleSaved = (savedVendor) => {
    if (editing === "new") setEditing(savedVendor);
    else load(page);
  };

  if (editing !== null) {
    return (
      <VendorEditor
        vendor={editing === "new" ? null : editing}
        onBack={() => { setEditing(null); load(page); }}
        onSaved={handleSaved}
      />
    );
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Inner tab bar */}
      <div className="border-b border-gray-200 px-6 pt-4">
        <div className="flex gap-1">
          {[
            { id: "list",   label: "All Vendors", icon: <List size={14} /> },
            { id: "import", label: "Import from Sheet", icon: <Upload size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setInnerTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold border-b-2 transition-colors ${
                innerTab === t.id ? "border-[#1d4882] text-[#1d4882]" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Import tab */}
      {innerTab === "import" && <VendorImport />}

      {/* List tab */}
      {innerTab === "list" && <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vendors</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} vendors in database</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 bg-[#1d4882] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#163a6d] transition-colors"
        >
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
        </div>

        <div className="relative">
          <select
            className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-[#1d4882] outline-none bg-white"
            value={groupFilter}
            onChange={(e) => setGroup(e.target.value)}
          >
            {GROUPS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={handleFilter}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
        >
          <RefreshCw size={13} /> Apply
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-600">No vendors found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Groups</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v.logoUrl ? (
                        <img
                          src={v.logoUrl}
                          alt={v.name}
                          className="w-8 h-8 object-contain rounded border border-gray-100 bg-white p-0.5 flex-shrink-0"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                          {v.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{v.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{v.slug}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(v.groups || []).slice(0, 2).map((g) => (
                        <span key={g} className="text-xs bg-[#EBF3FF] text-[#1d4882] px-2 py-0.5 rounded-full">{g}</span>
                      ))}
                      {(v.groups || []).length > 2 && (
                        <span className="text-xs text-gray-400">+{v.groups.length - 2}</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {v.slug && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us"}/tools/${v.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View on site"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => setEditing(v)}
                        className="p-1.5 text-gray-400 hover:text-[#1d4882] rounded-lg hover:bg-[#EBF3FF] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDel(v)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">Page {page} of {pages} · {total} total</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              ← Prev
            </button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Vendor?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{confirmDel.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>}
    </div>
  );
}
