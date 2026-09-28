"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchOverview,
  fetchQualityPages,
  fetchDuplicateCompanies,
} from "@/services/api";
import {
  Building2,
  Inbox,
  MapPin,
  Globe2,
  FileText,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  FaRegNewspaper,
  FaPenFancy,
  FaFileSignature,
  FaUsers,
  FaUserPlus,
  FaMapMarkedAlt,
  FaGlobeAmericas,
  FaGlobe,
  FaListAlt,
  FaBuilding,
  FaShieldAlt,
  FaLayerGroup,
  FaBroom,
} from "react-icons/fa";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";
const BRAND = "#1d4882";

// Every dashboard section, for the quick-links grid (same tabs as Sidebar.js).
const SECTIONS = [
  { tab: "CityHub", label: "MSP City Pages", hint: "/msp/<city>", icon: FaMapMarkedAlt },
  { tab: "CountryHub", label: "Top MSPs Countries", hint: "/top-msps/<country>", icon: FaGlobeAmericas },
  { tab: "MsspCountryHub", label: "Top MSSP Countries", hint: "/top-mssp/<country>", icon: FaGlobe },
  { tab: "ManagedIT", label: "Managed IT Services", hint: "/managed-it-services", icon: FaBuilding },
  { tab: "CyberSecurity", label: "Cybersecurity", hint: "/cybersecurity-companies", icon: FaShieldAlt },
  { tab: "VendorDirectory", label: "Vendor Directory", hint: "/tools · /best", icon: FaLayerGroup },
  { tab: "CompanyQuality", label: "Data Quality", hint: "Bad characters · duplicates", icon: FaBroom },
  { tab: "blog", label: "All Blogs", hint: "/blog", icon: FaRegNewspaper },
  { tab: "Addblog", label: "Add Blog", hint: "Write a new post", icon: FaPenFancy },
  { tab: "DataRequest", label: "Leads", hint: "Popup, contact, book a call", icon: FaFileSignature },
  { tab: "ListingRequests", label: "Listing Requests", hint: "Companies asking to be listed", icon: FaListAlt },
  { tab: "Users", label: "Users", hint: "Dashboard accounts", icon: FaUsers },
  { tab: "AddUser", label: "Add User", hint: "Create an account", icon: FaUserPlus },
];

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "—");

