"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCitiesAdmin } from "@/services/api";
import { X } from "lucide-react";

const HUBS = [
  { hub: "managed-service-providers", label: "City or state", base: "/msp" },
  { hub: "top-msps", label: "Country", base: "/top-msps" },
];

/**
 * Chooses the city, state and country pages a company is shown on besides the ones its location gives it. Search a page by
 * name, click it to add it, click the cross to take it off. The value is a list of "hubSlug/slug".
 */
export default function ExtraPagesPicker({ value, onChange, max = 30 }) {
  const [pages, setPages] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all(HUBS.map((h) => fetchCitiesAdmin(h.hub))).then((res) => {
      if (!live) return;
      const all = [];
      res.forEach((r, i) => (r.data?.data || []).forEach((p) => all.push({ key: `${HUBS[i].hub}/${p.slug}`, name: p.name, state: p.state || "", base: HUBS[i].base, slug: p.slug, label: HUBS[i].label })));
      setPages(all.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => { live = false; };
  }, []);

  const chosen = new Set(value);
  const term = q.trim().toLowerCase();
  const found = useMemo(
    () => (term.length < 1 ? [] : pages.filter((p) => !chosen.has(p.key) && `${p.name} ${p.slug} ${p.state}`.toLowerCase().includes(term)).slice(0, 8)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages, term, value],
  );
  const byKey = new Map(pages.map((p) => [p.key, p]));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((k) => {
          const p = byKey.get(k);
          return (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-[#1d4882]">
              {p ? `${p.name}${p.state ? `, ${p.state}` : ""}` : k}
              <span className="text-xs text-gray-400">{p?.base}/{p?.slug}</span>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} aria-label="Remove page" className="text-gray-400 hover:text-red-600"><X size={14} /></button>
            </span>
          );
        })}
        {value.length === 0 ? <span className="text-sm text-gray-400">No extra pages</span> : null}
      </div>
      {value.length < max ? (
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a city, state or country page..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          {found.length > 0 ? (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {found.map((p) => (
                <li key={p.key}>
                  <button type="button" onClick={() => { onChange([...value, p.key]); setQ(""); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50">
                    <span><b>{p.name}</b>{p.state ? <span className="text-gray-500">, {p.state}</span> : null}</span>
                    <span className="text-xs text-gray-400">{p.label} {p.base}/{p.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : <p className="text-xs text-amber-700">The most pages ({max}) are chosen.</p>}
    </div>
  );
}
