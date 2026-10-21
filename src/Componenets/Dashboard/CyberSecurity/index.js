"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchCyberSecurityAdmin, deleteCyberSecurityCompany } from "@/services/api";
import { Search, Trash2, Shield, ChevronLeft, ChevronRight, Globe, MapPin, ExternalLink } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

/** The companies of the cybersecurity directory. The directory is filled from Master Sheet > Cybersecurity sheet. */
export default function CyberSecurityManagement() {
  const [companies, setCompanies]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    const res = await fetchCyberSecurityAdmin({ q, page: p, limit: 50 });
    if (res.data?.ok) {
      setCompanies(res.data.data || []);
      setTotal(res.data.total || 0);
      setEligibleTotal(res.data.eligibleTotal || 0);
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
    const res = await deleteCyberSecurityCompany(slug);
    if (res.data?.ok) {
      toast.success("Company deleted");
      load(page, search);
    } else {
      toast.error(res.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shield size={22} className="text-[#1d4882]" />
          Cybersecurity Companies Directory
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total.toLocaleString()} companies, {eligibleTotal.toLocaleString()} Index Eligible · /cybersecurity-companies. To add or replace companies,
          use Master Sheet &gt; Cybersecurity sheet.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
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
        <button type="submit" className="px-4 py-2 bg-[#1d4882] text-white rounded-lg text-sm font-semibold hover:bg-[#163a6e]">Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); load(1, ""); }} className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Clear</button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#1d4882] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <Shield size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No companies found. Upload the cybersecurity sheet in Master Sheet to get started.</p>
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
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Employees</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Index</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Links</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Delete</th>
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
                      {c.companyCity || c.companyState || c.companyCountry ? (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin size={11} className="text-gray-400" />
                          {[c.companyCity, c.companyState, c.companyCountry].filter(Boolean).join(", ")}
                        </span>
                      ) : <span className="text-gray-300 text-xs">none</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.employees || ""}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${c.indexEligible ? "text-emerald-600" : "text-gray-400"}`}>{c.indexEligible ? "Y" : "N"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#1d4882] hover:underline">
                            <Globe size={11} /> Website
                          </a>
                        ) : null}
                        <a href={`${SITE}/cybersecurity-companies/${c.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#1d4882] hover:underline">
                          <ExternalLink size={11} /> Profile
                        </a>
                      </div>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total.toLocaleString()} total</p>
              <div className="flex gap-1">
                <button onClick={() => load(page - 1, search)} disabled={page <= 1} className="p-1.5 rounded border text-gray-600 hover:bg-white disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => load(page + 1, search)} disabled={page >= totalPages} className="p-1.5 rounded border text-gray-600 hover:bg-white disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
