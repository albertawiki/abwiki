import React from 'react';

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

// Colours resolve through the CSS custom properties defined in App.css, so a
// chart follows the theme without React needing to know which one is active.
// SVG stroke and fill accept var() directly.
//
// The dark values are a selected palette rather than an inversion: the three
// series hues are re-stepped for a dark card and validated against it. See the
// token block in App.css.
export const series = {
  1: 'var(--series-1)',
  2: 'var(--series-2)',
  3: 'var(--series-3)',
};

export const ink = {
  primary: 'var(--text)',
  secondary: 'var(--text-secondary)',
  muted: 'var(--text-muted)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  surface: 'var(--surface)',
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
    boxShadow: '0 2px 8px var(--shadow)',
  },
  labelStyle: { color: ink.secondary, fontWeight: 600, marginBottom: 4 },
  cursor: { stroke: ink.axis, strokeWidth: 1 },
};

/** Hover wash behind a bar. Uses a theme token so it reads on either surface. */
export const barCursor = { fill: 'var(--hover-wash)' };

export const legendProps = {
  wrapperStyle: { fontSize: 13, color: ink.secondary, paddingTop: 8 },
  iconType: 'plainline',
  iconSize: 14,
};

/**
 * Whether to animate marks on mount.
 *
 * Honouring prefers-reduced-motion is the right thing to do for readers who
 * have asked for it, and it has a second use: it makes the figures render
 * deterministically, so the visual review in e2e/ compares charts rather than
 * animation frames. Read once at module load, which is enough — the visual
 * tests set the preference before the page loads.
 */
export const animate =
  typeof window === 'undefined' ||
  typeof window.matchMedia !== 'function' ||
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A dot filled with its own line's colour.
 *
 * Recharts' default dot is filled white with a coloured ring, so a dot with
 * no ring is a white disc that punches a hole in the line underneath it. With
 * one dot per observation that renders the whole series as a dashed line —
 * which is what every line chart here was doing until this was fixed. Taking
 * the fill from the line's stroke keeps the marks solid.
 */
const SeriesDot = ({ cx, cy, stroke }) =>
  cx === null || cy === null ? null : <circle cx={cx} cy={cy} r={3} fill={stroke} />;

/** Line defaults: thin marks, visible endpoints, gaps where data is missing. */
export const lineProps = {
  type: 'monotone',
  strokeWidth: 2,
  dot: <SeriesDot />,
  activeDot: { r: 6, strokeWidth: 2, stroke: ink.surface },
  connectNulls: false,
  isAnimationActive: animate,
};

/** Bar defaults: rounded data-ends, a gap between adjacent fills. */
export const barProps = {
  radius: [4, 4, 0, 0],
  maxBarSize: 56,
  isAnimationActive: animate,
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
