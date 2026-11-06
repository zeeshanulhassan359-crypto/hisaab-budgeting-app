import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

const stroke = (color: string, width = 2.2) => ({
  fill: "none",
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function MicIcon({ size = 24, color = "#1B2A4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={9} y={2} width={6} height={12} rx={3} fill={color} />
      <Path d="M5 11a7 7 0 0 0 14 0" {...stroke(color)} />
      <Path d="M12 18v4" {...stroke(color)} />
    </Svg>
  );
}

export function SpeakerIcon({ size = 24, color = "#1B2A4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9v6h4l5 4V5L8 9z" fill={color} />
      <Path d="M16 9a4 4 0 0 1 0 6" {...stroke(color)} />
      <Path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" {...stroke(color)} />
    </Svg>
  );
}

export function BackIcon({ size = 22, color = "#1B2A4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12H5" {...stroke(color, 2.5)} />
      <Path d="M11 6l-6 6 6 6" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function HomeIcon({ size = 28, color = "#1B2A4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 11l9-8 9 8" {...stroke(color, 2.5)} />
      <Path d="M5 10v10h14V10" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function LockIcon({ size = 22, color = "#1B2A4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={11} width={14} height={10} rx={2} {...stroke(color, 2)} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" {...stroke(color, 2)} />
    </Svg>
  );
}

export function SendIcon({ size = 22, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12h14" {...stroke(color, 2.5)} />
      <Path d="M13 6l6 6-6 6" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function ReplayIcon({ size = 40, color = "#1B2A4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 12a9 9 0 1 0 3-6.7" {...stroke(color, 2.5)} />
      <Path d="M3 3v5h5" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function ShieldIcon({ size = 16, color = "#0F766E" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...stroke(color, 2.5)} />
      <Path d="M9 12l2 2 4-4" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function BulbIcon({ size = 24, color = "#9A3412" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 18h6" {...stroke(color, 2)} />
      <Path d="M10 22h4" {...stroke(color, 2)} />
      <Path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" {...stroke(color, 2)} />
    </Svg>
  );
}

export function PlayIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill="#FFFFFF" />
      <Path d="M10 8l6 4-6 4z" fill="#1B2A4A" />
    </Svg>
  );
}

export type TopicKey = "animals" | "space" | "weather" | "body";

export function TopicIcon({ topic, size = 40 }: { topic: TopicKey; size?: number }) {
  switch (topic) {
    case "animals":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx={14} cy={14} r={5} fill="#1B2A4A" />
          <Circle cx={24} cy={10} r={5} fill="#1B2A4A" />
          <Circle cx={34} cy={14} r={5} fill="#1B2A4A" />
          <Circle cx={8} cy={24} r={4.5} fill="#1B2A4A" />
          <Ellipse cx={24} cy={32} rx={12} ry={10} fill="#1B2A4A" />
        </Svg>
      );
    case "space":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx={22} cy={26} r={13} fill="#FFD43B" />
          <Ellipse cx={22} cy={26} rx={21} ry={6} fill="none" stroke="#1B2A4A" strokeWidth={3} />
        </Svg>
      );
    case "weather":
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx={30} cy={16} r={9} fill="#FFD43B" />
          <Ellipse cx={20} cy={30} rx={14} ry={9} fill="#FFFFFF" />
          <Ellipse cx={30} cy={27} rx={10} ry={8} fill="#FFFFFF" />
        </Svg>
      );
    case "body":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" fill="#E03131" />
        </Svg>
      );
  }
}
