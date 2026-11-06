import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Owl, Star } from "../components/Art";
import { LockIcon, MicIcon, SendIcon, SpeakerIcon, TopicIcon, type TopicKey } from "../components/Icons";
import { IconButton, KidButton, KidScreen, useAgeTheme } from "../components/ui";
import { readAloud } from "../lib/speech";
import { useProfile } from "../state/ProfileContext";
import { topicColors } from "../theme/ageThemes";

const TOPICS: { key: TopicKey; label: string; question: string }[] = [
  { key: "animals", label: "Animals", question: "Why do cats purr?" },
  { key: "space", label: "Space", question: "Why do stars twinkle?" },
  { key: "weather", label: "Weather", question: "Where does rain come from?" },
  { key: "body", label: "My body", question: "Why do we need to sleep?" },
];

const MYSTERY = "How do rainbows happen?";

function ask(question: string) {
  const q = question.trim();
  if (q) router.push({ pathname: "/answer", params: { q } });
}

export default function Home() {
  const theme = useAgeTheme();
  const { profile, rewards } = useProfile();
  const [typed, setTyped] = useState("");
  const tiny = theme.band === "3-5";
  const explorer = theme.band === "9-12";

  const greeting = `Hi, ${profile?.nickname ?? "Champ"}!`;
  const prompt = explorer ? "What do you want to figure out?" : "What are you curious about today?";

  return (
    <KidScreen theme={theme}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: profile?.avatarColor ?? "#FF9F43", width: tiny ? 60 : 48, height: tiny ? 60 : 48 }]} />
              {!tiny && (
                <View>
                  <Text style={[styles.club, { color: theme.mutedText, fontFamily: theme.bodyBoldFont }]}>
                    {theme.clubName} · ages {theme.band.replace("-", "–")}
                  </Text>
                  <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: 20 }}>{greeting}</Text>
                </View>
              )}
            </View>
            <View style={styles.row}>
              <View
                accessible
                accessibilityLabel={`${rewards} ${theme.rewardName}${rewards === 1 ? "" : "s"}`}
                style={[styles.reward, { backgroundColor: theme.surface }]}
              >
                {explorer ? (
                  <Text style={{ color: theme.primary, fontFamily: theme.headingFont, fontSize: 15 }}>{rewards * 15} XP</Text>
                ) : (
                  <>
                    <Star size={tiny ? 28 : 22} />
                    <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: tiny ? 22 : 17 }}>{rewards}</Text>
                  </>
                )}
              </View>
              <IconButton accessibilityLabel="Parent zone" background={theme.surface} onPress={() => router.push("/parent-gate")}>
                <LockIcon color={theme.text} />
              </IconButton>
            </View>
          </View>

          {tiny ? (
            <Text style={[styles.tinyTitle, { color: theme.text, fontFamily: theme.headingFont }]}>{greeting}</Text>
          ) : (
            <View style={styles.mascotRow}>
              <Owl size={explorer ? 84 : 110} />
              <Text
                style={[
                  styles.bubble,
                  { backgroundColor: theme.surface, color: theme.text, fontFamily: theme.headingFont, fontSize: theme.band === "6-8" ? 22 : 24 },
                ]}
              >
                {prompt}
              </Text>
            </View>
          )}

          <View style={styles.micWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tap and ask out loud"
              onPress={() => router.push("/listen")}
              style={({ pressed }) => [
                styles.mic,
                {
                  width: tiny ? 180 : explorer ? 96 : 120,
                  height: tiny ? 180 : explorer ? 96 : 120,
                  backgroundColor: theme.primary,
                  borderColor: theme.dark ? theme.border : "#FFFFFF",
                  borderWidth: tiny ? 14 : 10,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <MicIcon size={tiny ? 80 : explorer ? 40 : 52} color={theme.onPrimary} />
            </Pressable>
            <View style={styles.row}>
              <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: tiny ? 26 : 20 }}>
                {tiny ? "Tap and talk!" : "Tap and ask out loud"}
              </Text>
              {tiny && (
                <IconButton accessibilityLabel="Hear this" background={theme.surface} size={48} radius={24} onPress={() => readAloud("Tap the big button and ask me anything!", theme)}>
                  <SpeakerIcon size={22} color={theme.text} />
                </IconButton>
              )}
            </View>
          </View>

          {theme.showTypeBox && (
            <View style={[styles.typeRow, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radius }]}>
              <TextInput
                accessibilityLabel="Type your question"
                value={typed}
                onChangeText={setTyped}
                placeholder={explorer ? "Type any question…" : "Or type your question…"}
                placeholderTextColor={theme.mutedText}
                maxLength={300}
                returnKeyType="send"
                onSubmitEditing={() => ask(typed)}
                style={[styles.input, { color: theme.text, fontFamily: theme.bodyFont }]}
              />
              <IconButton accessibilityLabel="Send question" background={theme.secondary} onPress={() => ask(typed)}>
                <SendIcon color={theme.onSecondary} />
              </IconButton>
            </View>
          )}

          {explorer && (
            <View style={[styles.mystery, { borderRadius: theme.radius + 6 }]}>
              <Text style={styles.mysteryLabel}>TODAY'S MYSTERY</Text>
              <Text style={[styles.mysteryText, { fontFamily: theme.headingFont }]}>{MYSTERY}</Text>
              <KidButton
                label="Investigate +15 XP"
                onPress={() => ask(MYSTERY)}
                background={theme.secondary}
                color={theme.onSecondary}
                font={theme.bodyBoldFont}
                fontSize={15}
                height={44}
                radius={12}
                style={{ alignSelf: "flex-start" }}
              />
            </View>
          )}

          <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: tiny ? 22 : 17 }}>
            {explorer ? "Explore a field" : "Pick a topic"}
          </Text>
          <View style={styles.topics}>
            {TOPICS.map((topic) => (
              <Pressable
                key={topic.key}
                accessibilityRole="button"
                accessibilityLabel={`${topic.label}: ${topic.question}`}
                onPress={() => ask(topic.question)}
                style={({ pressed }) => [
                  styles.topic,
                  explorer
                    ? { borderColor: topicColors[topic.key], borderWidth: 2, backgroundColor: "transparent", height: 48, flexBasis: "47%" }
                    : {
                        backgroundColor: topicColors[topic.key],
                        borderColor: "#FFFFFF",
                        borderWidth: tiny ? 4 : 3,
                        height: tiny ? 120 : 92,
                        flexBasis: tiny ? "47%" : "22%",
                      },
                  { borderRadius: theme.radius, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                {!explorer && <TopicIcon topic={topic.key} size={tiny ? 54 : 34} />}
                <Text
                  style={{
                    color: explorer ? theme.text : "#1B2A4A",
                    fontFamily: tiny ? theme.headingFont : theme.bodyBoldFont,
                    fontSize: tiny ? 22 : 14,
                  }}
                >
                  {topic.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </KidScreen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { borderRadius: 999, borderWidth: 3, borderColor: "#FFFFFF" },
  club: { fontSize: 12 },
  reward: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 12, height: 40 },
  tinyTitle: { fontSize: 34, textAlign: "center", marginTop: 70 },
  mascotRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bubble: { flex: 1, marginBottom: 36, borderRadius: 24, borderBottomLeftRadius: 6, padding: 14, overflow: "hidden" },
  micWrap: { alignItems: "center", gap: 12, marginVertical: 6 },
  mic: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 2, padding: 6, paddingLeft: 14 },
  input: { flex: 1, minHeight: 48, fontSize: 16 },
  mystery: { backgroundColor: "#312E81", padding: 18, gap: 10 },
  mysteryLabel: { color: "#C4B5FD", fontSize: 12, letterSpacing: 1, fontFamily: "Nunito_800ExtraBold" },
  mysteryText: { color: "#F1F5F9", fontSize: 21 },
  topics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  topic: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 4 },
});
