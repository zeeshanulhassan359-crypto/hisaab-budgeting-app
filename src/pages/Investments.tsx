import React from "react";
import { InvestmentCard } from "../components/InvestmentCard";
import { BookOpen } from "lucide-react";

export const Investments: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in animate-duration-300">
      {/* Title Header */}
      <div className="flex flex-col gap-1 border-b border-border-custom pb-4">
        <div className="flex items-center gap-2 text-accent-custom">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Education Hub</span>
        </div>
        <h2 className="text-2xl font-black text-text-primary tracking-tight">
          Smart Financial Growth
        </h2>
        <p className="text-xs text-text-secondary font-medium max-w-xl leading-relaxed">
          Unlock the power of Sharia-compliant compound growth and explore curated wealth-building strategies. Learn how to grow your savings passively.
        </p>
      </div>

      {/* Main Educational Card & Calculators list */}
      <InvestmentCard />
    </div>
  );
};

export default Investments;
