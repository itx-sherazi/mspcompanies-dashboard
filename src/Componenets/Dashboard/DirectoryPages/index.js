"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { fetchDirectoryPages, fetchDirectoryPage, updateDirectoryPage } from "@/services/api";
import CityContentEditor from "../CityHub/CityContentEditor";
import { Search, Eye, EyeOff, ExternalLink, Pencil, FileText, X } from "lucide-react";

const FRONTEND_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

const DIRECTORIES = {
  mssp: { title: "MSSP city, state and country pages", sub: "/mssp/(country, state or city)", url: (slug) => `/mssp/${slug}` },
  cyber: { title: "Cybersecurity city, state and country pages", sub: "/cybersecurity-companies-in-(country, state or city)", url: (slug) => `/cybersecurity-companies-in-${slug}` },
};

const TYPES = [
  { key: "all", label: "All" },
  { key: "country", label: "Country" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
];

/** One list of every location page of the MSSP or the cybersecurity directory, with its text, meta and questions. */
export default function DirectoryPages({ directory }) {
  const cfg = DIRECTORIES[directory];
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contentPage, setContentPage] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetchDirectoryPages(directory);
    if (res.data?.ok) setPages(res.data.data || []);
    else toast.error(res.data?.message || "Could not load pages");
    setLoading(false);
  }, [directory]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  const counts = useMemo(() => {
    const c = { all: pages.length, country: 0, state: 0, city: 0 };
    for (const p of pages) if (c[p.type] !== undefined) c[p.type] += 1;
    return c;
  }, [pages]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return pages
      .filter((p) => type === "all" || p.type === type)
      .filter((p) => status === "all" || (status === "live" ? p.isPublished : !p.isPublished))
      .filter((p) => !term || `${p.name} ${p.slug} ${p.stateName || ""} ${p.countryName || ""}`.toLowerCase().includes(term));
  }, [pages, type, status, q]);

  const openEdit = async (p) => {
    const res = await fetchDirectoryPage(directory, p.slug);
    if (!res.data?.ok) return toast.error(res.data?.message || "Could not load the page");
    const d = res.data.data;
    setForm({
      slug: d.slug,
      name: d.name,
      heading: d.heading || "",
      metaTitle: d.metaTitle || "",
      metaDescription: d.metaDescription || "",
      isPublished: Boolean(d.isPublished),
      faqs: (d.faqs || []).map((f) => ({ question: f.question || "", answer: f.answer || "" })),
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateDirectoryPage(directory, form.slug, {
      heading: form.heading,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      isPublished: form.isPublished,
      faqs: form.faqs,
    });
    setSaving(false);
    if (res.data?.ok) {
      toast.success("Page saved");
      setForm(null);
      refresh();
    } else toast.error(res.data?.message || "Save failed");
  };

  const togglePublish = async (p) => {
    const res = await updateDirectoryPage(directory, p.slug, { isPublished: !p.isPublished });
    if (res.data?.ok) {
      toast.success(p.isPublished ? "Unpublished" : "Published");
      refresh();
    } else toast.error(res.data?.message || "Update failed");
  };

  const openContent = async (p) => {
    const res = await fetchDirectoryPage(directory, p.slug);
    if (res.data?.ok) setContentPage({ ...res.data.data, _id: p.slug });
    else toast.error(res.data?.message || "Could not load the page text");
  };

  if (contentPage) {
    return (
      <CityContentEditor
        cityData={contentPage}
        onBack={() => setContentPage(null)}
        refreshData={refresh}
        save={(content) => updateDirectoryPage(directory, contentPage.slug, { content })}
      />
    );
  }

  const chip = (t) => (
    <button key={t.key} onClick={() => setType(t.key)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === t.key ? "bg-[#0356A6] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      {t.label} <span className="opacity-70">{counts[t.key]}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <div className="rounded-2xl bg-linear-to-br from-[#0356A6] to-[#0A2E65] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{cfg.title}</h1>
        <p className="mt-1 text-sm text-blue-100">Every page in one list: {cfg.sub}. The pages come from the companies in the sheet, so a page is added or removed when the sheet changes. Here you write the heading, meta, text and questions of each page.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map(chip)}
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
          <option value="all">Any status</option>
          <option value="live">Published</option>
          <option value="draft">Unpublished</option>
        </select>
        <div className="relative ml-auto min-w-52 flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, slug, state or country" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Page</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">In</th>
              <th className="px-4 py-3 text-right">Companies</th>
              <th className="px-4 py-3">Text</th>
              <th className="px-4 py-3">Status</th>
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
                <tr key={p.slug} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="font-mono text-xs text-slate-400">{cfg.url(p.slug)}</div>
                  </td>
                  <td className="px-4 py-2.5 capitalize text-slate-600">{p.type}</td>
                  <td className="px-4 py-2.5 text-slate-600">{[p.type === "city" ? p.stateName : "", p.type !== "country" ? p.countryName : ""].filter(Boolean).join(", ") || "-"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.companyCount ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.hasMeta ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{p.hasMeta ? "Written" : "Default"}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.isPublished ? "Published" : "Unpublished"}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1 text-slate-500">
                      <button title="Edit heading, meta and FAQs" onClick={() => openEdit(p)} className="rounded p-1.5 hover:bg-slate-100"><Pencil size={15} /></button>
                      <button title="Edit page content (editor)" onClick={() => openContent(p)} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-[#0356A6] hover:bg-blue-100"><FileText size={14} /> Content</button>
                      <button title={p.isPublished ? "Unpublish" : "Publish"} onClick={() => togglePublish(p)} className="rounded p-1.5 hover:bg-slate-100">{p.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                      <a title="Open live page" href={`${FRONTEND_BASE}${cfg.url(p.slug)}`} target="_blank" rel="noreferrer" className="rounded p-1.5 hover:bg-slate-100"><ExternalLink size={15} /></a>
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
              <h2 className="text-lg font-bold text-slate-800">Edit {form.name} <span className="font-mono text-xs font-normal text-slate-400">{cfg.url(form.slug)}</span></h2>
              <button type="button" onClick={() => setForm(null)} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-500">Leave a field empty to use the default wording of the page.</p>
            <Field label="Page heading (H1)" value={form.heading} onChange={(v) => setForm({ ...form, heading: v })} />
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
            <button type="button" onClick={() => { const p = { slug: form.slug }; setForm(null); openContent(p); }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0356A6] px-3 py-2 text-sm font-semibold text-[#0356A6] hover:bg-blue-50">
              <FileText size={15} /> Edit page content (shows below the companies)
            </button>
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
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}
