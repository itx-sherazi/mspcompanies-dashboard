"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchCitiesAdmin,
  createCityAdmin,
  updateCityAdmin,
  deleteCityAdmin,
} from "@/services/api";
import CityContentEditor from "../CityHub/CityContentEditor";
import {
  Globe,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  Pencil,
} from "lucide-react";

const FRONTEND_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

const HUB_SLUG = "top-msps";
const BASE_PATH = "/top-msps";

export default function CountryHubManagement() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    heading: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
    faqs: [],
  });
  const [editingContentCountry, setEditingContentCountry] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const refreshCountries = useCallback(async () => {
    setLoading(true);
    const res = await fetchCitiesAdmin(HUB_SLUG);
    if (res.data?.ok && Array.isArray(res.data.data)) {
      setCountries(res.data.data);
    } else {
      toast.error(res.data?.message || "Could not load countries");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refreshCountries();
    });
    return () => {
      cancelled = true;
    };
  }, [refreshCountries]);

  if (editingContentCountry) {
    return (
      <CityContentEditor
        cityData={editingContentCountry}
        onBack={() => setEditingContentCountry(null)}
        refreshData={refreshCountries}
      />
    );
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Country name and URL slug are required");
      return;
    }
    if (!form.heading.trim()) {
      toast.error("Page heading (H1) is required for the public country page");
      return;
    }
    if (!form.metaTitle.trim() || !form.metaDescription.trim()) {
      toast.error("Meta title and meta description are required for SEO");
      return;
    }
    setCreating(true);
    const res = await createCityAdmin({ ...form, hubSlug: HUB_SLUG });
    setCreating(false);
    if (res.data?.ok) {
      toast.success("Country created");
      setForm({
        name: "",
        slug: "",
        heading: "",
        metaTitle: "",
        metaDescription: "",
        isPublished: false,
        faqs: [],
      });
      refreshCountries();
    } else {
      toast.error(res.data?.message || "Create failed");
    }
  };

  const togglePublish = async (country) => {
    const res = await updateCityAdmin(country._id, {
      isPublished: !country.isPublished,
    });
    if (res.data?.ok) {
      toast.success(country.isPublished ? "Unpublished" : "Published");
      refreshCountries();
    } else {
      toast.error(res.data?.message || "Update failed");
    }
  };

  const handleDelete = async (country) => {
    if (
      !confirm(
        `Delete country page "${country.name}"? The public /top-msps/${country.slug} page and its SEO will be removed. Companies stay in Managed IT.`,
      )
    )
      return;
    const res = await deleteCityAdmin(country._id);
    if (res.data?.ok) {
      toast.success("Country removed");
      refreshCountries();
    } else {
      toast.error(res.data?.message || "Delete failed");
    }
  };

  const openEditCountry = (country) => {
    setEditTarget(country);
    setEditForm({
      name: country.name || "",
      slug: country.slug || "",
      heading:
        (country.heading && String(country.heading).trim()) ||
        (country.metaTitle && String(country.metaTitle).trim()) ||
        "",
      metaTitle: country.metaTitle || "",
      metaDescription: country.metaDescription || "",
      isPublished: Boolean(country.isPublished),
      faqs: Array.isArray(country.faqs)
        ? country.faqs.map((f) => ({
            question: f.question || "",
            answer: f.answer || "",
          }))
        : [],
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editTarget || !editForm) return;
    if (!editForm.name.trim() || !editForm.slug.trim()) {
      toast.error("Country name and URL slug are required");
      return;
    }
    if (!editForm.heading.trim()) {
      toast.error("Page heading (H1) is required");
      return;
    }
    if (!editForm.metaTitle.trim() || !editForm.metaDescription.trim()) {
      toast.error("Meta title and meta description are required for SEO");
      return;
    }
    setSavingEdit(true);
    const res = await updateCityAdmin(editTarget._id, {
      name: editForm.name.trim(),
      slug: editForm.slug.trim(),
      heading: editForm.heading.trim(),
      metaTitle: editForm.metaTitle.trim(),
      metaDescription: editForm.metaDescription.trim(),
      isPublished: editForm.isPublished,
      faqs: editForm.faqs || [],
    });
    setSavingEdit(false);
    if (res.data?.ok) {
      toast.success("Country updated");
      setEditTarget(null);
      setEditForm(null);
      refreshCountries();
    } else {
      toast.error(res.data?.message || "Update failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="rounded-2xl bg-linear-to-br from-[#0356A6] to-[#0A2E65] p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/15 p-3">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Top MSPs by Country hub pages
            </h1>
            <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-2xl">
              Public URLs:{" "}
              <code className="bg-black/20 px-2 py-0.5 rounded text-xs sm:text-sm">
                /top-msps/your-country
              </code>
              . Create and edit country SEO here. Company cards come from the{" "}
              <strong>Managed IT master sheet</strong>{" "}
              (<code className="bg-black/20 px-1.5 py-0.5 rounded text-xs">Company Country</code>
              {" "}e.g. United States → /top-msps/united-states).
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#0356A6]" />
            Add country
          </h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Country name <span className="text-slate-400 font-normal">(breadcrumb, lists)</span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Germany"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Page heading (H1) <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal"> (public hero not meta title)</span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                value={form.heading}
                onChange={(e) =>
                  setForm({ ...form, heading: e.target.value })
                }
                placeholder="e.g. Top Managed Service Providers in Germany"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                URL slug
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
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
                placeholder="e.g. germany"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Meta title <span className="text-red-500">*</span>{" "}
                <span className="text-slate-400 font-normal">
                  (SEO only &lt;title&gt; &amp; social)
                </span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                value={form.metaTitle}
                onChange={(e) =>
                  setForm({ ...form, metaTitle: e.target.value })
                }
                placeholder="e.g. Top 100 Managed Service Providers in Germany | mspcompanies"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Meta description <span className="text-red-500">*</span>{" "}
                <span className="text-slate-400 font-normal">
                  (search snippet, ~150–170 chars)
                </span>
              </label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                value={form.metaDescription}
                onChange={(e) =>
                  setForm({ ...form, metaDescription: e.target.value })
                }
                placeholder="Short SEO description for this country page…"
                required
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  FAQs (optional)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      faqs: [...(form.faqs || []), { question: "", answer: "" }],
                    })
                  }
                  className="text-xs font-semibold text-[#0356A6] hover:underline"
                >
                  + Add FAQ
                </button>
              </div>
              {(form.faqs || []).length === 0 ? (
                <p className="text-xs text-slate-500">
                  Shown below the country guide on the public page (SEO-friendly
                  accordion).
                </p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {(form.faqs || []).map((faq, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(form.faqs || [])];
                          next.splice(index, 1);
                          setForm({ ...form, faqs: next });
                        }}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-600 text-xs"
                        aria-label="Remove FAQ"
                      >
                        ✕
                      </button>
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...(form.faqs || [])];
                          next[index] = {
                            ...next[index],
                            question: e.target.value,
                          };
                          setForm({ ...form, faqs: next });
                        }}
                      />
                      <textarea
                        rows={2}
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Answer"
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...(form.faqs || [])];
                          next[index] = {
                            ...next[index],
                            answer: e.target.value,
                          };
                          setForm({ ...form, faqs: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
              />
              Publish immediately
            </label>
            <button
              type="submit"
              disabled={creating}
              className="w-full sm:w-auto rounded-xl bg-linear-to-r from-orange-500 to-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-orange-600 hover:to-red-600 disabled:opacity-60"
            >
              {creating ? "Saving…" : "Create country"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-6 shadow-sm">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Companies come from Managed IT
          </h3>
          <ul className="mt-3 text-sm text-blue-950/90 space-y-2 list-disc pl-5">
            <li>
              Upload the master Excel in <strong>Managed IT Services</strong>.
            </li>
            <li>
              <code className="bg-white/70 px-1 rounded">Company Country</code>{" "}
              must match this country name (United States → /top-msps/united-states).
            </li>
            <li>
              This screen only manages the country page: URL, H1, meta, content,
              FAQ.
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <h2 className="text-lg font-semibold text-slate-900">Countries</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            SEO and publish only. Company cards are filtered from the Managed IT master sheet.
          </p>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading…</div>
        ) : countries.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No countries yet. Create one on the left.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {countries.map((country) => (
              <li
                key={country._id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50"
              >
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    {country.name}
                    {country.isPublished ? (
                      <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-1 font-mono">
                    {BASE_PATH}/{country.slug}
                  </div>
                  <div
                    className={`text-xs mt-1 font-medium ${
                      (country.companyCount || 0) > 0 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {country.companyCount || 0} {(country.companyCount || 0) === 1 ? "company" : "companies"}
                    {(country.companyCount || 0) === 0 ? " — none on this country page yet" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`${FRONTEND_BASE}${BASE_PATH}/${country.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0356A6] hover:bg-[#F5FAFF]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditingContentCountry(country)}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-800 hover:bg-purple-100"
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCountry(country)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublish(country)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {country.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Publish
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    title="Delete country"
                    onClick={() => handleDelete(country)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editTarget && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 my-8">
            <h3 className="text-xl font-bold text-slate-900">
              Edit country {editTarget.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Changing the URL slug updates public links for this country page.
            </p>
            <form onSubmit={handleEditSave} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Country name <span className="text-slate-400 font-normal">(breadcrumb)</span>
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Page heading (H1) <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                  value={editForm.heading}
                  onChange={(e) =>
                    setEditForm({ ...editForm, heading: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  URL slug
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0356A6]/30 focus:border-[#0356A6]"
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Meta title <span className="text-red-500">*</span>{" "}
                  <span className="text-slate-400 font-normal">(SEO only)</span>
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={editForm.metaTitle}
                  onChange={(e) =>
                    setEditForm({ ...editForm, metaTitle: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Meta description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={editForm.metaDescription}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      metaDescription: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    FAQs (optional)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        faqs: [
                          ...(editForm.faqs || []),
                          { question: "", answer: "" },
                        ],
                      })
                    }
                    className="text-xs font-semibold text-[#0356A6] hover:underline"
                  >
                    + Add FAQ
                  </button>
                </div>
                {(editForm.faqs || []).length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Rich page content uses the <strong>Content</strong> button;
                    FAQs are edited here.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {(editForm.faqs || []).map((faq, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 relative"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...(editForm.faqs || [])];
                            next.splice(index, 1);
                            setEditForm({ ...editForm, faqs: next });
                          }}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-600 text-xs"
                          aria-label="Remove FAQ"
                        >
                          ✕
                        </button>
                        <input
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => {
                            const next = [...(editForm.faqs || [])];
                            next[index] = {
                              ...next[index],
                              question: e.target.value,
                            };
                            setEditForm({ ...editForm, faqs: next });
                          }}
                        />
                        <textarea
                          rows={2}
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                          placeholder="Answer"
                          value={faq.answer}
                          onChange={(e) => {
                            const next = [...(editForm.faqs || [])];
                            next[index] = {
                              ...next[index],
                              answer: e.target.value,
                            };
                            setEditForm({ ...editForm, faqs: next });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.isPublished}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isPublished: e.target.checked })
                  }
                />
                Published
              </label>
              <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
                  onClick={() => {
                    setEditTarget(null);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg bg-[#0356A6] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
