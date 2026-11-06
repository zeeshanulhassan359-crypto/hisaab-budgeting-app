import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { Nunito_600SemiBold, Nunito_800ExtraBold, useFonts } from "@expo-google-fonts/nunito";
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProfileProvider } from "../state/ProfileContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_600SemiBold,
    Nunito_800ExtraBold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#DCEFFF" }}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
