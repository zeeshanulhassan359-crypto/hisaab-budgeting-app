import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useProfile } from "../state/ProfileContext";

/** Sends first-time users to parent setup, everyone else to their home screen. */
export default function Start() {
  const { ready, profile } = useProfile();

  useEffect(() => {
    if (!ready) return;
    router.replace(profile ? "/home" : "/setup");
  }, [ready, profile]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#DCEFFF" }}>
      <ActivityIndicator size="large" color="#1B2A4A" />
    </View>
  );
}
