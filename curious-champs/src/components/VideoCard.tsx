import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ApprovedVideo } from "../media/videos";
import type { AgeTheme } from "../theme/ageThemes";
import { PlayIcon } from "./Icons";

/** Plays one approved, self-hosted video inside the app. No links out, no recommendations. */
export function VideoCard({ video, theme }: { video: ApprovedVideo; theme: AgeTheme }) {
  const [open, setOpen] = useState(false);
  const player = useVideoPlayer(video.url, (p) => {
    p.loop = false;
  });

  if (open) {
    return (
      <View style={[styles.playerWrap, { borderRadius: theme.radius }]}>
        <VideoView player={player} style={styles.player} nativeControls contentFit="contain" />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Watch ${video.title}, ${video.minutes} minutes`}
      onPress={() => {
        setOpen(true);
        player.play();
      }}
      style={[styles.card, { backgroundColor: theme.surface, borderRadius: theme.radius }]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.dark ? "#312E81" : "#3B82C4" }]}>
        <PlayIcon />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: theme.text, fontFamily: theme.headingFont, fontSize: 16 }}>Watch: {video.title}</Text>
        <Text style={{ color: theme.mutedText, fontFamily: theme.bodyBoldFont, fontSize: 12 }}>
          Approved video · {video.minutes} min · no ads
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
  thumb: { width: 100, height: 60, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  playerWrap: { overflow: "hidden", backgroundColor: "#000000" },
  player: { width: "100%", aspectRatio: 16 / 9 },
});
