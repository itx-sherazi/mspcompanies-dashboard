"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchAllCityHubCompaniesAdmin,
  updateCityHubCompany,
  deleteCityHubCompany,
  toggleCityHubCompanySponsored,
} from "@/services/api";
import {
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

const PAGE_SIZE = 50;

const FRONTEND_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

function arrToCsv(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return v ? String(v) : "";
}

function emptyForm() {
  return {
    slug: "",
    companyName: "",
    description: "",
    address: "",
    companyStreet: "",
    companyCity: "",
    companyPostalCode: "",
    companyServices: "",
    companyPartners: "",
    industryTags: "",
    keywords: "",
    employees: "",
    foundedYear: "",
    phone: "",
    image: "",
    website: "",
    linkedinUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    naicsCodes: "",
    sicCodes: "",
    technologies: "",
    vars: "",
  };
}

function rowToForm(row) {
  return {
    slug: row.slug || "",
    companyName: row.companyName || "",
    description: row.description || "",
    address: row.address || "",
    companyStreet: row.companyStreet || "",
    companyCity: row.companyCity || "",
    companyPostalCode: row.companyPostalCode || "",
    companyServices: arrToCsv(row.companyServices),
    companyPartners: arrToCsv(row.companyPartners),
    industryTags: arrToCsv(row.industryTags),
    keywords: arrToCsv(row.keywords),
    employees: row.employees || "",
    foundedYear:
      row.foundedYear !== null && row.foundedYear !== undefined
        ? String(row.foundedYear)
        : "",
    phone: row.phone || "",
    image: row.image || "",
    website: row.website || "",
    linkedinUrl: row.linkedinUrl || "",
    facebookUrl: row.facebookUrl || "",
    twitterUrl: row.twitterUrl || "",
    naicsCodes: arrToCsv(row.naicsCodes),
    sicCodes: arrToCsv(row.sicCodes),
    technologies: arrToCsv(row.technologies),
    vars: row.vars || "",
  };
}

export default function AllHubCompaniesTab() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const searchDebounceStarted = useRef(false);

  useEffect(() => {
    const delay = searchDebounceStarted.current ? 200 : 0;
    searchDebounceStarted.current = true;
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, delay);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchAllCityHubCompaniesAdmin({
      q: debouncedQ,
      page,
      limit: PAGE_SIZE,
    });
    if (res.data?.ok && Array.isArray(res.data.data)) {
      setRows(res.data.data);
      setTotal(typeof res.data.total === "number" ? res.data.total : 0);
      setTotalPages(
        typeof res.data.totalPages === "number" ? res.data.totalPages : 1,
      );
      if (typeof res.data.page === "number" && res.data.page !== page) {
        setPage(res.data.page);
      }
    } else {
      toast.error(res.data?.message || "Could not load companies");
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    }
    setLoading(false);
  }, [debouncedQ, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (row) => {
    setEditRow(row);
    setOriginalSlug(row.slug || "");
    setForm(rowToForm(row));
    setLogoFile(null);
  };

  const closeEdit = () => {
    setEditRow(null);
    setOriginalSlug("");
    setForm(emptyForm());
    setLogoFile(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editRow) return;
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("URL slug is required");
      return;
    }

    const fd = new FormData();
    const fields = [
      "slug",
      "companyName",
      "description",
      "address",
      "companyStreet",
      "companyCity",
      "companyPostalCode",
      "companyServices",
      "companyPartners",
      "industryTags",
      "keywords",
      "employees",
      "foundedYear",
      "phone",
      "image",
      "website",
      "linkedinUrl",
      "facebookUrl",
      "twitterUrl",
      "naicsCodes",
      "sicCodes",
      "technologies",
      "vars",
    ];
    for (const key of fields) {
      if (key === "image" && logoFile) continue;
      fd.append(key, form[key] ?? "");
    }
    if (logoFile) fd.append("image", logoFile);

    setSaving(true);
    const res = await updateCityHubCompany(
      editRow.cityId,
      originalSlug,
      fd,
    );
    setSaving(false);
    if (res.data?.ok) {
      toast.success("Company updated");
      closeEdit();
      load();
    } else {
      toast.error(res.data?.message || "Update failed");
    }
  };

  const handleToggleSponsored = async (row) => {
    const key = `${row.cityId}:${row.slug}`;
    setTogglingKey(key);
    const res = await toggleCityHubCompanySponsored(row.cityId, row.slug);
    setTogglingKey(null);
    if (res.data?.ok) {
      const newVal = res.data.data?.isSponsored;
      setRows((prev) =>
        prev.map((r) =>
          r.cityId === row.cityId && r.slug === row.slug
            ? { ...r, isSponsored: newVal }
            : r,
        ),
      );
      toast.success(newVal ? "Company marked as sponsored" : "Sponsorship removed");
    } else {
      toast.error(res.data?.message || "Toggle failed");
    }
  };

  const handleDelete = async (row) => {
    const label = row.companyName || row.slug;
    if (
      !confirm(
        `Remove "${label}" from "${row.cityName}"? This only removes it from the city hub page.`,
      )
    )
      return;
    const key = `${row.cityId}:${row.slug}`;
    setDeletingKey(key);
    const res = await deleteCityHubCompany(row.cityId, row.slug);
    setDeletingKey(null);
    if (res.data?.ok) {
      toast.success("Removed from city");
      if (rows.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        load();
      }
    } else {
      toast.error(res.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search all city pages best name matches show first"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
          />
        </div>
        <p className="text-sm text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </span>
          ) : (
            <>
              {total === 0 ? (
                <>0 companies</>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>{" "}
                  of <span className="font-medium text-slate-700">{total}</span>
                </>
              )}
            </>
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">City page</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">
                  Slug
                </th>
                <th className="px-4 py-3 font-semibold text-right w-40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    {debouncedQ.trim()
                      ? "No companies match this search across city pages."
                      : "No companies on any city page yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const dkey = `${row.cityId}:${row.slug}`;
                  return (
                    <tr key={dkey} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900">
                            {row.companyName}
                          </span>
                          {row.isSponsored && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 border border-orange-300 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                              ⭐ Sponsored
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 md:hidden font-mono mt-0.5">
                          {row.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.cityName}
                        <div className="text-xs text-slate-400 font-mono">
                          /{row.citySlug}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 hidden md:table-cell">
                        {row.slug}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            disabled={togglingKey === dkey}
                            onClick={() => handleToggleSponsored(row)}
                            className={`inline-flex items-center justify-center rounded-lg border p-2 transition-colors ${row.isSponsored ? "border-orange-300 bg-orange-50 text-orange-500 hover:bg-orange-100" : "border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-orange-400"}`}
                            title={row.isSponsored ? "Remove sponsorship" : "Mark as sponsored"}
                          >
                            {togglingKey === dkey ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Star className={`w-4 h-4 ${row.isSponsored ? "fill-orange-400" : ""}`} />
                            )}
                          </button>
                          <a
                            href={`${FRONTEND_BASE}/managed-service-providers/${row.citySlug}/${row.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-[#0356A6] hover:bg-[#F5FAFF]"
                            title="View on site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingKey === dkey}
                            onClick={() => handleDelete(row)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            title="Remove from city"
                          >
                            {deletingKey === dkey ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/80">
            <p className="text-xs text-slate-600">
              Page {page} of {totalPages}
              {debouncedQ.trim() ? (
                <span className="text-slate-500">
                  {" "}
                  · name matches sorted first
                </span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editRow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 my-6 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">
              Edit company {editRow.cityName}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Changes apply only to this city hub listing. Lists use commas
              between items (services, tags, etc.).
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Company name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    URL slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Founded year
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.foundedYear}
                    onChange={(e) =>
                      setForm({ ...form, foundedYear: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Short description
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Logo
                </p>
                {form.image ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.image}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover border border-slate-200 bg-white"
                    />
                    <p className="text-xs text-slate-500 break-all flex-1">
                      Current URL replace by uploading a new file below.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> No logo yet
                  </p>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Logo image file (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full text-sm"
                    onChange={(e) =>
                      setLogoFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Or logo URL
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Address (single line)
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Street
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.companyStreet}
                    onChange={(e) =>
                      setForm({ ...form, companyStreet: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    City
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.companyCity}
                    onChange={(e) =>
                      setForm({ ...form, companyCity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Postal code
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.companyPostalCode}
                    onChange={(e) =>
                      setForm({ ...form, companyPostalCode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Phone
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Employees
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.employees}
                    onChange={(e) =>
                      setForm({ ...form, employees: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Website
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    LinkedIn
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.linkedinUrl}
                    onChange={(e) =>
                      setForm({ ...form, linkedinUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Facebook
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.facebookUrl}
                    onChange={(e) =>
                      setForm({ ...form, facebookUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Twitter / X
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.twitterUrl}
                    onChange={(e) =>
                      setForm({ ...form, twitterUrl: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Company services (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.companyServices}
                    onChange={(e) =>
                      setForm({ ...form, companyServices: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Partners (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.companyPartners}
                    onChange={(e) =>
                      setForm({ ...form, companyPartners: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Industry tags
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.industryTags}
                    onChange={(e) =>
                      setForm({ ...form, industryTags: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Keywords
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.keywords}
                    onChange={(e) =>
                      setForm({ ...form, keywords: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    NAICS codes
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.naicsCodes}
                    onChange={(e) =>
                      setForm({ ...form, naicsCodes: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    SIC codes
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.sicCodes}
                    onChange={(e) =>
                      setForm({ ...form, sicCodes: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Technologies (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.technologies}
                    onChange={(e) =>
                      setForm({ ...form, technologies: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    VARS
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.vars}
                    onChange={(e) =>
                      setForm({ ...form, vars: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
                  onClick={closeEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#0356A6] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
