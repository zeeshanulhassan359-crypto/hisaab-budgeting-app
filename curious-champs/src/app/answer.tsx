import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Illustration, Owl, Star } from "../components/Art";
import { BackIcon, BulbIcon, HomeIcon, MicIcon, ReplayIcon, ShieldIcon, SpeakerIcon } from "../components/Icons";
import { IconButton, KidButton, KidScreen, useAgeTheme } from "../components/ui";
import { VideoCard } from "../components/VideoCard";
import { askQuestion } from "../lib/api";
import { readAloud, stopReading } from "../lib/speech";
import type { AskResponse } from "../lib/types";
import { findApprovedVideo } from "../media/videos";
import { useProfile } from "../state/ProfileContext";

export default function Answer() {
  const theme = useAgeTheme();
  const { width } = useWindowDimensions();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const question = (Array.isArray(q) ? q[0] : q ?? "").trim();
  const { profile, settings, recordQuestion } = useProfile();
  const [result, setResult] = useState<AskResponse | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const recorded = useRef(false);

  const tiny = theme.band === "3-5";
  const explorer = theme.band === "9-12";

  function speak(r: AskResponse) {
    setSpeaking(true);
    const text = r.funFact && !tiny ? `${r.answer} Fun fact: ${r.funFact}` : r.answer;
    readAloud(text, theme, () => setSpeaking(false));
  }

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    recorded.current = false;
    if (!question || !profile) return;
    askQuestion(question, profile.ageBand).then((r) => {
      if (cancelled) return;
      setResult(r);
      if (!recorded.current) {
        recorded.current = true;
        recordQuestion({ question, kind: r.kind, mediaTopic: r.mediaTopic, flagged: r.flagForParent, source: r.source });
      }
      if (settings.readAloud) speak(r);
    });
    return () => {
      cancelled = true;
      stopReading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, profile?.ageBand]);

  const imageWidth = width - 40;
  const video = result && settings.videos && result.kind === "answer" ? findApprovedVideo(result.mediaTopic, theme.band) : null;
  const earned = result?.kind === "answer";

  return (
    <KidScreen theme={theme} decor={theme.scene !== "rainbow"}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <IconButton
            accessibilityLabel={tiny ? "Go home" : "Back"}
            background={theme.surface}
            size={tiny ? 60 : 48}
            radius={tiny ? 20 : 14}
            onPress={() => router.back()}
          >
            {tiny ? <HomeIcon color={theme.text} /> : <BackIcon color={theme.text} />}
          </IconButton>
          {result && result.kind !== "redirect" && result.kind !== "personal_info" && (
            <View style={[styles.badge, { backgroundColor: theme.dark ? "transparent" : theme.surface, borderColor: theme.primary, borderWidth: theme.dark ? 1.5 : 0 }]}>
              <ShieldIcon color={theme.dark ? theme.primary : "#0F766E"} />
              <Text style={{ color: theme.dark ? theme.primary : "#0F766E", fontFamily: theme.bodyBoldFont, fontSize: 12 }}>
                {result.source === "offline" ? "From your offline pack" : `Checked for ages ${theme.band.replace("-", "–")}`}
              </Text>
            </View>
          )}
        </View>

        <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: tiny ? 24 : 26 }}>{question}</Text>

        {!result ? (
          <View style={styles.loading}>
            <Owl size={120} />
            <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: 20 }}>Champ is thinking…</Text>
            <ActivityIndicator color={theme.text} />
          </View>
        ) : (
          <>
            {result.kind !== "personal_info" && (
              <View style={[styles.picture, { borderRadius: theme.radius + 8, borderWidth: tiny ? 5 : 0 }]}>
                <Illustration topic={result.mediaTopic} width={imageWidth} height={tiny ? 300 : 170} />
              </View>
            )}

            <View style={[styles.card, { backgroundColor: theme.surface, borderRadius: theme.radius }]}>
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  color: theme.text,
                  fontFamily: tiny ? theme.headingFont : theme.bodyFont,
                  fontSize: theme.bodySize + (tiny ? 2 : 1),
                  lineHeight: (theme.bodySize + (tiny ? 2 : 1)) * 1.45,
                  textAlign: tiny ? "center" : "left",
                }}
              >
                {result.answer}
              </Text>
              <KidButton
                label={speaking ? "Reading…" : "Read it to me"}
                accessibilityLabel="Read the answer out loud"
                onPress={() => speak(result)}
                background={theme.dark ? theme.primary : "#1B2A4A"}
                color={theme.dark ? theme.onPrimary : "#FFFFFF"}
                font={theme.bodyBoldFont}
                fontSize={tiny ? 20 : 14}
                height={tiny ? 72 : 44}
                radius={999}
                icon={<SpeakerIcon size={tiny ? 30 : 18} color={theme.dark ? theme.onPrimary : "#FFFFFF"} />}
                style={{ alignSelf: tiny ? "center" : "flex-start" }}
              />
            </View>

            {result.funFact && !tiny && (
              <View style={[styles.fact, { backgroundColor: theme.dark ? "#312E81" : "#FFE8CC", borderRadius: theme.radius }]}>
                <BulbIcon color={theme.dark ? "#C4B5FD" : "#9A3412"} />
                <Text style={{ flex: 1, color: theme.dark ? "#F1F5F9" : "#1B2A4A", fontFamily: theme.bodyFont, fontSize: 15, lineHeight: 21 }}>
                  <Text style={{ fontFamily: theme.bodyBoldFont }}>{explorer ? "Did you know? " : "Fun fact: "}</Text>
                  {result.funFact}
                </Text>
              </View>
            )}

            {result.steps.length > 0 && !tiny && (
              <View style={styles.steps}>
                {result.steps.map((step, i) => (
                  <View key={step} style={[styles.step, { backgroundColor: theme.surface, borderRadius: 14 }]}>
                    <Text style={{ color: [theme.accent, "#60A5FA", theme.primary][i % 3], fontFamily: theme.headingFont, fontSize: 18 }}>{i + 1}</Text>
                    <Text style={{ color: theme.text, fontFamily: theme.bodyBoldFont, fontSize: 12, lineHeight: 16 }}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {video && <VideoCard video={video} theme={theme} />}

            {result.followUps.length > 0 && !tiny && (
              <View style={{ gap: 8 }}>
                <Text style={{ color: theme.mutedText, fontFamily: theme.bodyBoldFont, fontSize: 13 }}>{explorer ? "Go deeper" : "Ask next"}</Text>
                <View style={styles.chips}>
                  {result.followUps.map((f) => (
                    <Pressable
                      key={f}
                      accessibilityRole="button"
                      onPress={() => router.replace({ pathname: "/answer", params: { q: f } })}
                      style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.dark ? "transparent" : theme.surface }]}
                    >
                      <Text style={{ color: theme.text, fontFamily: theme.bodyBoldFont, fontSize: 13 }}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {tiny ? (
              <>
                <View style={styles.tinyRow}>
                  <KidButton accessibilityLabel="Hear it again" onPress={() => speak(result)} background="#74C0FC" bordered="#FFFFFF" color="#1B2A4A" font={theme.headingFont} height={84} radius={28} icon={<ReplayIcon />} style={{ flex: 1 }} />
                  <KidButton accessibilityLabel="Ask a new question" onPress={() => router.replace("/listen")} background="#FF6B6B" bordered="#FFFFFF" color="#FFFFFF" font={theme.headingFont} height={84} radius={28} icon={<MicIcon size={40} color="#FFFFFF" />} style={{ flex: 1 }} />
                </View>
                {earned && (
                  <View style={styles.reward}>
                    <Star size={40} />
                    <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: 22 }}>You got a star!</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.bottomRow}>
                {earned && (
                  <View style={[styles.rewardPill, { backgroundColor: theme.surface, borderRadius: theme.radius }]}>
                    {explorer ? null : <Star size={28} />}
                    <Text style={{ color: explorer ? theme.primary : theme.text, fontFamily: theme.headingFont, fontSize: 15 }}>
                      {explorer ? "+15 XP" : "New sticker!"}
                    </Text>
                  </View>
                )}
                <KidButton
                  label="Ask another"
                  onPress={() => router.back()}
                  background={theme.primary}
                  color={theme.onPrimary}
                  font={theme.headingFont}
                  fontSize={18}
                  height={theme.touchSize}
                  radius={theme.radius}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KidScreen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 14, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 40 },
  picture: { overflow: "hidden", borderColor: "#FFFFFF" },
  card: { padding: 16, gap: 12 },
  fact: { flexDirection: "row", gap: 12, padding: 14, alignItems: "flex-start" },
  steps: { flexDirection: "row", gap: 8 },
  step: { flex: 1, padding: 10, gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, minHeight: 40, justifyContent: "center" },
  tinyRow: { flexDirection: "row", gap: 14, marginTop: 8 },
  reward: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  bottomRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 8 },
  rewardPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, height: 56 },
});
