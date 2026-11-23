import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../../components/Card";
import WagonWheel from "../../components/WagonWheel";
import StatTile, { StatGrid } from "../../components/StatTile";
import { colors, spacing, typography } from "../../utils/theme";

const pct = (n) => (n === null || n === undefined || !Number.isFinite(n) ? "–" : `${Math.round(n)}%`);
const dash = (n, d = 1) => (n === null || n === undefined || !Number.isFinite(n) ? "–" : n.toFixed(d));

function Section({ title, children }) {
  return (
    <Card>
      <Text style={typography.h3}>{title}</Text>
      {children}
    </Card>
  );
}

// Runs in each direction, so you can see where a batter scores and where he doesn't.
function WheelSection({ wheel }) {
  if (!wheel || !wheel.tagged) {
    return (
      <Section title="🎡 Wagon wheel">
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
          Appears once his shots are tagged with a direction while scoring (pick the shot area when you score runs).
        </Text>
      </Section>
    );
  }
  const rows = [...wheel.areas].sort((x, y) => y.runs - x.runs);
  return (
    <Section title="🎡 Wagon wheel">
      <WagonWheel zones={wheel.zones} hand={wheel.hand} />
      <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xs }]}>
        Runs off the bat by direction · {wheel.tagged} of {wheel.scoringBalls} scoring shots recorded · Off side {wheel.offRuns} · Leg side {wheel.legRuns}
      </Text>
      <View style={{ marginTop: spacing.md }}>
        <View style={styles.areaHead}>
          <Text style={[styles.areaName, typography.label]}>AREA</Text>
          <Text style={[styles.areaNum, typography.label]}>RUNS</Text>
          <Text style={[styles.areaNum, typography.label]}>SHOTS</Text>
          <Text style={[styles.areaNum, typography.label]}>4/6</Text>
          <Text style={[styles.areaNum, typography.label]}>SHARE</Text>
        </View>
        {rows.map((r) => (
          <View key={r.key} style={styles.areaRow}>
            <Text style={[styles.areaName, typography.body]}>{r.label} <Text style={typography.muted}>({r.side})</Text></Text>
            <Text style={[styles.areaNum, typography.body]}>{r.runs}</Text>
            <Text style={[styles.areaNum, typography.body]}>{r.balls}</Text>
            <Text style={[styles.areaNum, typography.body]}>{r.fours}/{r.sixes}</Text>
            <Text style={[styles.areaNum, typography.body]}>{pct(r.share)}</Text>
          </View>
        ))}
      </View>
      {wheel.reliable ? (
        <View style={{ marginTop: spacing.md }}>
          {wheel.strengths.length ? (
            <Text style={[typography.body, { color: colors.success, fontWeight: "700" }]}>💪 Strong areas: {wheel.strengths.map((r) => `${r.label} (${r.runs} runs)`).join(", ")}</Text>
          ) : null}
          {wheel.weaknesses.length ? (
            <Text style={[typography.body, { color: colors.danger, fontWeight: "700", marginTop: 4 }]}>⚠️ Scores little towards: {wheel.weaknesses.map((r) => `${r.label} (${r.runs})`).join(", ")}</Text>
          ) : null}
        </View>
      ) : (
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Strengths and weaknesses show once about 15 shots are recorded.</Text>
      )}
    </Section>
  );
}

