// Central design tokens so every screen looks consistent.
//
// The app has several themes (colours AND design: corner shapes, card style,
// spacing, heading weight). The chosen theme is applied ONCE, when the app
// starts (see App.js), by overwriting the objects below in place. Screens
// build their styles after that, so they pick up the theme automatically.

export const DEFAULT_THEME = "classic";

const base = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  statusFill: { danger: "#C0392B", success: "#1E8E5A", info: "#2D6CDF" },
};

export const THEMES = {
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
};

export const THEME_ORDER = ["classic", "ocean", "sunset", "royal", "midnight", "crimson"];

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
