"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchCompanyAdmin, createCompanyAdmin, updateCompanyAdmin } from "@/services/api";
import { X, Plus, Trash2, ExternalLink, Building2, Loader2 } from "lucide-react";

export const DIRECTORY_LABEL = { mit: "Managed IT", mssp: "MSSP", cyber: "Cybersecurity" };
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882]/30 focus:border-[#1d4882] outline-none";

// The list fields are typed as text (commas or new lines) and sent as they are; the API splits them.
const LIST_KEYS = ["companyServices", "companyPartners", "technologies", "industriesServed", "certifications", "complianceFrameworks", "keywords"];

const EMPTY = {
  companyName: "", website: "", image: "", phone: "", employees: "", revenueSize: "", foundedYear: "", industry: "", description: "",
  companyStreet: "", companyCity: "", companyState: "", companyCountry: "", companyPostalCode: "", address: "", serviceArea: "", googleMapsUrl: "",
  tagline: "", profileSummary: "", specialization: "", clientSizeFocus: "", supportHours: "", bookingUrl: "",
  companyServices: "", companyPartners: "", technologies: "", industriesServed: "", certifications: "", complianceFrameworks: "", keywords: "",
  linkedinUrl: "", facebookUrl: "", twitterUrl: "",
  faqs: [], indexEligible: false, isPublished: true,
};

const toForm = (c) => {
  const f = { ...EMPTY };
  for (const k of Object.keys(EMPTY)) {
    if (c[k] === undefined || c[k] === null) continue;
    if (LIST_KEYS.includes(k)) f[k] = (c[k] || []).join(", ");
    else if (k === "faqs") f.faqs = (c.faqs || []).map((x) => ({ question: x.question || "", answer: x.answer || "" }));
    else if (k === "indexEligible") f.indexEligible = Boolean(c.indexEligible);
    else if (k === "isPublished") f.isPublished = c.isPublished !== false;
    else f[k] = c[k];
  }
  return f;
};

const TABS = [
  { id: "basics", label: "Basics" },
  { id: "location", label: "Location" },
  { id: "profile", label: "Profile text" },
  { id: "lists", label: "Services and tags" },
  { id: "faqs", label: "FAQs" },
  { id: "publish", label: "Publishing" },
];

function Field({ label, hint, children, wide }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold text-gray-600">
        {label}
        {hint ? <span className="ml-2 font-normal text-gray-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

/**
 * Add or edit one company of any directory. `directory` is fixed when editing and chosen when adding.
 * onSaved(company) is called after a save, onClose() closes the window.
 */
export default function CompanyForm({ mode, directory: initialDirectory, slug, onClose, onSaved }) {
  const isNew = mode === "new";
  const [directory, setDirectory] = useState(initialDirectory && initialDirectory !== "all" ? initialDirectory : "mssp");
  const [form, setForm] = useState({ ...EMPTY });
  const [meta, setMeta] = useState(null); // slug and profile link of a stored company
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basics");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    fetchCompanyAdmin(directory, slug).then((res) => {
      if (!alive) return;
      if (res.data?.ok) {
        setForm(toForm(res.data.data));
        setMeta({ slug: res.data.data.slug, profilePath: res.data.data.profilePath });
      } else {
        setError(res.data?.message || "Could not load the company");
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [isNew, directory, slug]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const input = (key, props = {}) => <input className={INPUT} value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />;
  const area = (key, rows = 4, props = {}) => <textarea className={INPUT} rows={rows} value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />;

  const save = async () => {
    if (!form.companyName.trim()) {
      setTab("basics");
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    const res = isNew ? await createCompanyAdmin(directory, form) : await updateCompanyAdmin(directory, slug, form);
    setSaving(false);
    if (res.data?.ok) {
      toast.success(isNew ? "Company added" : "Company saved");
      // A Managed IT company is put on the pages it belongs to, and taken off the others, when it is added or its location changes.
      const placed = res.data.placed;
      if (placed?.added?.length) toast.info(`Now on: ${placed.added.map((p) => p.name).join(", ")}`, { autoClose: 9000 });
      if (placed?.removed?.length) toast.info(`Taken off: ${placed.removed.map((p) => p.name).join(", ")}`, { autoClose: 9000 });
      if (res.data.warning) toast.info(res.data.warning, { autoClose: 9000 });
      onSaved?.(res.data.data);
    } else {
      toast.error(res.data?.message || "Could not save");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-6 w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Building2 size={20} className="text-[#1d4882]" />
              {isNew ? "Add a company" : form.companyName || "Edit company"}
            </h2>
            {isNew ? (
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                Directory
                <select value={directory} onChange={(e) => setDirectory(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                  {Object.entries(DIRECTORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                <span className="rounded-full bg-[#EBF3FF] px-2 py-0.5 font-semibold text-[#1d4882]">{DIRECTORY_LABEL[directory]}</span>
                {meta ? <span className="font-mono">{meta.slug}</span> : null}
                {meta ? (
                  <a href={`${SITE}${meta.profilePath}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1d4882] hover:underline">
                    Public profile <ExternalLink size={11} />
                  </a>
                ) : null}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#1d4882]" /></div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 border-b border-gray-100 px-5 pt-3">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.id ? "border-[#1d4882] text-[#1d4882]" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              {tab === "basics" && (
                <>
                  <Field label="Company name *" wide>{input("companyName")}</Field>
                  <Field label="Website" hint="https://...">{input("website", { placeholder: "https://www.example.com" })}</Field>
                  <Field label="Phone">{input("phone")}</Field>
                  <Field label="Logo link" hint="https://... (a picture link)" wide>
                    <div className="flex items-center gap-3">
                      {form.image ? <img src={form.image} alt="" className="h-10 w-10 rounded border border-gray-200 bg-white object-contain p-0.5" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : null}
                      <input className={INPUT} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
                    </div>
                  </Field>
                  <Field label="Employees" hint="for example 20 - 50">{input("employees")}</Field>
                  <Field label="Revenue">{input("revenueSize")}</Field>
                  <Field label="Founded year">{input("foundedYear", { inputMode: "numeric", placeholder: "2012" })}</Field>
                  <Field label="Industry">{input("industry")}</Field>
                  <Field label="Short description" hint="the text shown on the listing card" wide>{area("description", 5)}</Field>
                </>
              )}
              {tab === "location" && (
                <>
                  <Field label="Street" wide>{input("companyStreet")}</Field>
                  <Field label="City">{input("companyCity")}</Field>
                  <Field label="State or region">{input("companyState")}</Field>
                  <Field label="Country">{input("companyCountry")}</Field>
                  <Field label="Postal code">{input("companyPostalCode")}</Field>
                  <Field label="Full address" wide>{input("address")}</Field>
                  <Field label="Service area" hint="where it serves clients">{input("serviceArea")}</Field>
                  <Field label="Google Maps link">{input("googleMapsUrl", { placeholder: "https://maps.google.com/..." })}</Field>
                  {directory !== "mit" && !isNew ? (
                    <p className="text-xs text-gray-500 md:col-span-2">Changing the city, state or country moves the company to the right location page when you save.</p>
                  ) : null}
                </>
              )}
              {tab === "profile" && (
                <>
                  <Field label="Tagline" wide>{input("tagline")}</Field>
                  <Field label="Profile summary" hint="the About text of the profile" wide>{area("profileSummary", 7)}</Field>
                  <Field label="Specialization">{input("specialization")}</Field>
                  <Field label="Client size focus">{input("clientSizeFocus")}</Field>
                  <Field label="Support hours">{input("supportHours")}</Field>
                  <Field label="Booking or contact link">{input("bookingUrl", { placeholder: "https://..." })}</Field>
                  <Field label="LinkedIn">{input("linkedinUrl")}</Field>
                  <Field label="Facebook">{input("facebookUrl")}</Field>
                  <Field label="X (Twitter)">{input("twitterUrl")}</Field>
                </>
              )}
              {tab === "lists" && (
                <>
                  <Field label="Services" hint="separate with commas" wide>{area("companyServices", 3)}</Field>
                  <Field label="Partners" wide>{area("companyPartners", 2)}</Field>
                  <Field label="Technologies" wide>{area("technologies", 2)}</Field>
                  <Field label="Industries served" wide>{area("industriesServed", 2)}</Field>
                  <Field label="Certifications" wide>{area("certifications", 2)}</Field>
                  <Field label="Compliance frameworks" wide>{area("complianceFrameworks", 2)}</Field>
                  <Field label="Keywords" wide>{area("keywords", 3)}</Field>
                </>
              )}
              {tab === "faqs" && (
                <div className="space-y-3 md:col-span-2">
                  {form.faqs.length === 0 ? <p className="text-sm text-gray-500">No questions yet.</p> : null}
                  {form.faqs.map((f, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          className={INPUT}
                          placeholder="Question"
                          value={f.question}
                          onChange={(e) => set("faqs", form.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                        />
                        <button onClick={() => set("faqs", form.faqs.filter((_, j) => j !== i))} className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Remove"><Trash2 size={15} /></button>
                      </div>
                      <textarea
                        className={INPUT}
                        rows={3}
                        placeholder="Answer"
                        value={f.answer}
                        onChange={(e) => set("faqs", form.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
                      />
                    </div>
                  ))}
                  {form.faqs.length < 10 ? (
                    <button onClick={() => set("faqs", [...form.faqs, { question: "", answer: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                      <Plus size={14} /> Add a question
                    </button>
                  ) : null}
                </div>
              )}
              {tab === "publish" && (
                <div className="space-y-4 md:col-span-2">
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                    <input type="checkbox" className="mt-1" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
                    <span>
                      <b className="text-sm text-gray-800">Published</b>
                      <span className="block text-xs text-gray-500">Untick to hide the company from the public website. Nothing is deleted.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                    <input type="checkbox" className="mt-1" checked={form.indexEligible} onChange={(e) => set("indexEligible", e.target.checked)} />
                    <span>
                      <b className="text-sm text-gray-800">Index Eligible (Y)</b>
                      <span className="block text-xs text-gray-500">Google may index the profile only when this is ticked (and, for MSSP and cybersecurity, once indexing of profiles is switched on in the website code).</span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4">
              <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1d4882] px-5 py-2 text-sm font-semibold text-white hover:bg-[#163a6e] disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {isNew ? "Add company" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
