import { router } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MicIcon } from "../components/Icons";
import { IconButton, KidButton, useAgeTheme } from "../components/ui";

type Phase = "starting" | "listening" | "confirm" | "error";

const BARS = ["#FFD43B", "#FF8787", "#69DB7C", "#74C0FC", "#B197FC", "#FFA94D", "#FFD43B"];

export default function Listen() {
  const theme = useAgeTheme();
  const [phase, setPhase] = useState<Phase>("starting");
  const [transcript, setTranscript] = useState("");
  const [onDevice, setOnDevice] = useState(false);
  const [errorText, setErrorText] = useState("");
  const transcriptRef = useRef("");

  async function begin() {
    setTranscript("");
    transcriptRef.current = "";
    setPhase("starting");
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorText("Champ needs the microphone to hear you. A grown-up can turn it on in Settings.");
        setPhase("error");
        return;
      }
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setErrorText("Talking isn't available on this device yet. You can type your question instead.");
        setPhase("error");
        return;
      }
      // Prefer on-device recognition so the child's voice never leaves the phone.
      const local = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      setOnDevice(local);
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
        requiresOnDeviceRecognition: local,
      });
    } catch {
      setErrorText("Champ couldn't start listening. Let's try typing instead.");
      setPhase("error");
    }
  }

  useEffect(() => {
    void begin();
    return () => ExpoSpeechRecognitionModule.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSpeechRecognitionEvent("start", () => setPhase("listening"));
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    transcriptRef.current = text;
    setTranscript(text);
  });
  useSpeechRecognitionEvent("end", () => {
    setPhase((p) => (p === "error" ? p : transcriptRef.current.trim() ? "confirm" : "error"));
    if (!transcriptRef.current.trim()) setErrorText("Champ didn't hear anything. Let's try again!");
  });
  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "aborted") return;
    setErrorText(event.error === "no-speech" ? "Champ didn't hear anything. Let's try again!" : "Oops, Champ couldn't hear that. Let's try again!");
    setPhase("error");
  });

  const big = theme.band === "3-5";
  const yes = () => router.replace({ pathname: "/answer", params: { q: transcript.trim() } });

  return (
    <View style={{ flex: 1, backgroundColor: "#1B2A4A" }}>
      <SafeAreaView style={styles.page}>
        <View style={{ alignSelf: "stretch" }}>
          <IconButton accessibilityLabel="Close" background="#2B3D63" onPress={() => router.back()}>
            <Text style={{ color: "#FFFFFF", fontSize: 22, fontFamily: theme.headingFont }}>✕</Text>
          </IconButton>
        </View>

        <View style={styles.rings}>
          <View style={styles.ring2}>
            <View style={[styles.core, { backgroundColor: theme.dark ? theme.primary : "#FF9F43" }]}>
              <MicIcon size={48} color="#1B2A4A" />
            </View>
          </View>
        </View>

        {phase !== "confirm" && phase !== "error" && (
          <View style={styles.bars} accessibilityElementsHidden>
            {BARS.map((c, i) => (
              <View key={i} style={{ width: 10, height: [12, 28, 40, 20, 36, 24, 12][i], borderRadius: 5, backgroundColor: c }} />
            ))}
          </View>
        )}

        <Text accessibilityLiveRegion="polite" style={[styles.title, { fontFamily: theme.headingFont, fontSize: big ? 32 : 28 }]}>
          {phase === "starting" ? "Getting ready…" : phase === "listening" ? "I'm listening…" : phase === "confirm" ? "Got it!" : "Hmm…"}
        </Text>
        {phase === "listening" && transcript ? <Text style={styles.live}>{transcript}</Text> : null}
        {phase === "listening" && (
          <Text style={styles.privacy}>{onDevice ? "Your voice stays on this phone" : "Your phone is turning your voice into words"}</Text>
        )}

        <View style={{ flex: 1 }} />

        {phase === "confirm" && (
          <View style={[styles.card, { borderRadius: theme.radius + 4 }]}>
            <Text style={[styles.cardLabel, { fontFamily: theme.bodyBoldFont }]}>Did you ask…</Text>
            <Text style={[styles.cardQ, { fontFamily: theme.headingFont, fontSize: big ? 28 : 24 }]}>"{transcript.trim()}"</Text>
            <View style={styles.choices}>
              <KidButton label="Try again" onPress={begin} background="#FFFFFF" bordered="#C9D8EC" color="#1B2A4A" font={theme.headingFont} height={theme.touchSize} radius={16} style={{ flex: 1 }} />
              <KidButton label="Yes, ask it!" onPress={yes} background="#FF9F43" color="#1B2A4A" font={theme.headingFont} height={theme.touchSize} radius={16} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {phase === "error" && (
          <View style={[styles.card, { borderRadius: theme.radius + 4 }]}>
            <Text style={[styles.cardQ, { fontFamily: theme.headingFont, fontSize: 20 }]}>{errorText}</Text>
            <View style={styles.choices}>
              <KidButton label="Try again" onPress={begin} background="#FF9F43" color="#1B2A4A" font={theme.headingFont} height={theme.touchSize} radius={16} style={{ flex: 1 }} />
              {theme.showTypeBox && (
                <KidButton label="Type instead" onPress={() => router.back()} background="#FFFFFF" bordered="#C9D8EC" color="#1B2A4A" font={theme.headingFont} height={theme.touchSize} radius={16} style={{ flex: 1 }} />
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, alignItems: "center", gap: 18 },
  rings: { width: 240, height: 240, borderRadius: 120, backgroundColor: "#23365C", alignItems: "center", justifyContent: "center", marginTop: 12 },
  ring2: { width: 176, height: 176, borderRadius: 88, backgroundColor: "#2E4673", alignItems: "center", justifyContent: "center" },
  core: { width: 116, height: 116, borderRadius: 58, alignItems: "center", justifyContent: "center" },
  bars: { flexDirection: "row", alignItems: "center", gap: 10, height: 40 },
  title: { color: "#FFFFFF" },
  live: { color: "#E2E8F0", fontSize: 18, textAlign: "center", fontFamily: "Nunito_600SemiBold" },
  privacy: { color: "#C6D2E8", fontSize: 14, fontFamily: "Nunito_600SemiBold" },
  card: { alignSelf: "stretch", backgroundColor: "#FFFFFF", padding: 20, gap: 14 },
  cardLabel: { color: "#44516B", fontSize: 14 },
  cardQ: { color: "#1B2A4A" },
  choices: { flexDirection: "row", gap: 10 },
});
