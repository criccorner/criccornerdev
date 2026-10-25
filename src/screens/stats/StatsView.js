import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../../components/Card";
import StatTile, { StatGrid } from "../../components/StatTile";
import { colors, spacing, typography } from "../../utils/theme";

const dash = (n, d = 1) => (n === null || n === undefined || !Number.isFinite(n) ? "–" : n.toFixed(d));

function Section({ title, children }) {
  return (
    <Card>
      <Text style={typography.h3}>{title}</Text>
      {children}
    </Card>
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
  const b = stats.batting, w = stats.bowling, f = stats.fielding, k = stats.keeping;
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
          <StatTile label="Innings" value={b.innings} />
          <StatTile label="Runs" value={b.runs} />
          <StatTile label="High score" value={hs} />
          <StatTile label="Average" value={dash(b.average)} />
          <StatTile label="Strike rate" value={dash(b.strikeRate)} />
          <StatTile label="Not outs" value={b.notOuts} />
          <StatTile label="50s / 100s" value={`${b.fifties} / ${b.hundreds}`} />
          <StatTile label="Fours" value={b.fours} />
          <StatTile label="Sixes" value={b.sixes} />
        </StatGrid>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Balls faced {b.balls} · Ducks {b.ducks}</Text>
      </Section>

      <Section title="🎯 Bowling">
        <StatGrid>
          <StatTile label="Innings" value={w.innings} />
          <StatTile label="Overs" value={w.overs} />
          <StatTile label="Wickets" value={w.wickets} />
          <StatTile label="Best" value={best} />
          <StatTile label="Economy" value={dash(w.economy, 2)} />
          <StatTile label="Average" value={dash(w.average)} />
          <StatTile label="Strike rate" value={dash(w.strikeRate)} />
          <StatTile label="Maidens" value={w.maidens} />
          <StatTile label="3W / 5W" value={`${w.threeW} / ${w.fiveW}`} />
        </StatGrid>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Runs conceded {w.runs} · Wides {w.wides} · No-balls {w.noBalls}</Text>
      </Section>

      <Section title="🧤 Fielding">
        <StatGrid>
          <StatTile label="Catches" value={f.catches} />
          <StatTile label="Run-outs" value={f.runOuts} />
          <StatTile label="Caught & bowled" value={f.caughtAndBowled} />
        </StatGrid>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>Total fielding dismissals {f.total}. Catches and run-outs while keeping wicket are counted under Wicketkeeping.</Text>
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
  formRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
});
