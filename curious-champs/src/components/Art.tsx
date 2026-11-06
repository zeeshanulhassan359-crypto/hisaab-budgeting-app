import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { StyleSheet, View } from "react-native";
import type { MediaTopic } from "../lib/types";
import type { AgeTheme } from "../theme/ageThemes";

// Simple drawn art so the app works offline and shows nothing we haven't checked.

export function Owl({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140" accessibilityLabel="Champ the owl">
      <Ellipse cx={70} cy={80} rx={52} ry={54} fill="#FF9F43" />
      <Ellipse cx={70} cy={96} rx={32} ry={30} fill="#FFD9A8" />
      <Path d="M26 40 L40 56 L48 34 Z" fill="#E07B1F" />
      <Path d="M114 40 L100 56 L92 34 Z" fill="#E07B1F" />
      <Circle cx={50} cy={66} r={18} fill="#FFFFFF" />
      <Circle cx={90} cy={66} r={18} fill="#FFFFFF" />
      <Circle cx={53} cy={68} r={8} fill="#1B2A4A" />
      <Circle cx={87} cy={68} r={8} fill="#1B2A4A" />
      <Circle cx={56} cy={65} r={2.5} fill="#FFFFFF" />
      <Circle cx={90} cy={65} r={2.5} fill="#FFFFFF" />
      <Path d="M64 82 L76 82 L70 92 Z" fill="#1B2A4A" />
    </Svg>
  );
}

export function Star({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z" fill="#FFC21A" stroke="#C77700" strokeWidth={1.2} />
    </Svg>
  );
}

/** Decorative background scene for each age group. Purely visual. */
export function Scene({ theme }: { theme: AgeTheme }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      {theme.scene === "rainbow" && (
        <Svg width="100%" height={220} viewBox="0 0 420 220" style={{ position: "absolute", top: -40 }}>
          {["#FF6B6B", "#FFA94D", "#69DB7C", "#4DABF7", "#B197FC"].map((c, i) => {
            const r = 190 - i * 24;
            return <Path key={c} d={`M${210 - r} 220 A${r} ${r} 0 0 1 ${210 + r} 220`} fill="none" stroke={c} strokeWidth={22} />;
          })}
        </Svg>
      )}
      {theme.scene === "sky" && (
        <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <Circle cx={360} cy={40} r={70} fill="#FFE066" />
          <G fill="#FFFFFF">
            <Circle cx={40} cy={190} r={18} />
            <Circle cx={64} cy={180} r={24} />
            <Circle cx={90} cy={192} r={16} />
            <Circle cx={300} cy={240} r={16} />
            <Circle cx={324} cy={230} r={22} />
            <Circle cx={348} cy={242} r={14} />
          </G>
          <Path d="M0 760 Q 100 710 200 745 T 390 735 V844 H0Z" fill="#B2F2BB" />
        </Svg>
      )}
      {theme.scene === "space" && (
        <Svg width="100%" height={300} viewBox="0 0 390 300">
          <Circle cx={340} cy={220} r={60} fill="#1E293B" />
          <Circle cx={340} cy={220} r={38} fill="#312E81" />
          <Ellipse cx={340} cy={220} rx={70} ry={12} fill="none" stroke="#A78BFA" strokeWidth={2} opacity={0.6} />
          {[[40, 40], [120, 22], [200, 70], [70, 140], [250, 160], [160, 200]].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill="#CBD5E1" />
          ))}
        </Svg>
      )}
    </View>
  );
}

