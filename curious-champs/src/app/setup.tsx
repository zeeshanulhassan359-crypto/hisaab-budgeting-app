import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KidButton } from "../components/ui";
import { AGE_BANDS, type AgeBand } from "../lib/types";
import { useProfile } from "../state/ProfileContext";
import { ageThemes, fonts, parentTheme as t } from "../theme/ageThemes";

const AVATARS = [
  { color: "#FF9F43", label: "Orange owl" },
  { color: "#5EC8B8", label: "Teal fish" },
  { color: "#A78BFA", label: "Purple star" },
  { color: "#FCD34D", label: "Yellow sun" },
];

/** Parent-facing setup. Collects no real name, photo, email or birthday. */
export default function Setup() {
  const { profile, settings, saveProfile, updateSettings } = useProfile();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor ?? AVATARS[0].color);
  const [ageBand, setAgeBand] = useState<AgeBand>(profile?.ageBand ?? "6-8");
  const [readAloud, setReadAloud] = useState(settings.readAloud);
  const [videos, setVideos] = useState(settings.videos);
  const [consent, setConsent] = useState(!!profile);

  const canStart = nickname.trim().length > 0 && consent;

  function start() {
    saveProfile({ nickname: nickname.trim().slice(0, 24), avatarColor, ageBand });
    updateSettings({ readAloud, videos });
    router.replace("/home");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EAF4FF" }}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.rowBetween}>
          <Text style={styles.brand}>Curious Champs</Text>
          <Text style={styles.pill}>Parent setup</Text>
        </View>
        <Text style={styles.h1}>{profile ? "Edit your champ" : "Add your little champ"}</Text>
        <Text style={styles.muted}>Answers, pictures and videos are matched to your child's age.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Pick an avatar</Text>
          <View style={styles.row}>
            {AVATARS.map((a) => (
              <Pressable
                key={a.color}
                accessibilityRole="radio"
                accessibilityLabel={a.label}
                accessibilityState={{ selected: avatarColor === a.color }}
                onPress={() => setAvatarColor(a.color)}
                style={[styles.avatar, { backgroundColor: a.color, borderColor: avatarColor === a.color ? t.text : "transparent" }]}
              />
            ))}
          </View>

          <Text style={styles.label} nativeID="nicknameLabel">
            Nickname
          </Text>
          <TextInput
            accessibilityLabelledBy="nicknameLabel"
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. Sky Explorer"
            placeholderTextColor="#7A869E"
            maxLength={24}
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.hint}>No real names or photos needed.</Text>

          <Text style={styles.label}>Age group</Text>
          <View style={styles.row}>
            {AGE_BANDS.map((band) => (
              <Pressable
                key={band}
                accessibilityRole="radio"
                accessibilityLabel={`Ages ${band}, ${ageThemes[band].clubName}`}
                accessibilityState={{ selected: ageBand === band }}
                onPress={() => setAgeBand(band)}
                style={[styles.age, ageBand === band && styles.ageSelected]}
              >
                <Text style={styles.ageText}>{band.replace("-", "–")}</Text>
                <Text style={styles.ageClub}>{ageThemes[band].clubName}</Text>
              </Pressable>
            ))}
          </View>

          <Toggle label="Read answers aloud" value={readAloud} onChange={setReadAloud} />
          <Toggle label="Show approved videos" value={videos} onChange={setVideos} />
        </View>

        <Toggle
          label="I am this child's parent or guardian, and I agree to the privacy policy."
          value={consent}
          onChange={setConsent}
        />
        <Text style={styles.hint}>
          Questions are sent to our safety server to be answered. Nicknames, history and settings stay on this device.
        </Text>

        <KidButton
          label="Start exploring"
          onPress={start}
          disabled={!canStart}
          background={t.primary}
          color={t.onPrimary}
          font={fonts.roundSemi}
          fontSize={20}
          height={60}
          radius={20}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleText}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: t.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, gap: 14 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: fonts.roundBold, fontSize: 20, color: t.text },
  pill: { fontFamily: fonts.bodyBold, fontSize: 13, color: t.accent, backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: "hidden" },
  h1: { fontFamily: fonts.roundSemi, fontSize: 30, color: t.text },
  muted: { fontFamily: fonts.body, fontSize: 15, color: t.mutedText },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, gap: 10 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: t.text, marginTop: 6 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: t.mutedText },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 3 },
  input: { height: 48, borderRadius: 14, borderWidth: 2, borderColor: t.border, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 16, color: t.text },
  age: { flex: 1, minHeight: 64, borderRadius: 14, borderWidth: 2, borderColor: t.border, alignItems: "center", justifyContent: "center" },
  ageSelected: { backgroundColor: "#FF9F43", borderColor: t.text },
  ageText: { fontFamily: fonts.roundSemi, fontSize: 18, color: t.text },
  ageClub: { fontFamily: fonts.body, fontSize: 11, color: t.text },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 },
  toggleText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: t.text },
});
