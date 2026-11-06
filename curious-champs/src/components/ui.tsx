import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../state/ProfileContext";
import { ageThemes, type AgeTheme } from "../theme/ageThemes";
import { Scene } from "./Art";

export function useAgeTheme(): AgeTheme {
  const { profile } = useProfile();
  return ageThemes[profile?.ageBand ?? "6-8"];
}

export function KidScreen({ children, theme, decor = true }: { children: ReactNode; theme: AgeTheme; decor?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {decor && <Scene theme={theme} />}
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

interface ButtonProps {
  label?: string;
  accessibilityLabel?: string;
  onPress: () => void;
  background: string;
  color: string;
  font: string;
  height: number;
  radius: number;
  fontSize?: number;
  icon?: ReactNode;
  disabled?: boolean;
  bordered?: string;
  style?: StyleProp<ViewStyle>;
}

/** Big, rounded, accessible button used across all age themes. */
export function KidButton(props: ButtonProps) {
  const { label, onPress, background, color, font, height, radius, icon, disabled, bordered, style } = props;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: height,
          borderRadius: radius,
          backgroundColor: background,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          borderWidth: bordered ? 3 : 0,
          borderColor: bordered,
        },
        style,
      ]}
    >
      {icon}
      {label ? <Text style={{ color, fontFamily: font, fontSize: props.fontSize ?? 18 }}>{label}</Text> : null}
    </Pressable>
  );
}

export function IconButton({
  onPress,
  accessibilityLabel,
  background,
  size = 48,
  radius = 14,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  background: string;
  size?: number;
  radius?: number;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: radius, backgroundColor: background, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  iconButton: { alignItems: "center", justifyContent: "center" },
});
