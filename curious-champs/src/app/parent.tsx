import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackIcon } from "../components/Icons";
import { IconButton, KidButton } from "../components/ui";
import { OFFLINE_PACK_NAMES } from "../lib/offlinePack";
import { useProfile } from "../state/ProfileContext";
import { ageThemes, fonts, parentTheme as t } from "../theme/ageThemes";

function timeAgo(ms: number): string {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default function ParentZone() {
  const { profile, settings, history, updateSettings, clearHistory, resetAll } = useProfile();
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = history.filter((h) => h.askedAt > weekAgo).length;
  const flagged = history.filter((h) => h.flagged);

  function confirmReset() {
    Alert.alert("Reset the app?", "This removes the child profile, history and settings from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetAll();
          router.replace("/setup");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.rowBetween}>
          <IconButton accessibilityLabel="Back to child view" background={t.surface} onPress={() => router.replace("/home")}>
            <BackIcon />
          </IconButton>
          <Text style={styles.small}>Grown-ups only</Text>
        </View>
        <Text style={styles.h1}>Parent zone</Text>

        {profile && (
          <View style={[styles.card, styles.row]}>
            <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.strong}>{profile.nickname}</Text>
              <Text style={styles.muted}>
                {ageThemes[profile.ageBand].clubName} · ages {profile.ageBand.replace("-", "–")} · {thisWeek} question{thisWeek === 1 ? "" : "s"} this week
              </Text>
            </View>
            <KidButton label="Edit" onPress={() => router.push("/setup")} background={t.surface} bordered={t.border} color={t.text} font={fonts.bodyBold} fontSize={13} height={44} radius={12} />
          </View>
        )}

        {flagged.length > 0 && (
          <View style={[styles.card, { backgroundColor: t.warnBg }]}>
            <Text style={styles.strong}>Worth talking about together</Text>
            <Text style={styles.muted}>
              These questions touched on a sensitive topic. Champ gave a gentle answer and encouraged your child to talk with you.
            </Text>
            {flagged.slice(0, 5).map((h) => (
              <View key={h.id} style={styles.rowBetween}>
                <Text style={[styles.item, { flex: 1 }]}>{h.question}</Text>
                <Text style={styles.warnTag}>Sensitive</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.strong}>Recent questions</Text>
            {history.length > 0 && (
              <KidButton label="Clear" onPress={clearHistory} background={t.surface} bordered={t.border} color={t.text} font={fonts.bodyBold} fontSize={13} height={40} radius={12} />
            )}
          </View>
          {history.length === 0 ? (
            <Text style={styles.muted}>No questions yet.</Text>
          ) : (
            history.slice(0, 20).map((h) => (
              <View key={h.id} style={styles.rowBetween}>
                <Text style={[styles.item, { flex: 1 }]}>{h.question}</Text>
                <Text style={styles.tag}>
                  {h.mediaTopic} · {timeAgo(h.askedAt)}
                  {h.source === "offline" ? " · offline" : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.strong}>Controls</Text>
          <SettingRow label="Read answers aloud" value={settings.readAloud} onChange={(v) => updateSettings({ readAloud: v })} />
          <SettingRow label="Approved videos" value={settings.videos} onChange={(v) => updateSettings({ videos: v })} />
        </View>

        <View style={styles.card}>
          <Text style={styles.strong}>Offline topic packs</Text>
          <Text style={styles.muted}>Built into the app, so these work without internet: {OFFLINE_PACK_NAMES.join(", ")}.</Text>
        </View>

        <KidButton label="Reset app on this device" onPress={confirmReset} background={t.surface} bordered="#FCA5A5" color="#B91C1C" font={fonts.bodyBold} fontSize={14} height={48} radius={14} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.rowBetween, { minHeight: 44 }]}>
      <Text style={styles.item}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: t.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 14, paddingBottom: 40 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  h1: { fontFamily: fonts.roundSemi, fontSize: 28, color: t.text },
  small: { fontFamily: fonts.bodyBold, fontSize: 12, color: t.mutedText },
  card: { backgroundColor: t.surface, borderRadius: 20, padding: 16, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  strong: { fontFamily: fonts.bodyBold, fontSize: 15, color: t.text },
  muted: { fontFamily: fonts.body, fontSize: 13, color: t.mutedText },
  item: { fontFamily: fonts.body, fontSize: 14, color: t.text },
  tag: { fontFamily: fonts.body, fontSize: 11, color: t.mutedText },
  warnTag: { fontFamily: fonts.bodyBold, fontSize: 12, color: t.warnText, backgroundColor: t.warnTag, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
});