function timeAgo(date) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [name, secs] of units) {
    const v = Math.floor(s / secs);
    if (v >= 1) return `${v} ${name}${v > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

function Card({ title, action, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl border border-gray-200 p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function LinkButton({ onClick, children }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold text-[#1d4882] hover:underline inline-flex items-center gap-1">
      {children} <ArrowRight size={12} />
    </button>
  );
}

/** Headline number tile; the whole tile opens its section. */
function StatTile({ icon: Icon, label, value, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-[#1d4882] hover:shadow-sm transition group"
    >
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Icon size={16} className="text-[#1d4882]" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1d4882] opacity-0 group-hover:opacity-100 transition">
        Open <ArrowRight size={12} />
      </span>
    </button>
  );
}

/** Single-series horizontal bars (one hue, value labels in text ink). Each row opens its tab. */
function BarList({ rows, onRowClick }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <button
          key={r.key || r.label}
          onClick={() => onRowClick?.(r)}
          title={`${r.label}: ${fmt(r.count)}`}
          className="w-full text-left group"
        >
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 group-hover:text-[#1d4882]">{r.label}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{fmt(r.count)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full transition-all group-hover:opacity-80"
              style={{ width: `${r.count ? Math.max(2, (r.count / max) * 100) : 0}%`, background: BRAND }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

function Skeleton({ h = "h-24" }) {
  return <div className={`${h} rounded-xl bg-gray-100 animate-pulse`} />;
}

export default function Overview({ setActiveTab, canSee }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(null);
  const [dups, setDups] = useState(null);

  const load = useCallback(async () => {
    setError("");
    const res = await fetchOverview();
    if (res.data?.ok) setData(res.data);
    else setError(res.data?.message || "Could not load overview");
  }, []);

  // Data quality scans the whole DB, so it loads separately and never blocks the numbers above.
  const loadQuality = useCallback(async () => {
    if (!canSee("CompanyQuality")) return;
    const [pages, samePage, allPages] = await Promise.all([
      fetchQualityPages(),
      fetchDuplicateCompanies({ by: "both", scope: "page", limit: 1 }),
      fetchDuplicateCompanies({ by: "both", scope: "all", limit: 1 }),
    ]);
    setQuality(pages.data?.ok ? pages.data : { error: pages.data?.message || "Scan failed" });
    setDups({
      samePage: samePage.data?.ok ? samePage.data : null,
      allPages: allPages.data?.ok ? allPages.data : null,
    });
  }, [canSee]);

  useEffect(() => { load(); loadQuality(); }, [load, loadQuality]);

  const go = (tab) => canSee(tab) && setActiveTab(tab);
  const leads = data?.leads;
  const pagesWithIssues = (quality?.data || []).filter((p) => p.bad > 0).sort((a, b) => b.bad - a.bad);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => { setData(null); setQuality(null); setDups(null); load(); loadQuality(); }}
          className="px-3 py-2 rounded-lg border bg-white text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center justify-between">
          {error}
          <button onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {!data ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h="h-32" />)
        ) : (
          <>
            <StatTile
              icon={Building2}
              label="Total companies"
              value={fmt(data.companies.total)}
              sub={`+ ${fmt(data.companies.vendors)} vendors`}
              onClick={() => go("CityHub")}
            />
            {leads && (
              <StatTile
                icon={Inbox}
                label="Leads · 30 days"
                value={fmt(leads.last30)}
                sub={`${fmt(leads.last7)} this week · ${fmt(leads.total)} all time`}
                onClick={() => go("DataRequest")}
              />
            )}
            {leads && (
              <StatTile
                icon={ClipboardList}
                label="Listing requests"
                value={fmt(leads.listingRequests.pending)}
                sub={`pending · ${fmt(leads.listingRequests.last30)} new in 30 days`}
                onClick={() => go("ListingRequests")}
              />
            )}
            <StatTile
              icon={MapPin}
              label="City pages"
              value={fmt(data.pages.city.total)}
              sub={`${fmt(data.pages.city.published)} published · /msp`}
              onClick={() => go("CityHub")}
            />
            <StatTile
              icon={Globe2}
              label="Country pages"
              value={fmt(data.pages.topMsps.total + data.pages.topMssp.total)}
              sub={`${fmt(data.pages.topMsps.total)} Top MSPs · ${fmt(data.pages.topMssp.total)} Top MSSP`}
              onClick={() => go("CountryHub")}
            />
            <StatTile
              icon={FileText}
              label="Blog posts"
              value={fmt(data.pages.blogs.total)}
              sub={`${fmt(data.pages.blogs.published)} published`}
              onClick={() => go("blog")}
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Companies by source */}
        <Card title="Companies by page type" action={<span className="text-xs text-gray-500">Click a row to manage it</span>}>
          {!data ? <Skeleton h="h-48" /> : (
            <BarList rows={data.companies.breakdown} onRowClick={(r) => go(r.tab)} />
          )}
        </Card>

        {/* Leads */}
        {leads ? (
          <Card title="Leads" action={<LinkButton onClick={() => go("DataRequest")}>All leads</LinkButton>}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By form · all time</p>
                <BarList rows={leads.byType.map((t) => ({ key: t.type, label: t.type, count: t.total }))} onRowClick={() => go("DataRequest")} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Latest</p>
                <ul className="space-y-2.5">
                  {leads.recent.map((l, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-gray-900 truncate">{l.fullName || l.email}</p>
                      <p className="text-xs text-gray-500">{l.type} · {timeAgo(l.createdAt)}</p>
                    </li>
                  ))}
                  {leads.recent.length === 0 && <li className="text-sm text-gray-500">No leads yet</li>}
                </ul>
              </div>
            </div>
          </Card>
        ) : data ? (
          <Card title="Pages">
            <BarList
              rows={[
                { key: "city", label: "MSP city pages", count: data.pages.city.total, tab: "CityHub" },
                { key: "topMsps", label: "Top MSPs country pages", count: data.pages.topMsps.total, tab: "CountryHub" },
                { key: "topMssp", label: "Top MSSP country pages", count: data.pages.topMssp.total, tab: "MsspCountryHub" },
                { key: "blogs", label: "Blog posts", count: data.pages.blogs.total, tab: "blog" },
                { key: "cats", label: "Vendor categories", count: data.pages.categories.total, tab: "VendorDirectory" },
              ]}
              onRowClick={(r) => go(r.tab)}
            />
          </Card>
        ) : <Skeleton h="h-64" />}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Data quality */}
        {canSee("CompanyQuality") && (
          <Card title="Data quality" action={<LinkButton onClick={() => go("CompanyQuality")}>Open Data Quality</LinkButton>}>
            {!quality ? (
              <div className="space-y-3">
                <Skeleton h="h-16" />
                <p className="text-xs text-gray-500">Scanning every company for bad characters and duplicates…</p>
              </div>
            ) : quality.error ? (
              <p className="text-sm text-red-700">Could not scan: {quality.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => go("CompanyQuality")} className="text-left rounded-xl border p-3 hover:border-[#1d4882]">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {quality.totalBad ? <AlertTriangle size={13} className="text-red-600" /> : <CheckCircle2 size={13} className="text-green-600" />}
                      Bad characters
                    </p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{fmt(quality.totalBad)}</p>
                    <p className="text-[11px] text-gray-500">{quality.totalBad ? "companies to fix" : "all clean"}</p>
                  </button>
                  <button onClick={() => go("CompanyQuality")} className="text-left rounded-xl border p-3 hover:border-[#1d4882]">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Copy size={13} /> Same-page duplicates</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{fmt(dups?.samePage?.total)}</p>
                    <p className="text-[11px] text-gray-500">{fmt(dups?.samePage?.toDelete)} to remove</p>
                  </button>
                  <button onClick={() => go("CompanyQuality")} className="text-left rounded-xl border p-3 hover:border-[#1d4882]">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Copy size={13} /> On several pages</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{fmt(dups?.allPages?.total)}</p>
                    <p className="text-[11px] text-gray-500">same name + LinkedIn</p>
                  </button>
                </div>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-5 mb-2">Pages with bad characters</p>
                {pagesWithIssues.length === 0 ? (
                  <p className="text-sm text-green-700 flex items-center gap-1.5"><CheckCircle2 size={15} /> Every page is clean</p>
                ) : (
                  <ul className="divide-y">
                    {pagesWithIssues.slice(0, 6).map((p) => (
                      <li key={p.key} className="py-2 flex items-center gap-3 text-sm">
                        <AlertTriangle size={14} className="text-red-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">{p.path}</p>
                        </div>
                        <span className="text-xs font-semibold text-red-700 tabular-nums">{p.bad} of {p.total}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Card>
        )}

        {/* Recently updated */}
        <Card title="Recently updated pages">
          {!data ? <Skeleton h="h-64" /> : (
            <ul className="divide-y">
              {data.recentUpdates.map((u, i) => (
                <li key={i} className="py-2.5 flex items-center gap-3">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <button onClick={() => go(u.tab)} className="text-sm text-gray-900 hover:text-[#1d4882] truncate block max-w-full text-left">
                      {u.name}
                    </button>
                    <p className="text-xs text-gray-500 truncate">
                      {u.kind}{!u.published && " · draft"} · {timeAgo(u.updatedAt)}
                    </p>
                  </div>
                  <a
                    href={`${SITE}${u.path}`}
                    target="_blank"
                    rel="noreferrer"
                    title="View live page"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#1d4882] hover:bg-gray-50"
                  >
                    <ExternalLink size={14} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick links to every section */}
      <Card title="All sections">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {SECTIONS.filter((s) => canSee(s.tab)).map((s) => (
            <button
              key={s.tab}
              onClick={() => go(s.tab)}
              className="text-left rounded-xl border border-gray-200 p-4 hover:border-[#1d4882] hover:bg-blue-50/40 transition"
            >
              <s.icon size={18} className="text-[#1d4882]" />
              <p className="mt-2 text-sm font-semibold text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500 truncate">{s.hint}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
