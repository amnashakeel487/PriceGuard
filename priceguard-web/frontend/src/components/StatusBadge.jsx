export default function StatusBadge({ belowTarget, alertSent }) {
  let label = "Watching";
  let colorVar = "var(--text-secondary)";
  let bg = "var(--surface-3)";
  let dot = "var(--text-muted)";

  if (belowTarget && alertSent) {
    label = "Triggered";
    colorVar = "var(--violet-light)";
    bg = "var(--violet-tint)";
    dot = "var(--violet)";
  } else if (belowTarget) {
    label = "Below target";
    colorVar = "var(--emerald-light)";
    bg = "var(--emerald-tint)";
    dot = "var(--emerald)";
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: bg, color: colorVar }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}
