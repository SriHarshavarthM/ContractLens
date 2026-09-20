const DAY = 24 * 60 * 60 * 1000;

export function parseIsoDate(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

export function formatDateShort(s) {
  const d = parseIsoDate(s);
  if (!d) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function relativeDays(s) {
  const d = parseIsoDate(s);
  if (!d) return null;
  return Math.round((d - new Date()) / DAY);
}

export function deadlineLabel(s) {
  const days = relativeDays(s);
  if (days === null) return null;
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'rose' };
  if (days === 0) return { text: 'Due today', tone: 'rose' };
  if (days <= 7) return { text: `${days}d left`, tone: 'amber' };
  return { text: `${days}d left`, tone: 'zinc' };
}

const SEVERITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

export function severityWeight(s) {
  return SEVERITY_WEIGHT[String(s || '').toLowerCase()] || 0;
}

export function severitySortKey(flag) {
  return 10 - severityWeight(flag.severity);
}

export function severityBarClasses(s) {
  const tone = String(s || '').toLowerCase();
  if (tone === 'critical' || tone === 'high')
    return 'bg-rose-400';
  if (tone === 'medium') return 'bg-amber-400';
  return 'bg-emerald-400';
}

export function urgencySortKey(item) {
  const u = String(item && (item.urgency || '')).toLowerCase();
  if (u === 'high') return 0;
  if (u === 'medium') return 1;
  return 2;
}

export function joinNames(arr, key = 'name') {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (x && x[key] ? String(x[key]).trim() : ''))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}