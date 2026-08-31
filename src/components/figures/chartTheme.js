// Shared visual language for every figure on the site.
//
// Charts here are read by people deciding what to think about a public issue,
// so they follow three rules: one colour per entity (never per rank), at most
// three series before we split into separate figures, and every figure is
// backed by a table of the same numbers.
//
// The categorical slots below are validated for colour-vision deficiency
// against a white card surface. Do not add a fourth slot without re-running
// the validation — fold the tail into "Other" or split the figure instead.

export const series = {
  1: '#2a78d6', // blue
  2: '#eb6834', // orange
  3: '#1baf7a', // aqua
};

export const ink = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  surface: '#ffffff',
};

/** Recharts props shared by every axis, so chrome stays recessive. */
export const axisProps = {
  tick: { fill: ink.muted, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: ink.axis },
};

export const gridProps = {
  stroke: ink.grid,
  strokeDasharray: '0',
  vertical: false,
};

export const tooltipProps = {
  contentStyle: {
    background: ink.surface,
    border: `1px solid ${ink.grid}`,
    borderRadius: 8,
    fontSize: 13,
    color: ink.primary,
    boxShadow: '0 2px 8px rgba(11,11,11,0.08)',
  },
  labelStyle: { color: ink.secondary, fontWeight: 600, marginBottom: 4 },
  cursor: { stroke: ink.axis, strokeWidth: 1 },
};

export const legendProps = {
  wrapperStyle: { fontSize: 13, color: ink.secondary, paddingTop: 8 },
  iconType: 'plainline',
  iconSize: 14,
};

/** Line defaults: thin marks, visible endpoints, gaps where data is missing. */
export const lineProps = {
  type: 'monotone',
  strokeWidth: 2,
  dot: { r: 3, strokeWidth: 0 },
  activeDot: { r: 6, strokeWidth: 2, stroke: ink.surface },
  connectNulls: false,
};

/**
 * Y-axis domain padded by a share of the data range.
 *
 * Charts of rates and counts start at zero unless the interesting variation
 * would vanish; pass `zeroBased` when zero is meaningful.
 */
export const paddedDomain = (pad = 0.15, zeroBased = false) => ([min, max]) => {
  if (zeroBased) return [0, max + (max - 0) * pad];
  const range = (max - min) || Math.abs(max) || 1;
  return [min - range * pad, max + range * pad];
};

export const CHART_HEIGHT = 300;
