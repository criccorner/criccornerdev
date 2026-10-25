// Shot types and wagon-wheel directions the scorer can record with a run.
// Directions are described the cricket way (off side / leg side), so they stay
// right for left-handed batters: the wheel is mirrored, the names do not change.
//
// Wheel layout (top-down, bowler at the top, batter faces up). For a right-hander
// the off side is on the right of the picture. Angles are clockwise from "up".

export const ZONES = [
  { key: "long_off", label: "Long-off", side: "off", angle: 22.5 },
  { key: "cover", label: "Cover", side: "off", angle: 67.5 },
  { key: "point", label: "Point", side: "off", angle: 112.5 },
  { key: "third_man", label: "Third man", side: "off", angle: 157.5 },
  { key: "fine_leg", label: "Fine leg", side: "leg", angle: 202.5 },
  { key: "square_leg", label: "Square leg", side: "leg", angle: 247.5 },
  { key: "mid_wicket", label: "Mid-wicket", side: "leg", angle: 292.5 },
  { key: "long_on", label: "Long-on", side: "leg", angle: 337.5 },
];

// `towards` = where this shot usually goes (used to highlight likely directions).
export const SHOTS = [
  { key: "drive", label: "Drive", towards: ["long_off", "cover", "long_on"] },
  { key: "lofted", label: "Lofted shot", towards: ["long_off", "long_on", "mid_wicket", "cover"] },
  { key: "cut", label: "Cut", towards: ["point", "third_man"] },
  { key: "pull", label: "Pull", towards: ["mid_wicket", "square_leg"] },
  { key: "hook", label: "Hook", towards: ["fine_leg", "square_leg"] },
  { key: "sweep", label: "Sweep", towards: ["square_leg", "fine_leg", "mid_wicket"] },
  { key: "reverse_sweep", label: "Reverse sweep", towards: ["point", "third_man"] },
  { key: "glance", label: "Glance / flick", towards: ["fine_leg", "square_leg"] },
  { key: "slog", label: "Slog", towards: ["mid_wicket", "long_on"] },
  { key: "scoop", label: "Scoop / ramp", towards: ["fine_leg", "third_man"] },
  { key: "defend", label: "Defend / push", towards: ["long_off", "long_on"] },
  { key: "edge", label: "Edge", towards: ["third_man", "fine_leg"] },
  { key: "other", label: "Other", towards: [] },
];

export const zoneByKey = (k) => ZONES.find((z) => z.key === k) || null;
export const shotByKey = (k) => SHOTS.find((s) => s.key === k) || null;

// Angle (degrees clockwise from up) of a zone for a right- or left-handed batter.
export const zoneAngle = (zone, hand) => {
  const z = typeof zone === "string" ? zoneByKey(zone) : zone;
  if (!z) return 0;
  return hand === "L" ? (360 - z.angle) % 360 : z.angle;
};

// Centre of a zone bubble inside a square of `size` px, at `radiusFrac` of half the size.
export function zonePoint(zone, hand, size, radiusFrac = 0.68) {
  const a = (zoneAngle(zone, hand) * Math.PI) / 180;
  const c = size / 2;
  const r = c * radiusFrac;
  return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
}

// "Pull towards mid-wicket (leg side)", "Cut", "Towards cover (off side)".
export function shotLabel(shot, zone) {
  const s = shotByKey(shot);
  const z = zoneByKey(zone);
  if (!s && !z) return "";
  const where = z ? `towards ${z.label.toLowerCase()} (${z.side} side)` : "";
  if (s && z) return `${s.label} ${where}`;
  if (s) return s.label;
  return where.charAt(0).toUpperCase() + where.slice(1);
}

// Totals per zone and per shot for a batter (or everyone) from scorecard deliveries.
// Only deliveries with some runs off the bat count towards the wheel.
export function wheelSummary(deliveries, batterId = null) {
  const zones = {};
  const shots = {};
  let tagged = 0;
  let runs = 0;
  let balls = 0;
  for (const d of deliveries || []) {
    if (batterId && d.batterId !== batterId) continue;
    if (!d.batRuns) continue;
    balls += 1;
    runs += d.batRuns;
    if (!d.zone && !d.shot) continue;
    tagged += 1;
    if (d.zone) {
      const z = (zones[d.zone] = zones[d.zone] || { runs: 0, balls: 0, fours: 0, sixes: 0 });
      z.runs += d.batRuns;
      z.balls += 1;
      if (d.batRuns === 4) z.fours += 1;
      if (d.batRuns === 6) z.sixes += 1;
    }
    if (d.shot) {
      const s = (shots[d.shot] = shots[d.shot] || { runs: 0, balls: 0 });
      s.runs += d.batRuns;
      s.balls += 1;
    }
  }
  return { zones, shots, tagged, scoringBalls: balls, runs };
}
