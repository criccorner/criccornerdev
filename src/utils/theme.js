// Central design tokens so every screen looks consistent.
//
// The app has several themes (colours AND design: corner shapes, card style,
// spacing, heading weight). The chosen theme is applied ONCE, when the app
// starts (see App.js), by overwriting the objects below in place. Screens
// build their styles after that, so they pick up the theme automatically.

export const DEFAULT_THEME = "lagoon";

const base = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  statusFill: { danger: "#C0392B", success: "#1E8E5A", info: "#2D6CDF" },
};

export const THEMES = {
  lagoon: {
    label: "Lagoon",
    blurb: "Deep navy with teal. Clean, medium corners. The default.",
    // primary is the navy of the brand; accent is the brand teal, a touch deeper so small teal text stays readable on white.
    colors: { primary: "#01365C", primaryDark: "#012743", accent: "#068A97", background: "#F0F7F9", surface: "#FFFFFF", border: "#D3E4E9", text: "#0B2433", textMuted: "#5B7380" },
    radius: { sm: 6, md: 12, lg: 18, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.06, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  classic: {
    label: "Classic Green",
    blurb: "Deep cricket green and gold. Soft, rounded cards.",
    colors: { primary: "#0B5D3B", primaryDark: "#083F28", accent: "#F2A900", background: "#F5F7F6", surface: "#FFFFFF", border: "#E1E5E3", text: "#14211C", textMuted: "#6B7570" },
    radius: { sm: 6, md: 12, lg: 20, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.04, shadowRadius: 6, cardBorder: 1, heading: "700" },
  },
  ocean: {
    label: "Ocean Blue",
    blurb: "Cool blue and teal. Clean, medium corners.",
    colors: { primary: "#0B5FA5", primaryDark: "#084577", accent: "#0E9F92", background: "#F1F6FA", surface: "#FFFFFF", border: "#DCE5EC", text: "#10202D", textMuted: "#62727F" },
    radius: { sm: 5, md: 10, lg: 16, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.06, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  sunset: {
    label: "Sunset",
    blurb: "Warm orange and amber. Extra round and roomy.",
    colors: { primary: "#C2410C", primaryDark: "#8F2F08", accent: "#D97706", background: "#FFF7F0", surface: "#FFFFFF", border: "#F0DFD2", text: "#2A1810", textMuted: "#7A6458" },
    radius: { sm: 10, md: 18, lg: 28, pill: 999 },
    spacing: { xs: 4, sm: 10, md: 18, lg: 26, xl: 36 },
    design: { shadowOpacity: 0.1, shadowRadius: 12, cardBorder: 0, heading: "800" },
  },
  royal: {
    label: "Royal Purple",
    blurb: "Purple and gold. Sharp corners, flat outlined cards.",
    colors: { primary: "#5B2A86", primaryDark: "#401D61", accent: "#B8860B", background: "#F8F5FC", surface: "#FFFFFF", border: "#D9CCE8", text: "#1E1428", textMuted: "#6F6580" },
    radius: { sm: 2, md: 4, lg: 6, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0, shadowRadius: 0, cardBorder: 1.5, heading: "700" },
  },
  midnight: {
    label: "Midnight",
    blurb: "Navy and orange. Crisp corners, strong shadows.",
    colors: { primary: "#14213D", primaryDark: "#0B1426", accent: "#B86B00", background: "#EEF1F6", surface: "#FFFFFF", border: "#D5DBE6", text: "#101828", textMuted: "#5B6577" },
    radius: { sm: 4, md: 8, lg: 12, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.16, shadowRadius: 10, cardBorder: 0, heading: "800" },
  },
  crimson: {
    label: "Crimson",
    blurb: "Bold red with charcoal. Compact and tight.",
    colors: { primary: "#B3123E", primaryDark: "#80092B", accent: "#1F2937", background: "#FDF4F6", surface: "#FFFFFF", border: "#F2D9DF", text: "#2B0E16", textMuted: "#7B5A63" },
    radius: { sm: 6, md: 10, lg: 14, pill: 999 },
    spacing: { xs: 3, sm: 6, md: 12, lg: 20, xl: 28 },
    design: { shadowOpacity: 0.05, shadowRadius: 5, cardBorder: 1, heading: "800" },
  },
  emerald: {
    label: "Emerald",
    blurb: "Fresh green with a coral accent, the bright team-icon look.",
    colors: { primary: "#047857", primaryDark: "#065F46", accent: "#F97316", background: "#F0FAF5", surface: "#FFFFFF", border: "#CDE9DC", text: "#0B2A20", textMuted: "#55766A" },
    radius: { sm: 8, md: 14, lg: 22, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.07, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  teal: {
    label: "Teal & Mint",
    blurb: "Teal with mint highlights. Calm and modern.",
    colors: { primary: "#0F766E", primaryDark: "#115E59", accent: "#EC4899", background: "#F0FAF9", surface: "#FFFFFF", border: "#CCE8E5", text: "#0B2927", textMuted: "#5A7977" },
    radius: { sm: 6, md: 12, lg: 18, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.06, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  forest: {
    label: "Forest",
    blurb: "Dark forest green with amber. Classic and grounded.",
    colors: { primary: "#14532D", primaryDark: "#0F3D21", accent: "#D97706", background: "#F4F8F2", surface: "#FFFFFF", border: "#D6E3D0", text: "#122217", textMuted: "#62705F" },
    radius: { sm: 6, md: 12, lg: 18, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.05, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  indigo: {
    label: "Indigo",
    blurb: "Deep indigo with sky blue. Crisp and professional.",
    colors: { primary: "#3730A3", primaryDark: "#2A2480", accent: "#0EA5E9", background: "#F3F4FC", surface: "#FFFFFF", border: "#D9DBF2", text: "#14163A", textMuted: "#62658C" },
    radius: { sm: 4, md: 8, lg: 12, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.1, shadowRadius: 8, cardBorder: 0, heading: "800" },
  },
  berry: {
    label: "Berry",
    blurb: "Rich berry with lime. Bold and playful.",
    colors: { primary: "#9D174D", primaryDark: "#721138", accent: "#65A30D", background: "#FDF2F7", surface: "#FFFFFF", border: "#F1D3E1", text: "#2D0A1C", textMuted: "#7C5568" },
    radius: { sm: 8, md: 14, lg: 22, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.08, shadowRadius: 8, cardBorder: 1, heading: "800" },
  },
  rose: {
    label: "Rose",
    blurb: "Soft rose with teal. Warm and friendly.",
    colors: { primary: "#BE185D", primaryDark: "#8F1245", accent: "#0D9488", background: "#FFF1F6", surface: "#FFFFFF", border: "#F6D5E3", text: "#2E0C1E", textMuted: "#80586B" },
    radius: { sm: 8, md: 14, lg: 22, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.08, shadowRadius: 8, cardBorder: 0, heading: "700" },
  },
  amber: {
    label: "Amber Gold",
    blurb: "Golden amber with deep navy. Sunny and clear.",
    colors: { primary: "#B45309", primaryDark: "#8A3F07", accent: "#1D4ED8", background: "#FFFBEB", surface: "#FFFFFF", border: "#F1E1B8", text: "#2B1D07", textMuted: "#7D6A43" },
    radius: { sm: 6, md: 12, lg: 18, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.06, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  sky: {
    label: "Sky Blue",
    blurb: "Bright sky blue with orange. Light and airy.",
    colors: { primary: "#0369A1", primaryDark: "#075985", accent: "#EA580C", background: "#F0F9FF", surface: "#FFFFFF", border: "#CFE6F5", text: "#0B2536", textMuted: "#5A7A8E" },
    radius: { sm: 8, md: 14, lg: 22, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.06, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  coral: {
    label: "Coral",
    blurb: "Coral red with deep teal. Energetic.",
    colors: { primary: "#DC2626", primaryDark: "#A71A1A", accent: "#0F766E", background: "#FFF5F5", surface: "#FFFFFF", border: "#F5D5D5", text: "#2B0E0E", textMuted: "#7E5B5B" },
    radius: { sm: 6, md: 12, lg: 18, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.07, shadowRadius: 8, cardBorder: 1, heading: "800" },
  },
  slate: {
    label: "Slate",
    blurb: "Neutral slate with violet. Quiet and minimal.",
    colors: { primary: "#334155", primaryDark: "#1E293B", accent: "#7C3AED", background: "#F1F5F9", surface: "#FFFFFF", border: "#D8DFE8", text: "#0F172A", textMuted: "#5B6678" },
    radius: { sm: 4, md: 8, lg: 12, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.04, shadowRadius: 8, cardBorder: 1, heading: "700" },
  },
  graphite: {
    label: "Graphite & Lime",
    blurb: "Charcoal with lime green. Sporty and high contrast.",
    colors: { primary: "#1F2937", primaryDark: "#111827", accent: "#65A30D", background: "#F3F4F6", surface: "#FFFFFF", border: "#D9DCE1", text: "#0F1115", textMuted: "#5F6673" },
    radius: { sm: 4, md: 8, lg: 12, pill: 999 },
    spacing: base.spacing,
    design: { shadowOpacity: 0.14, shadowRadius: 8, cardBorder: 0, heading: "800" },
  },
};

export const THEME_ORDER = ["lagoon", "classic", "ocean", "sunset", "royal", "midnight", "crimson", "emerald", "teal", "forest", "indigo", "berry", "rose", "amber", "sky", "coral", "slate", "graphite"];

// These objects are exported once and then UPDATED IN PLACE by applyTheme.
export const colors = {};
export const spacing = {};
export const radius = {};
export const design = {};
export const typography = {};

let applied = DEFAULT_THEME;
export const appliedTheme = () => applied;

export function applyTheme(name) {
  const key = THEMES[name] ? name : DEFAULT_THEME;
  const t = THEMES[key];
  applied = key;
  Object.assign(colors, base.statusFill, t.colors);
  Object.assign(spacing, t.spacing);
  Object.assign(radius, t.radius);
  Object.assign(design, t.design);
  Object.assign(typography, {
    h1: { fontSize: 26, fontWeight: design.heading, color: colors.text },
    h2: { fontSize: 20, fontWeight: design.heading, color: colors.text },
    h3: { fontSize: 16, fontWeight: "600", color: colors.text },
    body: { fontSize: 14, fontWeight: "400", color: colors.text },
    muted: { fontSize: 13, fontWeight: "400", color: colors.textMuted },
    label: { fontSize: 12, fontWeight: "600", color: colors.textMuted, letterSpacing: 0.5 },
  });
  return key;
}

applyTheme(DEFAULT_THEME);
