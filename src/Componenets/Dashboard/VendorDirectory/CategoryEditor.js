"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Editor } from "@tinymce/tinymce-react";
import { updateCategory, updateCategoryRankings } from "@/services/api";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";

function MetaBar({ value, ideal, max }) {
  const len  = (value || "").length;
  const over = len > max;
  const pct  = Math.min((len / max) * 100, 100);
  const color = over ? "bg-red-500" : len >= ideal * 0.85 ? "bg-green-500" : "bg-blue-400";
  return (
    <div className="h-1 bg-gray-100 rounded-full mb-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-200 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MetaInfo({ value, ideal, max, label }) {
  const len  = (value || "").length;
  const over = len > max;
  return (
    <div className="flex justify-between mt-1">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-xs font-bold ${over ? "text-red-500" : len >= ideal * 0.85 ? "text-green-600" : "text-gray-400"}`}>
        {len}/{max}{over ? ` (+${len - max})` : ""}
      </p>
    </div>
  );
}

const STATUS_COLORS = {
  "To Do":     "bg-gray-100 text-gray-600",
  draft:       "bg-amber-100 text-amber-700",
  published:   "bg-green-100 text-green-700",
};

export default function CategoryEditor({ category: initialCategory, onBack, refreshList }) {
  const [tab, setTab] = useState("seo");
  const [cat, setCat] = useState(initialCategory);
  const [seo, setSeo] = useState({
    heading:         initialCategory.heading         || "",
    slug:            initialCategory.slug            || "",
    metaTitle:       initialCategory.meta?.title     || "",
    metaDescription: initialCategory.meta?.description || "",
    status:          initialCategory.status          || "To Do",
  });
  const [contentHtml, setContentHtml] = useState(initialCategory.contentHtml || "");
  const [faqs, setFaqs]   = useState(
    initialCategory.faqs?.length
      ? initialCategory.faqs
      : [{ question: "", answer: "" }]
  );
  const [rankings, setRankings] = useState(initialCategory.vendorRankings || []);
  const [newVendorSlug, setNewVendorSlug] = useState("");
  const [saving, setSaving]   = useState(false);
  const editorRef = useRef(null);

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

  // ── SEO save ────────────────────────────────────────────
  const saveSeo = async () => {
    setSaving(true);
    const res = await updateCategory(cat.slug, {
      heading:         seo.heading,
      slug:            seo.slug,
      metaTitle:       seo.metaTitle,
      metaDescription: seo.metaDescription,
      status:          seo.status,
    });
    setSaving(false);
    if (res.data?.ok) {
      toast.success("SEO settings saved");
      setCat((c) => ({ ...c, heading: seo.heading, meta: { title: seo.metaTitle, description: seo.metaDescription }, status: seo.status }));
      refreshList?.();
    } else {
      toast.error(res.data?.error || "Failed to save");
    }
  };

  // ── Content save ─────────────────────────────────────────
  const saveContent = async () => {
    // get latest content directly from editor in case state lagged
    const html = editorRef.current ? editorRef.current.getContent() : contentHtml;
    setSaving(true);
    const res = await updateCategory(cat.slug, { contentHtml: html });
    if (res.data?.ok) setContentHtml(html);
    setSaving(false);
    if (res.data?.ok) {
      toast.success("Content saved");
    } else {
      toast.error(res.data?.error || "Failed to save");
    }
  };

  // ── FAQ save ─────────────────────────────────────────────
  const saveFaqs = async () => {
    const cleaned = faqs.filter((f) => f.question.trim() || f.answer.trim());
    setSaving(true);
    const res = await updateCategory(cat.slug, { faqs: cleaned });
    setSaving(false);
    if (res.data?.ok) {
      toast.success("FAQs saved");
    } else {
      toast.error(res.data?.error || "Failed to save");
    }
  };

  const addFaq    = () => setFaqs((f) => [...f, { question: "", answer: "" }]);
  const removeFaq = (i) => setFaqs((f) => f.filter((_, idx) => idx !== i));
  const updateFaq = (i, field, val) =>
    setFaqs((f) => f.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));

  // ── Rankings save ────────────────────────────────────────
  const saveRankings = async () => {
    const clean = rankings.filter((r) => r.vendorSlug?.trim());
    setSaving(true);
    const res = await updateCategoryRankings(cat.slug, clean);
    setSaving(false);
    if (res.data?.ok) {
      toast.success("Rankings saved");
    } else {
      toast.error(res.data?.error || "Failed to save");
    }
  };

  const addVendor = () => {
    const slug = newVendorSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    if (rankings.find((r) => r.vendorSlug === slug)) {
      toast.error("Vendor already in list");
      return;
    }
    setRankings((r) => [...r, { vendorSlug: slug, rank: r.length + 1, featured: false }]);
    setNewVendorSlug("");
  };

  const removeVendor = (slug) => setRankings((r) => r.filter((v) => v.vendorSlug !== slug));
  const toggleFeatured = (slug) =>
    setRankings((r) => r.map((v) => v.vendorSlug === slug ? { ...v, featured: !v.featured } : v));
  const moveVendor = (idx, dir) => {
    const next = [...rankings];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setRankings(next.map((v, i) => ({ ...v, rank: i + 1 })));
  };

  const TABS = [
    { id: "seo",      label: "SEO & Status" },
    { id: "content",  label: "Page Content" },
    { id: "faqs",     label: `FAQs (${faqs.filter(f => f.question).length})` },
    { id: "rankings", label: `Vendor Rankings (${rankings.length})` },
  ];

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-semibold text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">{cat.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[cat.status] || STATUS_COLORS["To Do"]}`}>
                {cat.status}
              </span>
              <a
                href={`${SITE}/best/${cat.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                View page <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={tab === "seo" ? saveSeo : tab === "content" ? saveContent : tab === "faqs" ? saveFaqs : saveRankings}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1d4882] text-white px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-60"
        >
          <Save size={15} /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#1d4882] text-[#1d4882]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-4xl">

        {/* ── SEO Tab ── */}
        {tab === "seo" && (
          <div className="flex flex-col gap-5">
            <Field label="Page Heading (H1)" hint="Shown as the main title on the public page">
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
                value={seo.heading}
                onChange={(e) => setSeo((s) => ({ ...s, heading: e.target.value }))}
                placeholder={cat.title}
              />
            </Field>

            <Field label="Slug (URL)" hint="Changes the live page URL — update with caution">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1d4882]">
                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">/best/</span>
                <input
                  className="flex-1 px-3 py-2 text-sm outline-none font-mono"
                  value={seo.slug}
                  onChange={(e) =>
                    setSeo((s) => ({
                      ...s,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                />
              </div>
              <p className="text-[11px] text-amber-600 mt-1">⚠️ Changing slug will break existing links and SEO — only edit if intentional</p>
            </Field>

            <Field label="Meta Title" hint="Ideal: 50–60 chars for Google">
              <MetaBar value={seo.metaTitle} ideal={60} max={70} />
              <input
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none transition-colors ${
                  seo.metaTitle.length > 70 ? "border-red-400 bg-red-50/40" : "border-gray-300"
                }`}
                value={seo.metaTitle}
                onChange={(e) => setSeo((s) => ({ ...s, metaTitle: e.target.value }))}
              />
              <MetaInfo value={seo.metaTitle} ideal={60} max={70} label="Ideal: 50–60 chars" />
            </Field>

            <Field label="Meta Description" hint="Ideal: 140–155 chars for Google">
              <MetaBar value={seo.metaDescription} ideal={155} max={160} />
              <textarea
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none resize-none transition-colors ${
                  seo.metaDescription.length > 160 ? "border-red-400 bg-red-50/40" : "border-gray-300"
                }`}
                value={seo.metaDescription}
                onChange={(e) => setSeo((s) => ({ ...s, metaDescription: e.target.value }))}
              />
              <MetaInfo value={seo.metaDescription} ideal={155} max={160} label="Ideal: 140–155 chars" />
            </Field>

            <Field label="Status">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
                value={seo.status}
                onChange={(e) => setSeo((s) => ({ ...s, status: e.target.value }))}
              >
                <option value="To Do">To Do</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 border border-gray-200">
              <p className="font-semibold text-gray-700 mb-2">Category Info (read-only)</p>
              <div className="grid grid-cols-2 gap-2">
                <span><strong>Slug:</strong> {cat.slug}</span>
                <span><strong>Group:</strong> {cat.group}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Content Tab ── */}
        {tab === "content" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Write the SEO article content shown below the vendor list. Use <strong>H2</strong> for main sections and <strong>H3</strong> for subsections.
            </p>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <Editor
                tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
                onInit={(_, editor) => {
                  editorRef.current = editor;
                  // set content after init to guarantee it loads
                  if (contentHtml) editor.setContent(contentHtml);
                }}
                initialValue={contentHtml}
                onEditorChange={(val) => setContentHtml(val)}
                init={{
                  height: 580,
                  menubar: true,
                  plugins: ["advlist","autolink","lists","link","image","charmap","preview",
                    "anchor","searchreplace","visualblocks","code","fullscreen",
                    "insertdatetime","media","table","help","wordcount"],
                  toolbar: "undo redo | blocks | bold italic | alignleft aligncenter alignright | " +
                    "bullist numlist | link image table | code fullscreen | removeformat",
                  content_style: "body { font-family: sans-serif; font-size: 15px; line-height: 1.7; }",
                  block_formats: "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4",
                  branding: false,
                  promotion: false,
                }}
              />
            </div>
          </div>
        )}

        {/* ── FAQs Tab ── */}
        {tab === "faqs" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">Add FAQ pairs  these appear in an accordion on the public page and generate FAQPage JSON-LD for Google.</p>

            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">FAQ #{i + 1}</span>
                  <button onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
                <input
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                />
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none resize-none"
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                />
              </div>
            ))}

            <button
              onClick={addFaq}
              className="flex items-center gap-2 text-sm font-semibold text-[#1d4882] border-2 border-dashed border-[#1d4882]/30 hover:border-[#1d4882] rounded-xl px-4 py-3 transition-colors"
            >
              <Plus size={16} /> Add FAQ
            </button>
          </div>
        )}

        {/* ── Rankings Tab ── */}
        {tab === "rankings" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              Set the Top 10 vendor order. Vendors without rankings are shown from the database automatically sorted by pageCount. Add vendor slugs below.
            </p>

            {/* Add vendor */}
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
                placeholder="Vendor slug (e.g. ninjaone, connectwise)"
                value={newVendorSlug}
                onChange={(e) => setNewVendorSlug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addVendor()}
              />
              <button
                onClick={addVendor}
                className="flex items-center gap-1.5 bg-[#1d4882] text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Rankings list */}
            {rankings.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                No vendors ranked yet  add vendor slugs above
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {rankings.map((v, i) => (
                  <div key={v.vendorSlug} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveVendor(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none">▲</button>
                      <button onClick={() => moveVendor(i, 1)} disabled={i === rankings.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none">▼</button>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#1d4882] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-gray-800 font-mono">{v.vendorSlug}</span>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.featured}
                        onChange={() => toggleFeatured(v.vendorSlug)}
                        className="rounded"
                      />
                      Featured
                    </label>
                    <button onClick={() => removeVendor(v.vendorSlug)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {hint && <span className="ml-2 text-xs text-gray-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
