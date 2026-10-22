"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { wipeListingCompanies, deleteAllManagedIt } from "@/services/api";
import { AlertTriangle, ChevronDown } from "lucide-react";

/** The two bulk deletes of the Managed IT directory. Collapsed, and only for the admin role. */
export default function DangerZone({ onDone }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null); // "wipe" | "all"
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const CONFIRM = { wipe: "DELETE_COMPANIES", all: "DELETE_ALL" };

  const run = async () => {
    if (text.trim() !== CONFIRM[action]) {
      toast.error(`Type ${CONFIRM[action]} exactly to confirm`);
      return;
    }
    setBusy(true);
    const res = action === "wipe" ? await wipeListingCompanies() : await deleteAllManagedIt();
    setBusy(false);
    if (res.data?.ok) {
      toast.success(res.data.message || "Done");
      setAction(null);
      setText("");
      onDone?.();
    } else {
      toast.error(res.data?.message || "Failed");
    }
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-red-800">
        Bulk delete (Managed IT directory)
        <ChevronDown size={16} className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-red-200 p-4 text-sm text-red-900">
          <p className="text-xs text-red-700/80">These delete many companies at once and cannot be undone. The MSSP and cybersecurity directories have no bulk delete.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { setAction("wipe"); setText(""); }} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
              Delete Managed IT, city and Top MSPs companies
            </button>
            <button onClick={() => { setAction("all"); setText(""); }} className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
              Delete every Managed IT company
            </button>
          </div>
        </div>
      ) : null}

      {action ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <AlertTriangle size={22} className="text-red-500" />
              <h3 className="font-bold text-gray-800">{action === "wipe" ? "Delete listing companies?" : "Delete every Managed IT company?"}</h3>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              {action === "wipe"
                ? "This removes the companies of the Managed IT directory and of every /msp city page and /top-msps country page. The pages themselves, SEO text, MSSP and cybersecurity stay."
                : "This permanently deletes every company of the Managed IT directory."}
            </p>
            <p className="mb-3 text-xs text-gray-500">Type <span className="font-mono font-semibold text-red-700">{CONFIRM[action]}</span> to confirm.</p>
            <input value={text} onChange={(e) => setText(e.target.value)} className="mb-4 w-full rounded-lg border px-3 py-2 font-mono text-sm" autoComplete="off" placeholder={CONFIRM[action]} />
            <div className="flex gap-3">
              <button onClick={() => { setAction(null); setText(""); }} disabled={busy} className="flex-1 rounded-lg border py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={run} disabled={busy || text.trim() !== CONFIRM[action]} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40">
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
