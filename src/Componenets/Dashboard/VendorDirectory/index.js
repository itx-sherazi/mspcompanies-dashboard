"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchCategories, fetchCategoryBySlug,
  createCategory, deleteCategory,
  fetchParentCategories, createParentCategory,
  updateParentCategory, deleteParentCategory,
} from "@/services/api";
import CategoryEditor from "./CategoryEditor";
import VendorManager from "./VendorManager";
import {
  Search, Plus, Trash2, Pencil, ExternalLink,
  ChevronDown, ChevronRight, Store, X, FolderOpen, Folder,
  LayoutList, Globe, FileText,
} from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mspcompanies.us";

const STATUS_BADGE = {
  "To Do":   "bg-gray-100 text-gray-500 border-gray-200",
  draft:     "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-green-50 text-green-700 border-green-200",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function VendorDirectory() {
  const [mainTab, setMainTab]               = useState("structure"); // structure | vendors
  const [editingCategory, setEditingCategory] = useState(null);

  const [categories, setCategories]         = useState([]);
  const [parents, setParents]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");

  // modals
  const [newGroupOpen, setNewGroupOpen]     = useState(false);
  const [newCatGroup, setNewCatGroup]       = useState(null); // group id to add cat under
  const [editGroup, setEditGroup]           = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [catRes, parRes] = await Promise.all([fetchCategories(), fetchParentCategories()]);
    if (catRes.data?.ok)  setCategories(catRes.data.data  || []);
    if (parRes.data?.ok)  setParents(parRes.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (editingCategory) {
    return (
      <CategoryEditor
        category={editingCategory}
        onBack={() => setEditingCategory(null)}
        refreshList={loadAll}
      />
    );
  }

  // build map: group slug → categories
  const catsByGroup = {};
  for (const cat of categories) {
    const g = cat.group || "__none__";
    if (!catsByGroup[g]) catsByGroup[g] = [];
    catsByGroup[g].push(cat);
  }

  // ungrouped = categories not in any parent
  const allLinkedSlugs = new Set(parents.flatMap((p) => p.subcategories));
  const ungroupedCats  = categories.filter(
    (c) => !allLinkedSlugs.has(c.slug) &&
    (!search || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredParents = parents.map((p) => ({
    ...p,
    filteredSubs: (p.subcategoryDetails || []).filter(
      (s) => !search || (s.title || s.slug).toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((p) => !search || p.filteredSubs.length > 0 || p.title.toLowerCase().includes(search.toLowerCase()));

  const totalPages = categories.filter((c) => c.status === "published").length;

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Vendor Directory</h1>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
              <span><strong className="text-gray-600">{parents.length}</strong> groups</span>
              <span>·</span>
              <span><strong className="text-gray-600">{categories.length}</strong> categories</span>
              <span>·</span>
              <span><strong className="text-green-600">{totalPages}</strong> published</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`${SITE}/best`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg">
              <Globe size={12} /> View /best
            </a>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { id: "structure", label: "Structure", icon: <LayoutList size={14} /> },
                { id: "vendors",   label: "Vendors",   icon: <Store size={14} /> },
              ].map((t) => (
                <button key={t.id} onClick={() => setMainTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    mainTab === t.id ? "bg-white text-[#1d4882] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ VENDORS ══ */}
      {mainTab === "vendors" && <VendorManager />}

      {/* ══ STRUCTURE ══ */}
      {mainTab === "structure" && (
        <div className="p-6 max-w-5xl mx-auto">

          {/* Search + New Group */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border border-gray-200 bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
                placeholder="Search groups or categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => { setNewGroupOpen(true); setEditGroup(null); }}
              className="flex items-center gap-2 bg-[#1d4882] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-[#163a6e] transition-colors">
              <Plus size={15} /> New Group
            </button>
          </div>

          {/* New / Edit Group modal */}
          {(newGroupOpen || editGroup) && (
            <GroupForm
              initial={editGroup}
              onSave={async (data) => {
                if (editGroup) {
                  const res = await updateParentCategory(editGroup._id, data);
                  if (res.data?.ok) { toast.success("Group updated"); setEditGroup(null); loadAll(); }
                  else toast.error(res.data?.error || "Failed");
                } else {
                  const res = await createParentCategory(data);
                  if (res.data?.ok) { toast.success("Group created"); setNewGroupOpen(false); loadAll(); }
                  else toast.error(res.data?.error || "Failed");
                }
              }}
              onCancel={() => { setNewGroupOpen(false); setEditGroup(null); }}
            />
          )}

          {/* New Category under group modal */}
          {newCatGroup && (
            <NewCategoryForm
              groupTitle={newCatGroup.title}
              onSave={async (data) => {
                // create category with group name
                const res = await createCategory({ ...data, group: newCatGroup.title });
                if (!res.data?.ok) { toast.error(res.data?.error || "Failed"); return; }
                // link to parent
                const newSlug = res.data.data.slug;
                const subs    = [...newCatGroup.subcategories, newSlug];
                await updateParentCategory(newCatGroup._id, { subcategories: subs });
                toast.success(`"${data.title}" created under ${newCatGroup.title}`);
                setNewCatGroup(null);
                loadAll();
              }}
              onCancel={() => setNewCatGroup(null)}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#1d4882] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* ── Each Group ── */}
              {filteredParents.map((parent) => (
                <GroupCard
                  key={parent._id}
                  parent={parent}
                  allCategories={categories}
                  onRefresh={loadAll}
                  onEditGroup={() => { setEditGroup(parent); setNewGroupOpen(false); }}
                  onDeleteGroup={async () => {
                    if (!confirm(`Delete group "${parent.title}"? Categories inside will NOT be deleted.`)) return;
                    const res = await deleteParentCategory(parent._id);
                    if (res.data?.ok) { toast.success("Group deleted"); loadAll(); }
                    else toast.error(res.data?.error || "Failed");
                  }}
                  onAddCategory={() => setNewCatGroup(parent)}
                  onRemoveFromGroup={async (slug) => {
                    const subs = parent.subcategories.filter((s) => s !== slug);
                    await updateParentCategory(parent._id, { subcategories: subs });
                    loadAll();
                  }}
                  onEditCategory={async (slug) => {
                    try {
                      const res = await fetchCategoryBySlug(slug);
                      if (res.data?.ok) {
                        setEditingCategory(res.data.data);
                      } else {
                        console.error("fetchCategoryBySlug failed:", res);
                        toast.error(res.data?.error || "Failed to load category");
                      }
                    } catch (err) {
                      console.error("fetchCategoryBySlug error:", err);
                      toast.error("Error loading category");
                    }
                  }}
                  onDeleteCategory={async (slug, title) => {
                    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
                    const res = await deleteCategory(slug);
                    if (res.data?.ok) { toast.success("Deleted"); loadAll(); }
                    else toast.error(res.data?.error || "Failed");
                  }}
                />
              ))}

              {/* ── Ungrouped ── */}
              {ungroupedCats.length > 0 && (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <Folder size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-500">Ungrouped Categories</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold ml-auto">
                      {ungroupedCats.length}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {ungroupedCats.map((cat) => (
                      <CategoryRow
                        key={cat.slug}
                        cat={cat}
                        showRemove={false}
                        onEdit={async () => {
                          try {
                            const res = await fetchCategoryBySlug(cat.slug);
                            if (res.data?.ok) {
                              setEditingCategory(res.data.data);
                            } else {
                              console.error("fetchCategoryBySlug failed:", res);
                              toast.error(res.data?.error || "Failed to load category");
                            }
                          } catch (err) {
                            console.error("fetchCategoryBySlug error:", err);
                            toast.error("Error loading category");
                          }
                        }}
                        onDelete={async () => {
                          if (!confirm(`Delete "${cat.title}"?`)) return;
                          const res = await deleteCategory(cat.slug);
                          if (res.data?.ok) { toast.success("Deleted"); loadAll(); }
                          else toast.error(res.data?.error || "Failed");
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {filteredParents.length === 0 && ungroupedCats.length === 0 && !loading && (
                <div className="text-center py-20 text-gray-400">
                  <LayoutList size={40} className="mx-auto mb-4 text-gray-200" />
                  <p className="font-bold text-gray-500">
                    {search ? "No results found" : "No groups yet"}
                  </p>
                  <p className="text-sm mt-1">
                    {search ? "Try a different search" : "Click \"New Group\" to get started"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Group Card ────────────────────────────────────────────────────────────────
function GroupCard({ parent, allCategories, onEditGroup, onDeleteGroup, onAddCategory,
  onRemoveFromGroup, onEditCategory, onDeleteCategory, onRefresh }) {
  const [expanded, setExpanded]         = useState(true);
  const [showPicker, setShowPicker]     = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const subs       = parent.filteredSubs || parent.subcategoryDetails || [];
  const linkedSlugs = new Set(parent.subcategories);

  const pickerCats = allCategories.filter((c) => {
    if (linkedSlugs.has(c.slug)) return false;
    if (pickerSearch) return c.title.toLowerCase().includes(pickerSearch.toLowerCase());
    return true;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Group header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#f8faff] to-white border-b border-gray-100">
        <button onClick={() => setExpanded((e) => !e)}
          className="text-gray-400 hover:text-[#1d4882] transition-colors flex-shrink-0">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        {expanded
          ? <FolderOpen size={18} className="text-[#1d4882] flex-shrink-0" />
          : <Folder size={18} className="text-gray-400 flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-extrabold text-[#1d4882] leading-none">{parent.title}</h2>
          {parent.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{parent.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {parent.subcategories.length} categories
          </span>
          <button onClick={onAddCategory}
            className="flex items-center gap-1 text-xs font-semibold text-[#1d4882] border border-[#1d4882]/30 hover:bg-[#1d4882] hover:text-white px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={12} /> Add Category
          </button>
          <button onClick={onEditGroup}
            className="p-1.5 text-gray-400 hover:text-[#1d4882] hover:bg-blue-50 rounded-lg transition-colors" title="Edit group">
            <Pencil size={14} />
          </button>
          <button onClick={onDeleteGroup}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete group">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Existing category picker */}
      {expanded && showPicker && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs font-bold text-blue-700 mb-2">Link an existing category to this group:</p>
          <input
            className="w-full border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-[#1d4882] outline-none"
            placeholder="Search categories…"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
            {pickerCats.slice(0, 15).map((c) => (
              <button key={c.slug}
                onClick={async () => {
                  const newSubs = [...parent.subcategories, c.slug];
                  const res = await updateParentCategory(parent._id, { subcategories: newSubs });
                  if (res.data?.ok) { setShowPicker(false); setPickerSearch(""); onRefresh?.(); }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white text-sm text-gray-700 hover:text-[#1d4882] text-left transition-colors">
                <Plus size={12} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate font-medium">{c.title}</span>
                <span className="text-xs text-gray-400 font-mono">{c.slug}</span>
              </button>
            ))}
            {pickerCats.length === 0 && (
              <p className="text-xs text-gray-400 py-2 text-center">All categories already linked</p>
            )}
          </div>
          <button onClick={() => { setShowPicker(false); setPickerSearch(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-2">Cancel</button>
        </div>
      )}

      {/* Categories list */}
      {expanded && (
        <div>
          {subs.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <FileText size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm font-semibold text-gray-400">No categories yet</p>
              <p className="text-xs mt-1 text-gray-300">Click "Add Category" to create one</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {subs.map((sub) => (
                <CategoryRow
                  key={sub.slug}
                  cat={sub}
                  showRemove
                  onRemove={() => onRemoveFromGroup(sub.slug)}
                  onEdit={() => onEditCategory(sub.slug)}
                  onDelete={() => onDeleteCategory(sub.slug, sub.title || sub.slug)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({ cat, showRemove, onRemove, onEdit, onDelete }) {
  const slug    = cat.slug || "";
  const title   = cat.title || slug;
  const status  = cat.status || "To Do";

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
      {/* Indent line */}
      <div className="w-4 flex-shrink-0 flex items-center">
        <div className="w-px h-4 bg-gray-200 mx-auto" />
      </div>

      {/* Title + slug */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 truncate">{title}</p>
        <p className="text-[11px] text-gray-400 font-mono truncate">/best/{slug}</p>
      </div>

      {/* Status */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_BADGE[status] || STATUS_BADGE["To Do"]}`}>
        {status}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={`${SITE}/best/${slug}`} target="_blank" rel="noopener noreferrer"
          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="View page">
          <ExternalLink size={13} />
        </a>
        <button onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold text-[#1d4882] border border-[#1d4882]/30 hover:bg-[#1d4882] hover:text-white px-2.5 py-1.5 rounded-lg transition-colors">
          <Pencil size={11} /> Edit
        </button>
        {showRemove && (
          <button onClick={onRemove}
            className="p-1.5 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Remove from group">
            <X size={13} />
          </button>
        )}
        <button onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete category">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── MetaField  input/textarea with live progress bar ────────────────────────
function MetaField({ label, hint, placeholder, value, onChange, ideal, max, idealLabel, multiline }) {
  const len    = value.length;
  const over   = len > max;
  const pct    = Math.min((len / max) * 100, 100);
  const barColor = over
    ? "bg-red-500"
    : len >= ideal * 0.85
      ? "bg-green-500"
      : "bg-blue-400";

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}
        {hint && <span className="font-normal text-gray-400 ml-1">({hint})</span>}
      </label>

      {multiline ? (
        <textarea
          rows={3}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none resize-none transition-colors ${
            over ? "border-red-400 bg-red-50/40" : "border-gray-300"
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none transition-colors ${
            over ? "border-red-400 bg-red-50/40" : "border-gray-300"
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <p className="text-xs text-gray-400">{idealLabel}</p>
        <p className={`text-xs font-bold ${over ? "text-red-500" : len >= ideal * 0.85 ? "text-green-600" : "text-gray-400"}`}>
          {len}/{max}{over ? ` (+${len - max})` : ""}
        </p>
      </div>
    </div>
  );
}

// ── Group Form (Create / Edit) ─────────────────────────────────────────────────
function GroupForm({ initial, onSave, onCancel }) {
  const [form, setForm]     = useState({ title: initial?.title || "", description: initial?.description || "" });
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-white border border-[#1d4882]/20 rounded-2xl p-6 mb-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FolderOpen size={16} className="text-[#1d4882]" />
        {initial ? `Edit Group: ${initial.title}` : "Create New Group"}
      </h3>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Group Name *</label>
          <input
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
            placeholder="e.g. Cybersecurity, Backup & DR, MSP Software"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">This is just a label  no URL is created for a group.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Description <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none resize-none"
            placeholder="Short description of this group"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 bg-[#1d4882] text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#163a6e] transition-colors">
            {saving ? "Saving…" : initial ? "Update Group" : "Create Group"}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Category Form ─────────────────────────────────────────────────────────
function toSlug(str) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function NewCategoryForm({ groupTitle, onSave, onCancel }) {
  const [form, setForm]       = useState({ title: "", slug: "", metaTitle: "", metaDescription: "" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving]   = useState(false);

  const handleTitleChange = (val) => {
    setForm((f) => ({
      ...f,
      title: val,
      slug: slugEdited ? f.slug : toSlug(val),
    }));
  };

  const handleSlugChange = (val) => {
    setSlugEdited(true);
    setForm((f) => ({ ...f, slug: toSlug(val) }));
  };

  return (
    <div className="bg-white border border-[#1d4882]/20 rounded-2xl p-6 mb-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Plus size={16} className="text-[#1d4882]" />
        New Category
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Adding to group: <strong className="text-[#1d4882]">{groupTitle}</strong>
      </p>

      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Category Title *</label>
          <input
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1d4882] outline-none"
            placeholder="e.g. MDR Tools, EDR Software, SIEM Software"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Slug (URL) *</label>
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1d4882]">
            <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">/best/</span>
            <input
              className="flex-1 px-3 py-2.5 text-sm outline-none font-mono"
              placeholder="mdr-tools"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
            />
          </div>
          {form.slug && (
            <p className="text-xs mt-1.5 text-gray-400">
              Page URL:{" "}
              <span className="font-mono text-[#1d4882] bg-blue-50 px-1.5 py-0.5 rounded">
                /best/{form.slug}
              </span>
            </p>
          )}
        </div>

        {/* Meta fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetaField
            label="Meta Title"
            hint="Google tab title"
            placeholder="Best MDR Tools for MSPs 2026"
            value={form.metaTitle}
            onChange={(v) => setForm((f) => ({ ...f, metaTitle: v }))}
            ideal={60}
            max={70}
            idealLabel="Ideal: 50–60 chars"
          />
          <MetaField
            label="Meta Description"
            hint="Google snippet"
            placeholder="Compare the best MDR tools for MSPs  pricing, features, pros & cons."
            value={form.metaDescription}
            onChange={(v) => setForm((f) => ({ ...f, metaDescription: v }))}
            ideal={155}
            max={160}
            idealLabel="Ideal: 140–155 chars"
            multiline
          />
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          <strong>After creating:</strong> Click "Edit" on the category to add the H1 heading, SEO article content, FAQs, and vendor rankings.
        </div>

        <div className="flex gap-2">
          <button
            onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            disabled={saving || !form.title.trim() || !form.slug.trim()}
            className="flex items-center gap-2 bg-[#1d4882] text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#163a6e] transition-colors">
            {saving ? "Creating…" : "Create Category"}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