/** One checked picture per topic tag. The AI picks only the tag. */
export function Illustration({ topic, width, height }: { topic: MediaTopic; width: number; height: number }) {
  const label = `Picture about ${topic}`;
  return (
    <Svg width={width} height={height} viewBox="0 0 350 200" preserveAspectRatio="xMidYMid slice" accessibilityLabel={label}>
      {topic === "space" ? (
        <>
          <Rect width={350} height={200} fill="#1E1B4B" />
          <Circle cx={120} cy={110} r={46} fill="#FFD43B" />
          <Ellipse cx={120} cy={110} rx={80} ry={16} fill="none" stroke="#C0B0FF" strokeWidth={6} />
          <Circle cx={270} cy={60} r={22} fill="#E9ECEF" />
          {[[30, 30], [300, 160], [220, 140], [60, 170], [200, 30]].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#FFFFFF" />
          ))}
        </>
      ) : topic === "ocean" ? (
        <>
          <Rect width={350} height={200} fill="#4DABF7" />
          <Path d="M0 90 Q 45 70 90 90 T 180 90 T 270 90 T 360 90 V200 H0Z" fill="#1971C2" />
          <Ellipse cx={170} cy={140} rx={34} ry={18} fill="#FFA94D" />
          <Path d="M204 140 L226 124 L226 156 Z" fill="#FFA94D" />
          <Circle cx={156} cy={136} r={4} fill="#1B2A4A" />
        </>
      ) : topic === "animals" ? (
        <>
          <Rect width={350} height={200} fill="#B2F2BB" />
          <Rect y={150} width={350} height={50} fill="#69DB7C" />
          <Ellipse cx={175} cy={120} rx={58} ry={44} fill="#FFA94D" />
          <Circle cx={175} cy={70} r={34} fill="#FFA94D" />
          <Path d="M148 48 L152 20 L170 44 Z" fill="#E8590C" />
          <Path d="M202 48 L198 20 L180 44 Z" fill="#E8590C" />
          <Circle cx={163} cy={68} r={5} fill="#1B2A4A" />
          <Circle cx={187} cy={68} r={5} fill="#1B2A4A" />
          <Path d="M168 82 Q175 88 182 82" stroke="#1B2A4A" strokeWidth={3} fill="none" />
        </>
      ) : topic === "plants" || topic === "earth" ? (
        <>
          <Rect width={350} height={200} fill="#D3F9D8" />
          <Rect y={160} width={350} height={40} fill="#A9770F" />
          <Rect x={168} y={70} width={14} height={92} fill="#2F9E44" />
          <Ellipse cx={140} cy={100} rx={34} ry={14} fill="#40C057" />
          <Ellipse cx={210} cy={84} rx={34} ry={14} fill="#40C057" />
          <Circle cx={175} cy={56} r={22} fill="#FF8787" />
          <Circle cx={175} cy={56} r={9} fill="#FFD43B" />
        </>
      ) : topic === "body" || topic === "feelings" ? (
        <>
          <Rect width={350} height={200} fill="#FFE3E3" />
          <Path d="M175 170 C 60 100 100 30 175 70 C 250 30 290 100 175 170 Z" fill="#FF6B6B" />
          <Circle cx={150} cy={90} r={7} fill="#FFFFFF" opacity={0.7} />
        </>
      ) : topic === "science" ? (
        <>
          <Rect width={350} height={200} fill="#E5DBFF" />
          <Path d="M155 30 H195 V80 L240 170 H110 L155 80 Z" fill="#FFFFFF" stroke="#5F3DC4" strokeWidth={5} />
          <Path d="M128 140 H222 L240 170 H110 Z" fill="#69DB7C" />
          <Circle cx={160} cy={150} r={6} fill="#FFFFFF" />
          <Circle cx={190} cy={124} r={4} fill="#69DB7C" />
        </>
      ) : (
        // sky, weather, general
        <>
          <Rect width={350} height={200} fill="#7CC4F5" />
          <Rect y={160} width={350} height={40} fill="#7BC67E" />
          <Circle cx={70} cy={60} r={30} fill="#FCD34D" />
          <G fill="#FFFFFF">
            <Circle cx={210} cy={80} r={22} />
            <Circle cx={238} cy={70} r={28} />
            <Circle cx={266} cy={82} r={20} />
          </G>
          {topic === "weather" && (
            <G stroke="#1971C2" strokeWidth={4} strokeLinecap="round">
              <Path d="M220 112 l-6 14" />
              <Path d="M240 112 l-6 14" />
              <Path d="M260 112 l-6 14" />
            </G>
          )}
        </>
      )}
    </Svg>
  );
}