export default function StatsView({ stats }) {
  if (!stats.hasData) {
    return (
      <Card>
        <Text style={typography.h3}>No stats yet</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
          Your stats appear here once you've played in a match scored in this app. Make sure you're in a team's roster, then score a match.
        </Text>
      </Card>
    );
  }
  const b = stats.batting, w = stats.bowling, f = stats.fielding, k = stats.keeping, c = stats.captaincy;
  const hs = b.highest ? `${b.highest.runs}${b.highest.notOut ? "*" : ""}` : "–";
  const best = w.best ? `${w.best.wickets}/${w.best.runs}` : "–";

  return (
    <>
      <Card style={styles.hero}>
        <Text style={styles.heroValue}>{stats.matches}</Text>
        <Text style={styles.heroLabel}>{stats.matches === 1 ? "MATCH PLAYED" : "MATCHES PLAYED"}</Text>
      </Card>

      <Section title="🏏 Batting">
        <StatGrid>
          <StatTile label="Matches" value={b.matches} />
          <StatTile label="Innings" value={b.innings} />
          <StatTile label="Not outs" value={b.notOuts} />
          <StatTile label="Runs" value={b.runs} />
          <StatTile label="Highest" value={hs} />
          <StatTile label="Average" value={dash(b.average)} />
          <StatTile label="Strike rate" value={dash(b.strikeRate)} />
          <StatTile label="Fours" value={b.fours} />
          <StatTile label="Sixes" value={b.sixes} />
          <StatTile label="Ducks" value={b.ducks} />
          <StatTile label="Won" value={b.won} />
          <StatTile label="Lost" value={b.lost} />
          <StatTile label="50s / 100s" value={`${b.fifties} / ${b.hundreds}`} />
        </StatGrid>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Balls faced {b.balls} · Won / Lost = matches his team won or lost when he batted</Text>
      </Section>

      <WheelSection wheel={stats.wheel} />

      <Section title="🎯 Bowling">
        <StatGrid>
          <StatTile label="Matches" value={w.matches} />
          <StatTile label="Innings" value={w.innings} />
          <StatTile label="Best" value={best} />
          <StatTile label="Wickets" value={w.wickets} />
          <StatTile label="3 wickets" value={w.threeW} />
          <StatTile label="5 wickets" value={w.fiveW} />
          <StatTile label="Wides" value={w.wides} />
          <StatTile label="No-balls" value={w.noBalls} />
          <StatTile label="Dot balls" value={w.dots} />
          <StatTile label="Fours given" value={w.fours} />
          <StatTile label="Sixes given" value={w.sixes} />
          <StatTile label="Overs" value={w.overs} />
          <StatTile label="Economy" value={dash(w.economy, 2)} />
          <StatTile label="Average" value={dash(w.average)} />
          <StatTile label="Strike rate" value={dash(w.strikeRate)} />
        </StatGrid>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Runs conceded {w.runs} · Maidens {w.maidens} · 3 wickets = 3 or 4 in an innings</Text>
      </Section>

      <Section title="🧤 Fielding">
        <StatGrid>
          <StatTile label="Catches" value={f.catches} />
          <StatTile label="Run-outs" value={f.runOuts} />
          <StatTile label="Assist run-outs" value={f.runOutAssists} />
          <StatTile label="Stumpings" value={f.stumpings} />
          <StatTile label="Caught & bowled" value={f.caughtAndBowled} />
        </StatGrid>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Run-outs = he broke the stumps; assist = he fielded and passed it on. Catches and run-outs while keeping wicket are under Wicketkeeping.</Text>
      </Section>

      <Section title="🧢 Captaincy">
        {c.matches ? (
          <StatGrid>
            <StatTile label="Matches" value={c.matches} />
            <StatTile label="Won" value={c.won} />
            <StatTile label="Lost" value={c.lost} />
            <StatTile label="Win %" value={pct(c.winPct)} />
            <StatTile label="Toss won %" value={pct(c.tossPct)} />
            {c.tied ? <StatTile label="Tied / no result" value={c.tied} /> : null}
          </StatGrid>
        ) : (
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>Not captained a completed match yet. Pick him as captain when setting the squad.</Text>
        )}
      </Section>

      <Section title="🥅 Wicketkeeping">
        <StatGrid>
          <StatTile label="Innings kept" value={k.innings} />
          <StatTile label="Catches" value={k.catches} />
          <StatTile label="Stumpings" value={k.stumpings} />
          <StatTile label="Run-outs" value={k.runOuts} />
          <StatTile label="Dismissals" value={k.total} />
          <StatTile label="Byes conceded" value={k.byes} />
        </StatGrid>
        {k.innings === 0 && k.stumpings === 0 ? (
          <Text style={[typography.muted, { marginTop: spacing.sm }]}>Set the wicketkeeper on the Live Scoring screen to build these stats.</Text>
        ) : null}
      </Section>

      <Section title="📈 Recent form">
        {stats.form.batting.length === 0 && stats.form.bowling.length === 0 ? (
          <Text style={typography.muted}>No innings yet.</Text>
        ) : null}
        {stats.form.batting.length > 0 ? <Text style={[typography.label, { marginTop: spacing.sm }]}>BATTING (LATEST FIRST)</Text> : null}
        {stats.form.batting.map((i, idx) => (
          <View key={`b${idx}`} style={styles.formRow}>
            <Text style={typography.body}>{i.runs}{i.out ? "" : "*"} <Text style={typography.muted}>({i.balls})</Text></Text>
            <Text style={typography.muted}>vs {i.opponent} · {i.date}</Text>
          </View>
        ))}
        {stats.form.bowling.length > 0 ? <Text style={[typography.label, { marginTop: spacing.md }]}>BOWLING (LATEST FIRST)</Text> : null}
        {stats.form.bowling.map((i, idx) => (
          <View key={`w${idx}`} style={styles.formRow}>
            <Text style={typography.body}>{i.wickets}/{i.runs} <Text style={typography.muted}>({Math.floor(i.balls / 6)}.{i.balls % 6})</Text></Text>
            <Text style={typography.muted}>vs {i.opponent} · {i.date}</Text>
          </View>
        ))}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", backgroundColor: colors.primary },
  heroValue: { fontSize: 40, fontWeight: "800", color: "#fff" },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "#CFE3D8", letterSpacing: 1 },
  areaHead: { flexDirection: "row", paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  areaRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  areaName: { flex: 2.2 },
  areaNum: { flex: 1, textAlign: "right" },
  formRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
});
