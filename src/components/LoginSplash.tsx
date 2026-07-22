import React, { useEffect, useState } from "react";
import { HisaabLogo } from "./HisaabLogo";

interface LoginSplashProps {
  userName: string;
  onComplete: () => void;
}

/**
 * Premium animated splash screen shown briefly after a successful login.
 * Displays the Hisaab logo with a pulsing glow, a personalized welcome message,
 * and a smooth fade-out transition before handing off to the main dashboard.
 */
export const LoginSplash: React.FC<LoginSplashProps> = ({ userName, onComplete }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // Phase 1: Enter animation (logo scales in + text fades in)
    const enterTimer = setTimeout(() => setPhase("hold"), 400);
    // Phase 2: Hold for a moment so user can read the greeting
    const holdTimer = setTimeout(() => setPhase("exit"), 1800);
    // Phase 3: Exit animation, then call onComplete
    const exitTimer = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-app transition-all duration-700 ${
        phase === "exit" ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full transition-all duration-[1500ms] ease-out ${
            phase === "enter"
              ? "bg-accent-custom/0 blur-[80px] scale-0"
              : "bg-accent-custom/8 blur-[120px] scale-100"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full transition-all duration-[2000ms] ease-out delay-200 ${
            phase === "enter"
              ? "bg-emerald-500/0 blur-[60px] scale-0"
              : "bg-emerald-500/5 blur-[100px] scale-100"
          }`}
        />
      </div>

      {/* Logo container with glow ring */}
      <div
        className={`relative transition-all duration-700 ease-out ${
          phase === "enter"
            ? "opacity-0 scale-50 translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Pulsing glow behind logo */}
        <div className="absolute inset-0 -m-6 rounded-full bg-accent-custom/15 blur-2xl animate-pulse" />
        
        {/* Logo ring */}
        <div className="relative w-24 h-24 rounded-full bg-bg-card border-2 border-accent-custom/30 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Spinning border accent */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, var(--color-accent-custom) 25%, transparent 50%)",
              animation: "spin 2s linear infinite",
              opacity: 0.3,
            }}
          />
          <div className="absolute inset-[3px] rounded-full bg-bg-card" />
          <div className="relative z-10">
            <HisaabLogo size={48} />
          </div>
        </div>
      </div>

      {/* Welcome text */}
      <div
        className={`mt-8 flex flex-col items-center gap-2 transition-all duration-600 ease-out ${
          phase === "enter"
            ? "opacity-0 translate-y-6"
            : phase === "hold"
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
        }`}
        style={{ transitionDelay: phase === "enter" ? "0ms" : "200ms" }}
      >
        <h2 className="text-xl font-black text-text-primary tracking-tight">
          Welcome back, {userName.split(" ")[0]}!
        </h2>
        <p className="text-sm text-text-secondary font-medium">
          Setting up your dashboard...
        </p>
      </div>

      {/* Progress dots */}
      <div
        className={`mt-6 flex items-center gap-2 transition-all duration-500 ${
          phase === "enter" ? "opacity-0" : phase === "exit" ? "opacity-0" : "opacity-100"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-accent-custom"
            style={{
              animation: "pulse 1s ease-in-out infinite",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      {/* Keyframes for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginSplash;
