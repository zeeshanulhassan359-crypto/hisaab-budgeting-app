import * as Speech from "expo-speech";
import type { AgeTheme } from "../theme/ageThemes";

/** Read text aloud with a voice pace that suits the child's age. Runs on the device. */
export function readAloud(text: string, theme: AgeTheme, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, {
    language: "en",
    rate: theme.speechRate,
    pitch: theme.speechPitch,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopReading() {
  void Speech.stop();
}
