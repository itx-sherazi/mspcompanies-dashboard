"use client";

import { Plus, Trash2 } from "lucide-react";

const inputCls = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
const labelCls = "text-xs font-medium text-slate-600";

/** Turns a list into the comma text the form edits. */
export function listToText(v) {
  return Array.isArray(v) ? v.filter(Boolean).join(", ") : v ? String(v) : "";
}

/** The profile fields of the master sheet, as the edit form keeps them. */
export function profileFormDefaults(row = {}) {
  return {
    tagline: row.tagline || "",
    profileSummary: row.profileSummary || "",
    supportHours: row.supportHours || "",
    serviceArea: row.serviceArea || "",
    clientSizeFocus: row.clientSizeFocus || "",
    specialization: row.specialization || "",
    industriesServed: listToText(row.industriesServed),
    certifications: listToText(row.certifications),
    complianceFrameworks: listToText(row.complianceFrameworks),
    bookingUrl: row.bookingUrl || "",
    googleMapsUrl: row.googleMapsUrl || "",
    indexEligible: Boolean(row.indexEligible),
    faqs: Array.isArray(row.faqs) ? row.faqs.map((f) => ({ question: f.question || "", answer: f.answer || "" })) : [],
  };
}

/** Appends the profile fields to the FormData the API expects. */
export function appendProfileFields(fd, form) {
  const plain = [
    "tagline", "profileSummary", "supportHours", "serviceArea", "clientSizeFocus", "specialization",
    "industriesServed", "certifications", "complianceFrameworks", "bookingUrl", "googleMapsUrl",
  ];
  for (const k of plain) fd.append(k, form[k] ?? "");
  fd.append("indexEligible", form.indexEligible ? "true" : "false");
  const faqs = (form.faqs || [])
    .map((f) => ({ question: String(f.question || "").trim(), answer: String(f.answer || "").trim() }))
    .filter((f) => f.question && f.answer);
  fd.append("faqs", JSON.stringify(faqs));
}

/**
 * Profile section of the company edit form: tagline, overview, support hours, who they serve,
 * certifications, links, Index Eligible and the company FAQ.
 */
export default function ProfileFields({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const faqs = form.faqs || [];
  const setFaq = (i, key, value) => setForm({ ...form, faqs: faqs.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)) });

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Profile (master sheet fields)</p>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(form.indexEligible)}
            onChange={(e) => setForm({ ...form, indexEligible: e.target.checked })}
          />
          Index eligible
          <span className="text-xs font-normal text-slate-500">(Google may index this profile)</span>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Tagline</label>
          <input className={inputCls} value={form.tagline} onChange={set("tagline")} placeholder="Managed IT services, networking and security in Albany, NY" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Profile summary</label>
          <textarea rows={5} className={inputCls} value={form.profileSummary} onChange={set("profileSummary")} />
        </div>
        <div>
          <label className={labelCls}>Support hours</label>
          <input className={inputCls} value={form.supportHours} onChange={set("supportHours")} placeholder="Monday to Friday 8:00 AM to 5:00 PM EST" />
        </div>
        <div>
          <label className={labelCls}>Service area</label>
          <input className={inputCls} value={form.serviceArea} onChange={set("serviceArea")} />
        </div>
        <div>
          <label className={labelCls}>Client size focus</label>
          <input className={inputCls} value={form.clientSizeFocus} onChange={set("clientSizeFocus")} placeholder="SMB, Mid-market" />
        </div>
        <div>
          <label className={labelCls}>Specialization</label>
          <input className={inputCls} value={form.specialization} onChange={set("specialization")} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Industries served (comma-separated)</label>
          <input className={inputCls} value={form.industriesServed} onChange={set("industriesServed")} />
        </div>
        <div>
          <label className={labelCls}>Certifications (comma-separated)</label>
          <input className={inputCls} value={form.certifications} onChange={set("certifications")} />
        </div>
        <div>
          <label className={labelCls}>Compliance frameworks (comma-separated)</label>
          <input className={inputCls} value={form.complianceFrameworks} onChange={set("complianceFrameworks")} placeholder="HIPAA, PCI DSS" />
        </div>
        <div>
          <label className={labelCls}>Booking / contact URL</label>
          <input className={inputCls} value={form.bookingUrl} onChange={set("bookingUrl")} placeholder="https://…" />
        </div>
        <div>
          <label className={labelCls}>Google Maps URL</label>
          <input className={inputCls} value={form.googleMapsUrl} onChange={set("googleMapsUrl")} placeholder="https://…" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Company FAQ</p>
          {faqs.length < 10 ? (
            <button
              type="button"
              onClick={() => setForm({ ...form, faqs: [...faqs, { question: "", answer: "" }] })}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add question
            </button>
          ) : null}
        </div>
        {faqs.length === 0 ? <p className="mt-2 text-xs text-slate-500">No questions yet. They show on the profile and in Google as FAQ rich results.</p> : null}
        <div className="mt-2 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Question"
                    value={f.question}
                    onChange={(e) => setFaq(i, "question", e.target.value)}
                  />
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Answer"
                    value={f.answer}
                    onChange={(e) => setFaq(i, "answer", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, faqs: faqs.filter((_, idx) => idx !== i) })}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  title="Remove question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
