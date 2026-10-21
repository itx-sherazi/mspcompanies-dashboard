"use client";

import { useState } from "react";
import MspSheet from "./MspSheet";
import MsspSheet from "./MsspSheet";

const TABS = [
  { key: "msp", label: "MSP sheet" },
  { key: "mssp", label: "MSSP sheet" },
];

export default function MasterSheet() {
  const [tab, setTab] = useState("msp");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">Master Sheet</h1>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${tab === t.key ? "bg-[#0356A6] text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Both stay mounted so a half-finished preview is not lost when switching tabs. */}
      <div className={tab === "msp" ? "" : "hidden"}><MspSheet /></div>
      <div className={tab === "mssp" ? "" : "hidden"}><MsspSheet /></div>
    </div>
  );
}
