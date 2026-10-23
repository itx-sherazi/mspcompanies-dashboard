/** Sort order for rows with an edit time: the most recently edited first, rows never edited last. */
export const byUpdated = (a, b) => (b.editedAt ? new Date(b.editedAt).getTime() : 0) - (a.editedAt ? new Date(a.editedAt).getTime() : 0);

/** "23 Oct 2026, 3:45 PM" in the viewer's own time zone, or "-" when there is no date. `approx` puts a "~" in front. */
export function formatUpdated(value, approx = false) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${approx ? "~ " : ""}${date}, ${time}`;
}
