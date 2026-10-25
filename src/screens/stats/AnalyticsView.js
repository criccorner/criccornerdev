import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../../components/Card";
import StatTile, { StatGrid } from "../../components/StatTile";
import BarChart from "../../components/BarChart";
import { colors, spacing, typography, radius } from "../../utils/theme";

const f0 = (n) => (Number.isFinite(n) ? Math.round(n).toString() : "–");
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : "–");
const f2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : "–");

function Section({ title, subtitle, children }) {
  return (
    <Card>
      <Text style={typography.h3}>{title}</Text>
      {subtitle ? <Text style={[typography.muted, { marginTop: 2 }]}>{subtitle}</Text> : null}
      {children}
    </Card>
  );
}

function InsightList({ items, tone }) {
  if (items.length === 0) return <Text style={[typography.muted, { marginTop: spacing.sm }]}>Nothing stands out yet. This fills in as you play more.</Text>;
  return items.map((it, i) => (
    <View key={i} style={[styles.insight, { borderLeftColor: tone }]}>
      <Text style={styles.insightTitle}>
        {it.title} <Text style={styles.insightArea}>· {it.area}</Text>
      </Text>
      <Text style={typography.muted}>{it.detail}</Text>
    </View>
  ));
}

function Table({ head, rows }) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      <View style={styles.tr}>
        {head.map((h, i) => (
          <Text key={i} style={[styles.th, i === 0 && { flex: 2, textAlign: "left" }]}>{h}</Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={styles.tr}>
          {r.map((c, i) => (
            <Text key={i} style={[styles.td, i === 0 && { flex: 2, textAlign: "left", fontWeight: "600" }]}>{c}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsView({ stats }) {
  const { batting: b, bowling: w, insights } = stats.analytics;
  const hasBat = b.inningsCount > 0 && b.balls > 0;
  const hasBowl = w.inningsCount > 0 && w.balls > 0;

  if (!stats.hasData || (!hasBat && !hasBowl)) {
    return (
      <Card>
        <Text style={typography.h3}>No analytics yet</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
          Analytics appear after you've batted or bowled in a scored match. They get more reliable after about 5 innings.
        </Text>
      </Card>
    );
  }

  return (
    <>
      {insights.note ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>ℹ️ {insights.note}</Text>
        </View>
      ) : null}

      <Section title="💪 Strengths" subtitle="Based on your batting, bowling and fielding numbers.">
        <InsightList items={insights.strengths} tone={colors.success} />
      </Section>

      <Section title="🔧 Areas to improve">
        <InsightList items={insights.weaknesses} tone={colors.accent} />
      </Section>

      <Section title="⭐ Strong areas" subtitle="The situations where you perform best.">
        {insights.strongAreas.length === 0 ? (
          <Text style={[typography.muted, { marginTop: spacing.sm }]}>Needs more balls in each phase of the innings.</Text>
        ) : (
          <View style={styles.chips}>
            {insights.strongAreas.map((a, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipTitle}>{a.label}</Text>
                <Text style={styles.chipSub}>{a.area}: {a.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      {hasBat ? (
        <>
          <Section title="🏏 Batting analytics">
            <StatGrid>
              <StatTile label="Strike rate" value={f0(b.strikeRate)} />
              <StatTile label="Dot balls" value={`${f0(b.dotPct)}%`} />
              <StatTile label="Boundary balls" value={`${f0(b.boundaryPct)}%`} />
              <StatTile label="Balls / boundary" value={b.ballsPerBoundary ? f1(b.ballsPerBoundary) : "–"} />
              <StatTile label="Rotates strike" value={`${f0(b.rotationPct)}%`} sub="1s, 2s & 3s" />
              <StatTile label="20+ scores" value={`${b.twentyPlus}/${b.inningsCount}`} />
            </StatGrid>
            <Text style={[typography.label, { marginTop: spacing.md }]}>WHERE YOUR RUNS COME FROM (BALLS FACED)</Text>
            <BarChart data={b.distribution} />
          </Section>

          <Section title="Batting by phase" subtitle="Strike rate in each part of the innings.">
            <BarChart data={b.phases.map((p) => ({ label: p.label.replace(" overs", ""), value: p.strikeRate }))} format={f0} color={colors.info} />
            <Table head={["Phase", "Balls", "Runs", "SR", "Dot%", "Outs"]} rows={b.phases.map((p) => [p.label, p.balls, p.runs, f0(p.strikeRate), `${f0(p.dotPct)}%`, p.outs])} />
          </Section>

          <Section title="Starting vs set" subtitle="How you score early compared with once you're settled.">
            <Table
              head={["", "Balls", "Strike rate"]}
              rows={[
                ["First 10 balls", b.start.startBalls, f0(b.start.startStrikeRate)],
                ["After 10 balls", b.start.laterBalls, f0(b.start.laterStrikeRate)],
              ]}
            />
          </Section>

          <Section title="Batting situations">
            <Table head={["Situation", "Inns", "Runs", "Avg", "SR"]} rows={b.byInningsType.map((r) => [r.label, r.innings, r.runs, r.average === null ? "–" : f1(r.average), r.innings ? f0(r.strikeRate) : "–"])} />
            <Table head={["Position", "Inns", "Runs", "Avg", "SR"]} rows={b.byPosition.map((r) => [r.label, r.innings, r.runs, r.average === null ? "–" : f1(r.average), r.innings ? f0(r.strikeRate) : "–"])} />
          </Section>

          {b.dismissals.length > 0 ? (
            <Section title="How you get out">
              {b.dismissals.map((d, i) => (
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { flex: 3, textAlign: "left" }]}>{d.label}</Text>
                  <Text style={styles.td}>{d.value}</Text>
                </View>
              ))}
            </Section>
          ) : null}
        </>
      ) : null}

      {hasBowl ? (
        <>
          <Section title="🎯 Bowling analytics">
            <StatGrid>
              <StatTile label="Economy" value={f2(w.economy)} />
              <StatTile label="Dot balls" value={`${f0(w.dotPct)}%`} />
              <StatTile label="Boundaries hit" value={`${f0(w.boundaryPct)}%`} sub="of balls bowled" />
              <StatTile label="Wd+Nb / over" value={f1(w.extrasPerOver)} />
              <StatTile label="Wkts / innings" value={f1(w.wicketsPerInnings)} />
              <StatTile label="Wickets" value={w.wickets} />
            </StatGrid>
            <Text style={[typography.label, { marginTop: spacing.md }]}>ECONOMY BY PHASE</Text>
            <BarChart data={w.phases.map((p) => ({ label: p.label.replace(" overs", ""), value: p.economy }))} format={f1} color={colors.info} />
            <Table head={["Phase", "Balls", "Runs", "Wkts", "Eco", "Dot%"]} rows={w.phases.map((p) => [p.label, p.balls, p.runs, p.wickets, p.balls ? f1(p.economy) : "–", `${f0(p.dotPct)}%`])} />
          </Section>

          <Section title="Bowling situations">
            <Table head={["Situation", "Inns", "Wkts", "Eco"]} rows={w.byInningsType.map((r) => [r.label, r.innings, r.wickets, r.innings ? f1(r.economy) : "–"])} />
            {w.wicketTypes.length > 0 ? (
              <>
                <Text style={[typography.label, { marginTop: spacing.md }]}>HOW YOUR WICKETS COME</Text>
                {w.wicketTypes.map((d, i) => (
                  <View key={i} style={styles.tr}>
                    <Text style={[styles.td, { flex: 3, textAlign: "left" }]}>{d.label}</Text>
                    <Text style={styles.td}>{d.value}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </Section>
        </>
      ) : null}

      <Text style={styles.footnote}>
        These insights come from simple rules applied to your own numbers, compared with your own overall average. Shot direction (off side / leg side) isn't recorded yet, so scoring-area analysis isn't included.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  note: { backgroundColor: "#FFF6DB", borderColor: colors.accent, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  noteText: { color: colors.text, fontSize: 13 },
  insight: { borderLeftWidth: 4, paddingLeft: spacing.sm, marginTop: spacing.sm, paddingVertical: 2 },
  insightTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  insightArea: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipTitle: { color: colors.primary, fontWeight: "800" },
  chipSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  tr: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", textAlign: "center" },
  td: { flex: 1, fontSize: 13, color: colors.text, textAlign: "center" },
  footnote: { fontSize: 11, color: colors.textMuted, textAlign: "center", marginVertical: spacing.md, paddingHorizontal: spacing.md },
});
