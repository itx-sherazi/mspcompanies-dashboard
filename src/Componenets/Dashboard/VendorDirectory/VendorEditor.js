"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { createVendor, updateVendor } from "@/services/api";
import { ArrowLeft, Save, Plus, X, ExternalLink } from "lucide-react";

const GROUPS = ["MSP Software","Cybersecurity","Backup & DR","Communications","Monitoring","Compliance","Cloud","Network","AI","Microsoft","Infrastructure"];
const PRICING_MODELS = ["Per endpoint/month","Per user/month","Per device/month","Flat monthly fee","Quote-based","Freemium","Per GB/month","Annual contract","Usage-based"];

const TABS = [
  { id: "basic",    label: "Basic Info" },
  { id: "company",  label: "Company Info" },
  { id: "profile",  label: "Description" },
  { id: "features", label: "Features & Pricing" },
  { id: "msp",      label: "MSP & Integrations" },
  { id: "proscons", label: "Pros & Cons" },
  { id: "meta",     label: "Categories" },
];

function toArr(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

const EMPTY = {
  name: "", slug: "", website: "", logoUrl: "", founded: "", hq: "", companySize: "",
  description: "",
  employees: "", industry: "", phone: "",
  street: "", city: "", state: "", country: "", postalCode: "", address: "",
  linkedinUrl: "", facebookUrl: "", twitterUrl: "",
  keywords: [], technologies: [], sicCodes: "", naicsCodes: "",
  keyFeatures: [], pricingModel: "", pricingNotes: "",
  mspPartnerProgram: false, mspPartnerProgramNotes: "",
  integrations: [], bestFor: "",
  pros: [], cons: [],
  categories: [], groups: [],
};

export default function VendorEditor({ vendor: initialVendor, onBack, onSaved }) {
  const isNew = !initialVendor;
  const [tab, setTab] = useState("basic");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => {
    if (!initialVendor) return { ...EMPTY };
    return {
      ...initialVendor,
      founded:      initialVendor.founded ?? "",
      description:  initialVendor.description || "",
      employees: initialVendor.employees || "",
      industry:  initialVendor.industry  || "",
      phone:     initialVendor.phone     || "",
      street:    initialVendor.street    || "",
      city:      initialVendor.city      || "",
      state:     initialVendor.state     || "",
      country:   initialVendor.country   || "",
      postalCode:initialVendor.postalCode|| "",
      address:   initialVendor.address   || "",
      linkedinUrl: initialVendor.linkedinUrl || "",
      facebookUrl: initialVendor.facebookUrl || "",
      twitterUrl:  initialVendor.twitterUrl  || "",
      sicCodes:  initialVendor.sicCodes  || "",
      naicsCodes:initialVendor.naicsCodes|| "",
      keywords:     toArr(initialVendor.keywords),
      technologies: toArr(initialVendor.technologies),
      keyFeatures:  toArr(initialVendor.keyFeatures),
      integrations: toArr(initialVendor.integrations),
      pros:         toArr(initialVendor.pros),
      cons:         toArr(initialVendor.cons),
      categories:   toArr(initialVendor.categories),
      groups:       toArr(initialVendor.groups),
    };
  });

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleNameChange = (val) => {
    set("name", val);
    if (isNew) {
      set("slug", val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Vendor name required"); return; }
    if (!form.slug.trim()) { toast.error("Slug required"); return; }

    setSaving(true);
    const payload = { ...form, founded: form.founded ? Number(form.founded) : null };

    const res = isNew
      ? await createVendor(payload)
      : await updateVendor(initialVendor.slug, payload);

    setSaving(false);

    if (res.data?.ok) {
      toast.success(isNew ? "Vendor created!" : "Vendor updated!");
      onSaved?.(res.data.data);
    } else {
      toast.error(res.data?.error || "Failed to save");
    }
  };

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-semibold text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {isNew ? "New Vendor" : form.name}
            </h1>
            {!isNew && (
              <a
                href={`${SITE}/tools/${initialVendor.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                /tools/{initialVendor.slug} <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1d4882] text-white px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-60"
        >
          <Save size={15} /> {saving ? "Saving…" : isNew ? "Create Vendor" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? "border-[#1d4882] text-[#1d4882]" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-3xl">

        {/* ── Basic Info ── */}
        {tab === "basic" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vendor Name *">
                <input className={INPUT} value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. NinjaOne" />
              </Field>
              <Field label="URL Slug *" hint="auto-generated, editable">
                <input className={`${INPUT} font-mono`} value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="ninjaone" />
              </Field>
            </div>

            <Field label="Website URL">
              <input className={INPUT} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://www.ninjaone.com" />
            </Field>

            <Field label="Logo URL" hint="paste image link  saves directly to DB">
              <input className={INPUT} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://..." />
              {form.logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={form.logoUrl} alt="preview" className="h-10 object-contain border border-gray-200 rounded p-1 bg-white" onError={(e) => e.target.style.display = "none"} />
                  <span className="text-xs text-gray-400">Logo preview</span>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Founded Year">
                <input className={INPUT} type="number" value={form.founded} onChange={(e) => set("founded", e.target.value)} placeholder="2010" />
              </Field>
              <Field label="Headquarters">
                <input className={INPUT} value={form.hq} onChange={(e) => set("hq", e.target.value)} placeholder="Austin, TX" />
              </Field>
              <Field label="Company Size">
                <input className={INPUT} value={form.companySize} onChange={(e) => set("companySize", e.target.value)} placeholder="500-1000 employees" />
              </Field>
            </div>
          </div>
        )}

        {/* ── Company Info ── */}
        {tab === "company" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Employees">
                <input className={INPUT} value={form.employees} onChange={(e) => set("employees", e.target.value)} placeholder="500-1000" />
              </Field>
              <Field label="Industry">
                <input className={INPUT} value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Information Technology" />
              </Field>
              <Field label="Phone">
                <input className={INPUT} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 800 000 0000" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City">
                <input className={INPUT} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
              </Field>
              <Field label="State">
                <input className={INPUT} value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="TX" />
              </Field>
              <Field label="Country">
                <input className={INPUT} value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="United States" />
              </Field>
              <Field label="Postal Code">
                <input className={INPUT} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="78701" />
              </Field>
            </div>

            <Field label="Street Address">
              <input className={INPUT} value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="123 Main St" />
            </Field>

            <Field label="Full Address" hint="complete address string if available">
              <input className={INPUT} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, Austin, TX 78701, USA" />
            </Field>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Social Links</p>
              <div className="flex flex-col gap-4">
                <Field label="LinkedIn URL">
                  <input className={INPUT} value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/company/..." />
                </Field>
                <Field label="Twitter / X URL">
                  <input className={INPUT} value={form.twitterUrl} onChange={(e) => set("twitterUrl", e.target.value)} placeholder="https://twitter.com/..." />
                </Field>
                <Field label="Facebook URL">
                  <input className={INPUT} value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
                </Field>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Codes & Keywords</p>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="SIC Codes">
                    <input className={INPUT} value={form.sicCodes} onChange={(e) => set("sicCodes", e.target.value)} placeholder="7372" />
                  </Field>
                  <Field label="NAICS Codes">
                    <input className={INPUT} value={form.naicsCodes} onChange={(e) => set("naicsCodes", e.target.value)} placeholder="511210" />
                  </Field>
                </div>
                <Field label="Keywords" hint="press Enter to add">
                  <TagInput items={form.keywords} onChange={(val) => set("keywords", val)} placeholder="e.g. RMM, MSP, remote monitoring…" />
                </Field>
                <Field label="Technologies" hint="press Enter to add">
                  <TagInput items={form.technologies} onChange={(val) => set("technologies", val)} placeholder="e.g. AWS, Azure, Windows Server…" />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {tab === "profile" && (
          <div className="flex flex-col gap-5">
            <Field label="Description" hint="shown in Overview section on profile page">
              <textarea rows={8} className={`${INPUT} resize-none`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed overview of the vendor, its history, use cases, strengths…" />
            </Field>

            <Field label="Best For">
              <input className={INPUT} value={form.bestFor} onChange={(e) => set("bestFor", e.target.value)} placeholder="Mid-market MSPs needing unified RMM + PSA" />
            </Field>
          </div>
        )}

        {/* ── Features & Pricing ── */}
        {tab === "features" && (
          <div className="flex flex-col gap-6">
            <Field label="Key Features" hint="press Enter to add each feature">
              <TagInput
                items={form.keyFeatures}
                onChange={(val) => set("keyFeatures", val)}
                placeholder="Add feature and press Enter…"
              />
            </Field>

            <Field label="Pricing Model">
              <select className={INPUT} value={form.pricingModel} onChange={(e) => set("pricingModel", e.target.value)}>
                <option value="">Select…</option>
                {PRICING_MODELS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Pricing Notes">
              <textarea rows={3} className={`${INPUT} resize-none`} value={form.pricingNotes} onChange={(e) => set("pricingNotes", e.target.value)} placeholder="Starts at $3/endpoint/month, min 100 endpoints. Volume discounts available…" />
            </Field>
          </div>
        )}

        {/* ── MSP & Integrations ── */}
        {tab === "msp" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="mspPartner"
                checked={form.mspPartnerProgram}
                onChange={(e) => set("mspPartnerProgram", e.target.checked)}
                className="w-4 h-4 accent-[#1d4882]"
              />
              <label htmlFor="mspPartner" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Has MSP Partner Program
              </label>
            </div>

            {form.mspPartnerProgram && (
              <Field label="MSP Partner Program Notes">
                <textarea rows={3} className={`${INPUT} resize-none`} value={form.mspPartnerProgramNotes} onChange={(e) => set("mspPartnerProgramNotes", e.target.value)} placeholder="Tiered partner program  Silver, Gold, Platinum. Includes NFR licenses…" />
              </Field>
            )}

            <Field label="Integrations" hint="PSA/RMM tools this vendor integrates with">
              <TagInput
                items={form.integrations}
                onChange={(val) => set("integrations", val)}
                placeholder="e.g. ConnectWise, Autotask, HaloPSA…"
              />
            </Field>
          </div>
        )}

        {/* ── Pros & Cons ── */}
        {tab === "proscons" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-green-700 mb-3">✓ Pros</label>
              <TagInput
                items={form.pros}
                onChange={(val) => set("pros", val)}
                placeholder="Add a pro and press Enter…"
                color="green"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-red-600 mb-3">✗ Cons</label>
              <TagInput
                items={form.cons}
                onChange={(val) => set("cons", val)}
                placeholder="Add a con and press Enter…"
                color="red"
              />
            </div>
          </div>
        )}

        {/* ── Categories ── */}
        {tab === "meta" && (
          <div className="flex flex-col gap-5">
            <Field label="Groups" hint="primary vendor categories for directory grouping">
              <div className="flex flex-wrap gap-2 mb-2">
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      const has = form.groups.includes(g);
                      set("groups", has ? form.groups.filter((x) => x !== g) : [...form.groups, g]);
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      form.groups.includes(g)
                        ? "bg-[#1d4882] text-white border-[#1d4882]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1d4882]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Category Slugs" hint="which /best/[slug] pages this vendor appears on">
              <TagInput
                items={form.categories}
                onChange={(val) => set("categories", val)}
                placeholder="Category slug and press Enter (e.g. rmm-software)…"
                mono
              />
            </Field>
          </div>
        )}

      </div>
    </div>
  );
}

function TagInput({ items, onChange, placeholder, mono = false, color = "blue" }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (!val || items.includes(val)) { setInput(""); return; }
    onChange([...items, val]);
    setInput("");
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  const tagBg = color === "green" ? "bg-green-50 border-green-200 text-green-800"
    : color === "red" ? "bg-red-50 border-red-200 text-red-800"
    : "bg-[#EBF3FF] border-[#C7DEFF] text-[#1d4882]";

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none ${mono ? "font-mono" : ""}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button type="button" onClick={add} className="px-3 py-2 bg-[#1d4882] text-white rounded-lg hover:bg-[#163a6d]">
          <Plus size={16} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`flex items-center gap-1.5 text-xs font-semibold border rounded-full px-2.5 py-1 ${tagBg}`}>
              <span className={mono ? "font-mono" : ""}>{item}</span>
              <button type="button" onClick={() => remove(i)} className="opacity-60 hover:opacity-100">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
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

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none bg-white";
