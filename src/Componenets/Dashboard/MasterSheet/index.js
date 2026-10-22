"use client";

import { useState } from "react";
import MspSheet from "./MspSheet";
import PlaceSheet from "./PlaceSheet";

const TABS = [
  { key: "msp", label: "MSP sheet" },
  { key: "mssp", label: "MSSP sheet" },
  { key: "cyber", label: "Cybersecurity sheet" },
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
      <div className={tab === "mssp" ? "" : "hidden"}>
        <PlaceSheet
          kind="mssp"
          reportName="mssp-import-report.xlsx"
          fileHint="Select the MSSP master .xlsx"
          intro={<>One Excel file fills the MSSP directory (<b>/managed-security-service-providers</b>) and its country, state and city pages under <b>/mssp</b>. Same columns as the MSP master sheet. An upload adds new companies and updates the ones already there, nothing is deleted, and at most 10,000 companies fit in one upload. Always run a preview first.</>}
          rule="Which states and cities get a page is set in the code (backend/config/msspPages.js). Countries with too few companies get none; their companies stay in the directory."
          label="MSSP"
        />
      </div>
      <div className={tab === "cyber" ? "" : "hidden"}>
        <PlaceSheet
          kind="cyber"
          reportName="cybersecurity-import-report.xlsx"
          fileHint="Select the cybersecurity master .xlsx"
          intro={<>One Excel file fills the cybersecurity directory (<b>/cybersecurity-companies</b>) and its country, state and city pages (<b>/cybersecurity-companies-in-...</b>). Same columns as the MSP master sheet. A company with a Live Slug keeps its profile link. An upload adds new companies and updates the ones already there, nothing is deleted, and at most 10,000 companies fit in one upload. Always run a preview first.</>}
          rule="A country, state or city gets a page when it has at least 10 companies (backend/config/cyberPages.js). Smaller places stay in the directory."
          label="cybersecurity"
        />
      </div>
    </div>
  );
}
