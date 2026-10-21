"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchVendors, fetchCategories } from "@/services/api";
import { Pencil, RefreshCw, Search } from "lucide-react";

const PAGE = 100;

/**
 * Vendors that are not on any public /best/{category} page. A vendor shows on a category page only when that
 * category has a published page, so a vendor whose categories have no page yet is invisible there.
 */
export default function UnlistedVendors({ onEdit }) {
  const [vendors, setVendors] = useState([]);
  const [published, setPublished] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const cats = await fetchCategories({ status: "published" });
    if (!cats.data?.ok) {
      setError("Could not load the categories");
      setLoading(false);
      return;
    }
    setPublished(new Set((cats.data.data || []).map((c) => c.slug)));

    let all = [];
    for (let page = 1; page < 50; page += 1) {
      const res = await fetchVendors({ page, limit: PAGE });
      if (!res.data?.ok) {
        setError("Could not load the vendors");
        break;
      }
      all = all.concat(res.data.data || []);
      if (all.length >= (res.data.total || 0) || !(res.data.data || []).length) break;
    }
    setVendors(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unlisted = useMemo(
    () => vendors.filter((v) => !(v.categories || []).some((c) => published.has(c))),
    [vendors, published],
  );

  // Category slugs that vendors use but that have no published page yet, and how many vendors each has.
  const missing = useMemo(() => {
    const m = new Map();
    for (const v of unlisted) for (const c of v.categories || []) m.set(c, (m.get(c) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [unlisted]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unlisted.filter((v) => !q || `${v.name} ${v.slug} ${(v.categories || []).join(" ")}`.toLowerCase().includes(q));
  }, [unlisted, search]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vendors not on any category page</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            A vendor appears on /best/{"{category}"} only when that category has a published page.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading all vendors...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Vendors in database" value={vendors.length} />
            <Stat label="On a category page" value={vendors.length - unlisted.length} tone="green" />
            <Stat label="On no category page" value={unlisted.length} tone={unlisted.length ? "red" : "green"} />
            <Stat label="Category pages published" value={published.size} />
          </div>

          {missing.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-800">Categories that need a page ({missing.length})</p>
                <p className="text-xs text-gray-500">Create a page for these categories and their vendors will show up. The number is how many unlisted vendors it would bring in.</p>
              </div>
              <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto p-4">
                {missing.map(([slug, n]) => (
                  <span key={slug} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                    <span className="font-mono">{slug}</span> <b className="text-[#1d4882]">{n}</b>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-800">Vendors ({shown.length})</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a vendor or category"
                  className="rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1d4882]"
                />
              </div>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Vendor</th>
                    <th className="px-4 py-2">Categories (no page yet)</th>
                    <th className="px-4 py-2 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shown.map((v) => (
                    <tr key={v.slug} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <p className="font-semibold text-gray-800">{v.name}</p>
                        <p className="font-mono text-xs text-gray-400">{v.slug}</p>
                      </td>
                      <td className="px-4 py-2">
                        {(v.categories || []).length === 0 ? (
                          <span className="text-xs font-semibold text-red-600">No category set</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {v.categories.map((c) => (
                              <span key={c} className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[11px] text-amber-800">{c}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => onEdit(v)} className="rounded-lg p-1.5 text-gray-400 hover:bg-[#EBF3FF] hover:text-[#1d4882]" title="Edit">
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">Every vendor is on a category page.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-600" : "text-gray-900";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
