import React from "react";

interface HisaabLogoProps {
  className?: string;
  size?: number;
}

export const HisaabLogo: React.FC<HisaabLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Emerald Pillar Gradient */}
        <linearGradient id="emeraldGrad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
          <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
        </linearGradient>
        
        {/* Golden Ledger Curve Gradient */}
        <linearGradient id="goldCurveGrad" x1="30" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" /> {/* amber-500 */}
          <stop offset="100%" stopColor="#d97706" /> {/* amber-600 */}
        </linearGradient>

        {/* Shadow for Premium Depth */}
        <filter id="premiumGlow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* 1. Hexagon Background & Neon Border */}
      <path
        d="M50 8 L86.4 29 L86.4 71 L50 92 L13.6 71 L13.6 29 Z"
        fill="#05140e"
        stroke="#10b981"
        strokeWidth="3.5"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* 2. Inner dashed hexagon border */}
      <path
        d="M50 14 L81.2 32 L81.2 68 L50 86 L18.8 68 L18.8 32 Z"
        stroke="#f59e0b"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.6"
      />

      {/* 3. Left vertical green stem */}
      <path
        d="M36 30 V70"
        stroke="url(#emeraldGrad)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      
      {/* 4. Right vertical green stem */}
      <path
        d="M60 30 V70"
        stroke="url(#emeraldGrad)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* 5. Golden Ledger-Growth Calligraphy Curve */}
      <path
        d="M36 52 C44 52 50 48 55 40 C60 32 64 24 72 20"
        stroke="url(#goldCurveGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        filter="url(#premiumGlow)"
      />

      {/* 6. Connection link/bridge for the crossbar */}
      <path
        d="M36 52 H60"
        stroke="url(#goldCurveGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default HisaabLogo;
