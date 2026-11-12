import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "../utils/theme";
import { isoDay, isValidDate, monthGrid, parseTime, formatTime } from "../utils/datetime";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Type the date (YYYY-MM-DD) or tap 📅 and pick it from a calendar.
export function DateField({ label = "Date", value, onChange }) {
  const [open, setOpen] = useState(false);
  const start = isValidDate(value) ? new Date(value + "T00:00:00") : new Date();
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const todayStr = isoDay(new Date());
  const show = () => {
    const d = isValidDate(value) ? new Date(value + "T00:00:00") : new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setOpen(true);
  };
  const move = (dm) => {
    const d = new Date(view.y, view.m + dm, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };
  const pick = (day) => {
    onChange(`${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    setOpen(false);
  };
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.label}>{label.toUpperCase()}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
        <Pressable onPress={show} style={styles.iconBtn} accessibilityLabel={`Pick ${label} from a calendar`}>
          <Text style={{ fontSize: 22 }}>📅</Text>
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.head}>
              <Pressable onPress={() => move(-12)} hitSlop={8}><Text style={styles.nav}>«</Text></Pressable>
              <Pressable onPress={() => move(-1)} hitSlop={8}><Text style={styles.nav}>‹</Text></Pressable>
              <Text style={styles.title}>{MONTHS[view.m]} {view.y}</Text>
              <Pressable onPress={() => move(1)} hitSlop={8}><Text style={styles.nav}>›</Text></Pressable>
              <Pressable onPress={() => move(12)} hitSlop={8}><Text style={styles.nav}>»</Text></Pressable>
            </View>
            <View style={styles.week}>{DAYS.map((d) => <Text key={d} style={styles.dow}>{d}</Text>)}</View>
            {monthGrid(view.y, view.m).map((row, i) => (
              <View key={i} style={styles.week}>
                {row.map((day, j) => {
                  const iso = day ? `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
                  const on = iso && iso === value;
                  return day ? (
                    <Pressable key={j} onPress={() => pick(day)} style={[styles.day, on && styles.dayOn, !on && iso === todayStr && styles.dayToday]}>
                      <Text style={[styles.dayText, on && { color: "#fff", fontWeight: "800" }]}>{day}</Text>
                    </Pressable>
                  ) : (
                    <View key={j} style={styles.day} />
                  );
                })}
              </View>
            ))}
            <View style={styles.foot}>
              <Pressable onPress={() => { onChange(todayStr); setOpen(false); }}><Text style={styles.link}>Today</Text></Pressable>
              <Pressable onPress={() => setOpen(false)}><Text style={[styles.link, { color: colors.textMuted }]}>Close</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// Type the time ("7:30 pm" or "19:30") or tap 🕒 to choose it. Optional.
export function TimeField({ label = "Time (optional)", value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = parseTime(value) || "";
  const [h, setH] = useState(7);
  const [mi, setMi] = useState("00");
  const [ap, setAp] = useState("PM");
  const show = () => {
    if (cur) {
      const hh = +cur.slice(0, 2);
      setH(hh % 12 === 0 ? 12 : hh % 12);
      setMi(MINUTES.includes(cur.slice(3)) ? cur.slice(3) : "00");
      setAp(hh < 12 ? "AM" : "PM");
    }
    setOpen(true);
  };
  const set = () => {
    const hh24 = (h % 12) + (ap === "PM" ? 12 : 0);
    onChange(formatTime(`${String(hh24).padStart(2, "0")}:${mi}`));
    setOpen(false);
  };
  const bad = value && parseTime(value) === null;
  const Chip = ({ on, text, onPress }) => (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && { color: "#fff" }]}>{text}</Text>
    </Pressable>
  );
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.label}>{label.toUpperCase()}</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, bad && { borderColor: colors.danger }]} value={value} onChangeText={onChange} placeholder="e.g. 7:30 PM" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
        <Pressable onPress={show} style={styles.iconBtn} accessibilityLabel="Pick the time">
          <Text style={{ fontSize: 22 }}>🕒</Text>
        </Pressable>
      </View>
      {bad ? <Text style={{ color: colors.danger, marginTop: 4 }}>Enter a time like 7:30 PM or 19:30.</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Match time</Text>
            <Text style={typography.label}>HOUR</Text>
            <View style={styles.chips}>{HOURS.map((x) => <Chip key={x} on={h === x} text={String(x)} onPress={() => setH(x)} />)}</View>
            <Text style={typography.label}>MINUTES</Text>
            <View style={styles.chips}>{MINUTES.map((x) => <Chip key={x} on={mi === x} text={x} onPress={() => setMi(x)} />)}</View>
            <View style={styles.chips}>{["AM", "PM"].map((x) => <Chip key={x} on={ap === x} text={x} onPress={() => setAp(x)} />)}</View>
            <View style={styles.foot}>
              <Pressable onPress={set}><Text style={styles.link}>Set time</Text></Pressable>
              <Pressable onPress={() => { onChange(""); setOpen(false); }}><Text style={[styles.link, { color: colors.textMuted }]}>No time</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.surface },
  iconBtn: { marginLeft: spacing.sm, padding: spacing.sm },
  backdrop: { flex: 1, backgroundColor: "#0008", justifyContent: "center", padding: spacing.lg },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  nav: { fontSize: 24, fontWeight: "800", color: colors.primary, paddingHorizontal: spacing.sm },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.text },
  week: { flexDirection: "row" },
  dow: { flex: 1, textAlign: "center", color: colors.textMuted, fontWeight: "700", paddingVertical: 4 },
  day: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999, margin: 1 },
  dayOn: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  dayText: { color: colors.text },
  foot: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  link: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginVertical: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "700" },
});
