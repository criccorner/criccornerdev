import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { roleTag } from "../utils/squads";
import { useAuth } from "../auth/AuthContext";
import { playerMatchesUser } from "../auth/identity";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import { stageTag } from "../utils/stages";
import Card from "../components/Card";
import SponsorBanner from "../components/SponsorBanner";
import { buildScorecard, dismissalText } from "../utils/scorecard";
import WagonWheel from "../components/WagonWheel";
import { wheelSummary, shotByKey } from "../utils/shots";
import { AwardsCard, HighlightsCard, AvailabilityCard } from "../components/MatchExtras";

const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : "0.0");
const f2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

function Th({ children, flex = 1, left }) {
  return <Text style={[styles.th, { flex }, left && { textAlign: "left" }]}>{children}</Text>;
}
function Td({ children, flex = 1, bold }) {
  return <Text style={[styles.td, { flex }, bold && { fontWeight: "700" }]}>{children}</Text>;
}

// Where the runs came from. Only shown when the scorer recorded directions or shots.
function WheelCard({ sc, match, nameOf }) {
  const [who, setWho] = useState(null);
  const all = wheelSummary(sc.deliveries, null);
  if (!all.tagged) return null;
  const sum = wheelSummary(sc.deliveries, who);
  const hand = who && (match.batterHand || {})[who] === "L" ? "L" : "R";
  const batters = sc.batting.filter((r) => wheelSummary(sc.deliveries, r.id).tagged > 0);
  const shots = Object.entries(sum.shots).sort((a, b) => b[1].runs - a[1].runs);
  return (
    <Card>
      <Text style={typography.label}>WAGON WHEEL</Text>
      <View style={styles.wheelChips}>
        {[[null, "All"], ...batters.map((r) => [r.id, nameOf(r.id)])].map(([id, label]) => (
          <Pressable key={String(id)} onPress={() => setWho(id)} style={[styles.wheelChip, who === id && styles.tabActive]}>
            <Text style={[styles.tabText, who === id && { color: "#fff" }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <WagonWheel zones={sum.zones} hand={hand} />
      <Text style={[styles.sub, { textAlign: "center", marginTop: spacing.xs }]}>
        Runs off the bat by direction · {sum.tagged} of {sum.scoringBalls} scoring shots recorded
      </Text>
      {shots.length > 0 ? (
        <Text style={[typography.body, { marginTop: spacing.sm, lineHeight: 22 }]}>
          {shots.map(([k, v]) => `${(shotByKey(k) || { label: k }).label} ${v.runs} (${v.balls})`).join("   ")}
        </Text>
      ) : null}
    </Card>
  );
}

function InningsView({ innings, number, match, teams, players, onPlayer }) {
  const sc = buildScorecard(innings);
  if (!sc) return null;
  const nameOf = (id) => players.find((p) => p.id === id)?.name || "Unknown";
  const tagged = (id) => nameOf(id) + roleTag(match, id);
  // A name that opens that player's profile and stats.
  const link = (id, text, extra) => (
    <Text onPress={onPlayer ? () => onPlayer(id) : undefined} style={[styles.name, onPlayer && styles.nameLink, extra]}>
      {text}
    </Text>
  );
  const battingTeam = teams.find((t) => t.id === innings.battingTeamId);
  const live = match.status === "live" && match.currentInnings === number;

  const batted = new Set(sc.batting.map((r) => r.id));
  const yetToBat = players.filter((p) => battingTeam?.playerIds.includes(p.id) && !batted.has(p.id));

  return (
    <>
      <Card style={styles.summary}>
        <Text style={styles.summaryTeam}>{battingTeam?.name}</Text>
        <Text style={styles.summaryScore}>
          {sc.total}/{sc.wickets} <Text style={styles.summaryOvers}>({sc.overs} ov)</Text>
        </Text>
        <Text style={styles.summaryMeta}>
          Run rate {f2(sc.runRate)}
          {sc.requiredRate != null ? ` · Required ${f2(sc.requiredRate)}` : ""}
        </Text>
        {sc.needed != null ? (
          <Text style={styles.summaryMeta}>
            Target {innings.target} · {sc.needed} needed from {sc.ballsLeft} balls
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={typography.label}>BATTING</Text>
        <View style={styles.headRow}>
          <Th flex={3} left>Batter</Th>
          <Th>R</Th>
          <Th>B</Th>
          <Th>4s</Th>
          <Th>6s</Th>
          <Th flex={1.3}>SR</Th>
        </View>
        {sc.batting.map((r) => {
          const atCrease = live && !r.out && (r.id === sc.striker || r.id === sc.nonStriker);
          return (
            <View key={r.id} style={styles.row}>
              <View style={{ flex: 3 }}>
                {link(r.id, tagged(r.id) + (atCrease && r.id === sc.striker ? " *" : ""))}
                <Text style={styles.sub}>{dismissalText(r, nameOf, atCrease)}</Text>
              </View>
              <Td bold>{r.runs}</Td>
              <Td>{r.balls}</Td>
              <Td>{r.fours}</Td>
              <Td>{r.sixes}</Td>
              <Td flex={1.3}>{f1(r.strikeRate)}</Td>
            </View>
          );
        })}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.name, { flex: 3 }]}>
            Extras <Text style={styles.sub}>(wd {sc.extras.wide}, nb {sc.extras.noball}, b {sc.extras.bye}, lb {sc.extras.legbye})</Text>
          </Text>
          <Td bold>{sc.extrasTotal}</Td>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.name, { flex: 3, fontWeight: "800" }]}>Total</Text>
          <Text style={[styles.td, { flex: 4.3, textAlign: "right", fontWeight: "800" }]}>
            {sc.total}/{sc.wickets} ({sc.overs} ov)
          </Text>
        </View>
        {yetToBat.length > 0 ? (
          <Text style={[typography.muted, { marginTop: spacing.sm }]}>
            <Text style={{ fontWeight: "700" }}>Yet to bat: </Text>
            {yetToBat.map((p, i) => (
              <Text key={p.id} onPress={onPlayer ? () => onPlayer(p.id) : undefined} style={onPlayer ? styles.nameLink : undefined}>
                {i ? ", " : ""}
                {p.name}
              </Text>
            ))}
          </Text>
        ) : null}
      </Card>

      <WheelCard sc={sc} match={match} nameOf={nameOf} />

      {sc.fow.length > 0 ? (
        <Card>
          <Text style={typography.label}>FALL OF WICKETS</Text>
          <Text style={[typography.body, { marginTop: spacing.xs, lineHeight: 22 }]}>
            {sc.fow.map((w) => `${w.wicket}-${w.runs} (${nameOf(w.batsmanId)}, ${w.overs} ov)`).join("   ")}
          </Text>
        </Card>
      ) : null}

      {sc.strikeChanges.length > 0 ? (
        <Card>
          <Text style={typography.label}>STRIKE CHANGES (BY SCORER)</Text>
          {sc.strikeChanges.map((c, i) => (
            <View key={i} style={{ marginTop: spacing.xs }}>
              <Text style={typography.body}>
                {c.overs} ov: {nameOf(c.fromId)} → {nameOf(c.toId)} on strike
              </Text>
              {c.reason ? <Text style={styles.sub}>Reason: {c.reason}</Text> : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={typography.label}>BOWLING</Text>
        <View style={styles.headRow}>
          <Th flex={3} left>Bowler</Th>
          <Th>O</Th>
          <Th>M</Th>
          <Th>R</Th>
          <Th>W</Th>
          <Th flex={1.3}>Eco</Th>
        </View>
        {sc.bowling.map((b) => (
          <View key={b.id} style={styles.row}>
            <View style={{ flex: 3 }}>{link(b.id, tagged(b.id))}</View>
            <Td>{b.overs}</Td>
            <Td>{b.maidens}</Td>
            <Td>{b.runs}</Td>
            <Td bold>{b.wickets}</Td>
            <Td flex={1.3}>{f2(b.economy)}</Td>
          </View>
        ))}
      </Card>
    </>
  );
}

export default function ScorecardScreen({ route }) {
  const { matchId } = route.params;
  const { matches, teams, players, tournaments } = useAppState();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const access = useAccess();
  const { user } = useAuth();
  const [picked, setPicked] = useState(null);

  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);
  const tournament = tournaments.find((t) => t.id === match.tournamentId);
  const tossWinner = teams.find((t) => t.id === match.tossWinnerTeamId);

  const available = [match.innings1 ? 1 : null, match.innings2 ? 2 : null].filter(Boolean);
  const active = picked && available.includes(picked) ? picked : match.innings2 ? 2 : 1;
  const innings = active === 1 ? match.innings1 : match.innings2;

  const confirmDelete = () => {
    Alert.alert(
      "Delete this match?",
      "The match, its scorecard, all ball-by-ball data and the stats from it will be removed for everyone. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dispatch({ type: "DELETE_MATCH", payload: { matchId: match.id } });
            if (navigation.canGoBack()) navigation.goBack();
          },
        },
      ]
    );
  };

  const confirmNoResult = () => {
    Alert.alert("End as No result?", "Use this for rain or an abandoned game. It counts as a match played with no winner, and no awards are given.", [
      { text: "Cancel", style: "cancel" },
      { text: "End match", onPress: () => dispatch({ type: "UPDATE_MATCH", payload: { matchId: match.id, changes: { status: "completed", result: "No result" } } }) },
    ]);
  };

  const statusLabel = match.status === "live" ? "🔴 LIVE" : match.status === "completed" ? "✅ COMPLETED" : "🗓️ SCHEDULED";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SponsorBanner tournament={tournament} />
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Card style={{ alignItems: "center" }}>
          <Text style={styles.status}>{statusLabel}</Text>
          {stageTag(match) ? <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 12, marginBottom: 2 }}>{stageTag(match).toUpperCase()}</Text> : null}
          <Text style={[typography.h2, { textAlign: "center" }]}>
            {teamA?.name} vs {teamB?.name}
          </Text>
          <Text style={[typography.muted, { textAlign: "center", marginTop: 2 }]}>
            {match.overs} overs · {match.venue || "Venue TBD"} · {new Date(match.date).toDateString()}
          </Text>
          {tossWinner ? (
            <Text style={[typography.muted, { textAlign: "center", marginTop: 2 }]}>
              {tossWinner.name} won the toss and chose to {match.tossDecision === "bat" ? "bat" : "bowl"}
            </Text>
          ) : null}
          {match.result ? <Text style={styles.result}>{match.result}</Text> : null}
        </Card>

        {match.status === "scheduled" ? (
          <AvailabilityCard
            match={match}
            teams={teams}
            players={players}
            isMine={(p) => playerMatchesUser(p, user)}
            canSet={(p) => access.canEdit("players", p.id)}
            onSet={(p, status) => dispatch({ type: "SET_AVAILABILITY", payload: { playerId: p.id, matchId: match.id, status } })}
          />
        ) : null}

        {match.status === "completed" ? <AwardsCard match={match} teams={teams} players={players} onPlayer={(playerId) => navigation.navigate("PlayerStats", { playerId })} /> : null}

        {match.status !== "scheduled" ? (
          <HighlightsCard
            key={(match.highlights || []).length}
            match={match}
            teams={teams}
            sides={access.correctionSides(match)}
            onChange={(highlights) => dispatch({ type: "UPDATE_MATCH", payload: { matchId: match.id, changes: { highlights } } })}
          />
        ) : null}

        {!match.innings1 ? (
          <Card>
            <Text style={typography.h3}>Match hasn't started yet</Text>
            <Text style={[typography.muted, { marginTop: spacing.xs }]}>
              The full scorecard appears here as soon as scoring begins.
            </Text>
          </Card>
        ) : (
          <>
            {available.length > 1 ? (
              <View style={styles.tabs}>
                {available.map((n) => {
                  const inn = n === 1 ? match.innings1 : match.innings2;
                  const sc = buildScorecard(inn);
                  const team = teams.find((t) => t.id === inn.battingTeamId);
                  return (
                    <Pressable key={n} onPress={() => setPicked(n)} style={[styles.tab, active === n && styles.tabActive]}>
                      <Text style={[styles.tabText, active === n && { color: "#fff" }]} numberOfLines={1}>
                        {team?.name} {sc.total}/{sc.wickets}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <InningsView innings={innings} number={active} match={match} teams={teams} players={players} onPlayer={(playerId) => navigation.navigate("PlayerStats", { playerId })} />
          </>
        )}

        {match.status !== "completed" && access.canEdit("matches", match.id) ? (
          <Pressable onPress={() => navigation.navigate("EditMatch", { matchId: match.id })} style={styles.editBtn}>
            <Text style={styles.editText}>✏️ Edit match details</Text>
          </Pressable>
        ) : null}

        {match.innings1 && access.correctionSides(match).length ? (
          <Pressable onPress={() => navigation.navigate("Corrections", { matchId: match.id })} style={styles.editBtn}>
            <Text style={styles.editText}>🛠️ Captain corrections</Text>
          </Pressable>
        ) : null}

        {match.status === "live" && access.canEdit("matches", match.id) ? (
          <Pressable onPress={confirmNoResult} style={styles.editBtn}>
            <Text style={styles.editText}>🌧️ End match as "No result"</Text>
          </Pressable>
        ) : null}

        {access.canDeleteMatch(match) ? (
          <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete match</Text>
          </Pressable>
        ) : null}
        {access.canDeleteMatch(match) ? (
          <Text style={[typography.muted, { textAlign: "center", marginBottom: spacing.lg }]}>Only a team captain can delete a match.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  wheelChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm + 2 },
  editBtn: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.sm + 2, alignItems: "center" },
  editText: { color: colors.primary, fontWeight: "800" },
  deleteBtn: { marginTop: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: "#C62828", borderRadius: radius.pill, paddingVertical: spacing.sm + 2, alignItems: "center" },
  deleteText: { color: "#C62828", fontWeight: "800" },
  status: { fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: spacing.xs },
  result: { marginTop: spacing.sm, color: colors.success, fontWeight: "700", textAlign: "center" },
  tabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  summary: { alignItems: "center", backgroundColor: colors.primary },
  summaryTeam: { color: "#CFE3D8", fontWeight: "700" },
  summaryScore: { color: "#fff", fontSize: 36, fontWeight: "800" },
  summaryOvers: { fontSize: 15, fontWeight: "600" },
  summaryMeta: { color: "#fff", fontSize: 13, marginTop: 2 },
  headRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4, marginTop: spacing.sm },
  th: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  totalRow: { borderBottomWidth: 0 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  nameLink: { color: colors.primary, fontWeight: "700" },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  td: { fontSize: 13, color: colors.text, textAlign: "center" },
});
