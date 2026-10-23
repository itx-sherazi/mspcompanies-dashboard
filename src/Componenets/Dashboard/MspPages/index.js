"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchCitiesAdmin,
  fetchCityAdmin,
  createCityAdmin,
  updateCityAdmin,
  deleteCityAdmin,
  deleteCityHubCompany,
} from "@/services/api";
import AllHubCompaniesTab from "../CityHub/AllHubCompaniesTab";
import CityContentEditor from "../CityHub/CityContentEditor";
import { formatUpdated, byUpdated } from "../formatUpdated";
import { Search, Plus, Trash2, Eye, EyeOff, ExternalLink, Pencil, Users, FileText, X } from "lucide-react";

const FRONTEND_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

const HUBS = {
  "managed-service-providers": { label: "City and state", base: "/msp" },
  "top-msps": { label: "Country", base: "/top-msps" },
};

const EMPTY = { hubSlug: "managed-service-providers", name: "", slug: "", state: "", heading: "", metaTitle: "", metaDescription: "", isPublished: false, faqs: [] };

const pageUrl = (p) => `${HUBS[p.hubSlug]?.base || "/msp"}/${p.slug}`;

/** One list of every Managed IT page: /msp/{city or state} and /top-msps/{country}. */
export default function MspPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contentPage, setContentPage] = useState(null);
  const [companiesTarget, setCompaniesTarget] = useState(null);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesHub, setCompaniesHub] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([fetchCitiesAdmin("managed-service-providers"), fetchCitiesAdmin("top-msps")]);
    if (a.data?.ok && b.data?.ok) {
      setPages([...(a.data.data || []), ...(b.data.data || [])].map((p) => ({ ...p, hubSlug: p.hubSlug || "managed-service-providers" })));
    } else {
      toast.error(a.data?.message || b.data?.message || "Could not load pages");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  const counts = useMemo(() => {
    const c = { all: pages.length, "managed-service-providers": 0, "top-msps": 0 };
    for (const p of pages) if (c[p.hubSlug] !== undefined) c[p.hubSlug] += 1;
    return c;
  }, [pages]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return pages
      .filter((p) => hub === "all" || p.hubSlug === hub)
      .filter((p) => status === "all" || (status === "live" ? p.isPublished : !p.isPublished))
      .filter((p) => !term || `${p.name} ${p.slug} ${p.state || ""}`.toLowerCase().includes(term))
      .sort((x, y) => (sort === "updated" ? byUpdated(x, y) : 0) || String(x.name).localeCompare(String(y.name)));
  }, [pages, hub, status, q, sort]);

  const openEdit = (p) =>
    setForm({
      id: p._id,
      hubSlug: p.hubSlug,
      name: p.name || "",
      slug: p.slug || "",
      state: p.state || "",
      heading: p.heading || p.metaTitle || "",
      metaTitle: p.metaTitle || "",
      metaDescription: p.metaDescription || "",
      isPublished: Boolean(p.isPublished),
      faqs: (p.faqs || []).map((f) => ({ question: f.question || "", answer: f.answer || "" })),
    });

  const save = async (e) => {
    e.preventDefault();
    const f = form;
    if (!f.name.trim() || !f.slug.trim()) return toast.error("Name and URL slug are required");
    if (!f.heading.trim()) return toast.error("Page heading (H1) is required");
    if (!f.metaTitle.trim() || !f.metaDescription.trim()) return toast.error("Meta title and meta description are required");
    const body = {
      name: f.name.trim(),
      slug: f.slug.trim(),
      state: f.state.trim(),
      heading: f.heading.trim(),
      metaTitle: f.metaTitle.trim(),
      metaDescription: f.metaDescription.trim(),
      isPublished: f.isPublished,
      faqs: f.faqs.filter((x) => x.question.trim() && x.answer.trim()),
    };
    setSaving(true);
    const res = f.id ? await updateCityAdmin(f.id, body) : await createCityAdmin({ ...body, hubSlug: f.hubSlug });
    setSaving(false);
    if (res.data?.ok) {
      toast.success(f.id ? "Page updated" : "Page created");
      setForm(null);
      refresh();
    } else {
      toast.error(res.data?.message || "Save failed");
    }
  };

  const togglePublish = async (p) => {
    const res = await updateCityAdmin(p._id, { isPublished: !p.isPublished });
    if (res.data?.ok) {
      toast.success(p.isPublished ? "Unpublished" : "Published");
      refresh();
    } else toast.error(res.data?.message || "Update failed");
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}" (${pageUrl(p)})? Its ${p.companyCount || 0} company copies go with it. The main directory stays.`)) return;
    const res = await deleteCityAdmin(p._id);
    if (res.data?.ok) {
      toast.success("Page removed");
      refresh();
    } else toast.error(res.data?.message || "Delete failed");
  };

  const openContent = async (p) => {
    const res = await fetchCityAdmin(p._id, { include: "content" });
    if (res.data?.ok && res.data.data) setContentPage(res.data.data);
    else toast.error(res.data?.message || "Could not load the page text");
  };

  const openCompanies = async (p) => {
    setCompaniesLoading(true);
    setCompaniesTarget({ ...p, hubCompanies: [] });
    const res = await fetchCityAdmin(p._id, { include: "companies" });
    setCompaniesLoading(false);
    if (res.data?.ok && res.data.data) setCompaniesTarget(res.data.data);
    else {
      setCompaniesTarget(null);
      toast.error(res.data?.message || "Could not load companies");
    }
  };

  const removeCompany = async (page, c) => {
    if (!confirm(`Remove "${c.companyName || c.slug}" from "${page.name}" only? The main directory keeps it.`)) return;
    const res = await deleteCityHubCompany(page._id, c.slug);
    if (res.data?.ok) {
      toast.success("Removed from this page");
      setCompaniesTarget((t) => (t ? { ...t, hubCompanies: (t.hubCompanies || []).filter((x) => x.slug !== c.slug) } : t));
      refresh();
    } else toast.error(res.data?.message || "Remove failed");
  };

  if (contentPage) {
    return <CityContentEditor cityData={contentPage} onBack={() => setContentPage(null)} refreshData={refresh} />;
  }

  if (companiesHub) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        <button onClick={() => setCompaniesHub(null)} className="text-sm font-semibold text-[#0356A6] hover:underline">Back to pages</button>
        <AllHubCompaniesTab hubSlug={companiesHub} basePath={HUBS[companiesHub].base} />
      </div>
    );
  }

  const chip = (key, label, n) => (
    <button key={key} onClick={() => setHub(key)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${hub === key ? "bg-[#0356A6] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      {label} <span className="opacity-70">{n}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <div className="rounded-2xl bg-linear-to-br from-[#0356A6] to-[#0A2E65] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">MSP city, state and country pages</h1>
        <p className="mt-1 text-sm text-blue-100">Every Managed IT page in one list: /msp/(city or state) and /top-msps/(country).</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip("all", "All", counts.all)}
        {chip("managed-service-providers", "City and state", counts["managed-service-providers"])}
        {chip("top-msps", "Country", counts["top-msps"])}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
          <option value="updated">Recently updated first</option>
          <option value="name">Name A to Z</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
          <option value="all">Any status</option>
          <option value="live">Published</option>
          <option value="draft">Unpublished</option>
        </select>
        <div className="relative ml-auto min-w-52 flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, slug or state" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" />
        </div>
        <button onClick={() => setForm({ ...EMPTY, hubSlug: hub === "top-msps" ? "top-msps" : "managed-service-providers" })} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0356A6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02407c]">
          <Plus size={15} /> Add page
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <button onClick={() => setCompaniesHub("managed-service-providers")} className="underline hover:text-[#0356A6]">All /msp companies</button>
        <button onClick={() => setCompaniesHub("top-msps")} className="underline hover:text-[#0356A6]">All /top-msps companies</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Page</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Companies</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No pages match.</td></tr>
            ) : (
              shown.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="font-mono text-xs text-slate-400">{pageUrl(p)}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{HUBS[p.hubSlug]?.label}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.state || "-"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.companyCount ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.isPublished ? "Published" : "Unpublished"}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500" title={p.editedApprox && p.editedAt ? "Close to the last edit: this page was edited before the edit time was kept. A sheet upload can move it later." : "When this page was last edited here. A sheet upload does not change it."}>{formatUpdated(p.editedAt, p.editedApprox)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1 text-slate-500">
                      <button title="Edit details and SEO" onClick={() => openEdit(p)} className="rounded p-1.5 hover:bg-slate-100"><Pencil size={15} /></button>
                      <button title="Edit page content (editor)" onClick={() => openContent(p)} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-[#0356A6] hover:bg-blue-100"><FileText size={14} /> Content</button>
                      <button title="Companies on this page" onClick={() => openCompanies(p)} className="rounded p-1.5 hover:bg-slate-100"><Users size={15} /></button>
                      <button title={p.isPublished ? "Unpublish" : "Publish"} onClick={() => togglePublish(p)} className="rounded p-1.5 hover:bg-slate-100">{p.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                      <a title="Open live page" href={`${FRONTEND_BASE}${pageUrl(p)}`} target="_blank" rel="noreferrer" className="rounded p-1.5 hover:bg-slate-100"><ExternalLink size={15} /></a>
                      <button title="Delete" onClick={() => remove(p)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">Showing {shown.length} of {pages.length} pages.</p>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={save} className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{form.id ? "Edit page" : "Add page"}</h2>
              <button type="button" onClick={() => setForm(null)} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {!form.id ? (
              <div>
                <label className="text-xs font-medium text-slate-600">Type</label>
                <select value={form.hubSlug} onChange={(e) => setForm({ ...form, hubSlug: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="managed-service-providers">City or state page (/msp/...)</option>
                  <option value="top-msps">Country page (/top-msps/...)</option>
                </select>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="URL slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} mono />
              {form.hubSlug === "managed-service-providers" ? <Field label="State (optional)" value={form.state} onChange={(v) => setForm({ ...form, state: v })} /> : null}
              <Field label="Page heading (H1)" value={form.heading} onChange={(v) => setForm({ ...form, heading: v })} />
            </div>
            <Field label="Meta title" value={form.metaTitle} onChange={(v) => setForm({ ...form, metaTitle: v })} />
            <div>
              <label className="text-xs font-medium text-slate-600">Meta description</label>
              <textarea rows={3} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">FAQs</label>
                <button type="button" onClick={() => setForm({ ...form, faqs: [...form.faqs, { question: "", answer: "" }] })} className="text-xs font-semibold text-[#0356A6]">Add FAQ</button>
              </div>
              {form.faqs.map((f, i) => (
                <div key={i} className="space-y-1 rounded-lg border border-slate-200 p-3">
                  <input placeholder="Question" value={f.question} onChange={(e) => setForm({ ...form, faqs: form.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <textarea rows={2} placeholder="Answer" value={f.answer} onChange={(e) => setForm({ ...form, faqs: form.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, j) => j !== i) })} className="text-xs text-red-500">Remove</button>
                </div>
              ))}
            </div>
            {form.id ? (
              <button type="button" onClick={() => { const id = form.id; setForm(null); openContent({ _id: id }); }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0356A6] px-3 py-2 text-sm font-semibold text-[#0356A6] hover:bg-blue-50">
                <FileText size={15} /> Edit page content (shows below the companies)
              </button>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm(null)} className="flex-1 rounded-lg border py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button disabled={saving} className="flex-1 rounded-lg bg-[#0356A6] py-2 text-sm font-semibold text-white hover:bg-[#02407c] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {companiesTarget ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Companies on {companiesTarget.name} <span className="font-mono text-xs font-normal text-slate-400">{pageUrl(companiesTarget)}</span></h2>
              <button onClick={() => setCompaniesTarget(null)} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {companiesLoading ? (
              <p className="py-8 text-center text-slate-400">Loading...</p>
            ) : (companiesTarget.hubCompanies || []).length === 0 ? (
              <p className="py-8 text-center text-slate-400">No companies on this page.</p>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
                {companiesTarget.hubCompanies.map((c) => (
                  <li key={c.slug} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="truncate font-medium text-slate-800">{c.companyName || c.slug}</span>
                    <button onClick={() => removeCompany(companiesTarget, c)} className="shrink-0 text-xs font-semibold text-red-500 hover:underline">Remove from page</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-400">To edit a company itself, use the All Companies tab. The next Master Sheet import fills this list again.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, mono }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
