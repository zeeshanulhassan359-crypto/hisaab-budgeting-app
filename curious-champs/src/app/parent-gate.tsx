import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackIcon } from "../components/Icons";
import { IconButton, KidButton } from "../components/ui";
import { fonts, parentTheme as t } from "../theme/ageThemes";

// A grown-ups-only check before settings, links or history.
// App Store and Google Play family rules expect one.
export default function ParentGate() {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)], []);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  function check() {
    if (Number(value.trim()) === a * b) {
      router.replace("/parent");
    } else {
      setWrong(true);
      setValue("");
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <IconButton accessibilityLabel="Back" background={t.surface} onPress={() => router.back()}>
        <BackIcon />
      </IconButton>
      <View style={styles.card}>
        <Text style={styles.h1}>Grown-ups only</Text>
        <Text style={styles.muted}>To open the Parent zone, please answer:</Text>
        <Text style={styles.sum} nativeID="gateQuestion">
          {a} × {b} = ?
        </Text>
        <TextInput
          accessibilityLabelledBy="gateQuestion"
          accessibilityLabel={`What is ${a} times ${b}?`}
          value={value}
          onChangeText={(v) => {
            setValue(v.replace(/[^0-9]/g, ""));
            setWrong(false);
          }}
          keyboardType="number-pad"
          maxLength={3}
          onSubmitEditing={check}
          style={styles.input}
        />
        {wrong && <Text style={styles.wrong}>That's not quite right. Try again.</Text>}
        <KidButton label="Continue" onPress={check} disabled={!value} background={t.primary} color={t.onPrimary} font={fonts.roundSemi} height={56} radius={16} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: t.background, padding: 20, gap: 20 },
  card: { backgroundColor: t.surface, borderRadius: 24, padding: 24, gap: 14 },
  h1: { fontFamily: fonts.roundSemi, fontSize: 28, color: t.text },
  muted: { fontFamily: fonts.body, fontSize: 15, color: t.mutedText },
  sum: { fontFamily: fonts.roundBold, fontSize: 36, color: t.text, textAlign: "center" },
  input: { height: 56, borderRadius: 14, borderWidth: 2, borderColor: t.border, textAlign: "center", fontSize: 24, fontFamily: fonts.bodyBold, color: t.text },
  wrong: { fontFamily: fonts.body, fontSize: 14, color: "#B91C1C" },
});
