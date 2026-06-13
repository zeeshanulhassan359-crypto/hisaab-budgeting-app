import React, { useState } from "react";
import { TrendingUp, Percent, Shuffle, ArrowRight, Landmark, HelpCircle, Calculator } from "lucide-react";

interface InvestmentIdea {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  shortDesc: string;
  longDesc: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedReturn: string;
  tips: string[];
}

export const InvestmentCard: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compound Calculator State
  const [principal, setPrincipal] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [annualRate, setAnnualRate] = useState(8);
  const [years, setYears] = useState(10);

  const calculateCompoundInterest = () => {
    const P = principal;
    const PMT = monthlyContribution;
    const r = annualRate / 100 / 12; // monthly rate
    const n = 12; // 12 compounds per year
    const t = years;
    const totalMonths = n * t;

    // Compound formula with contributions
    // Future Value = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)] * (1 + r/n)
    const compoundFactor = Math.pow(1 + r, totalMonths);
    const principalGain = P * compoundFactor;
    const contributionsGain = r > 0 ? PMT * ((compoundFactor - 1) / r) * (1 + r) : PMT * totalMonths;

    const totalBalance = principalGain + contributionsGain;
    const totalInvested = P + PMT * totalMonths;
    const totalEarned = totalBalance - totalInvested;

    return {
      totalBalance,
      totalInvested,
      totalEarned,
    };
  };

  const { totalBalance, totalInvested, totalEarned } = calculateCompoundInterest();

  const ideas: InvestmentIdea[] = [
    {
      id: "sharia-etfs",
      title: "Sharia-Compliant ETFs & Mutual Funds",
      category: "Halal Equities",
      icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
      shortDesc: "Invest in screened global equities that exclude prohibited business activities and high debt interest structures.",
      longDesc: "Sharia-compliant equities are screened according to Islamic finance rules. These screens exclude businesses involved in conventional financial services (interest/Riba), alcohol, weapons, gambling, tobacco, pork products, and adult entertainment. They also limit leverage by filtering out companies with high interest-bearing debt ratios. Popular funds include SPUS, HLAL, and SPSK, which hold stocks like Apple, Microsoft, and other compliant giants.",
      difficulty: "Beginner",
      estimatedReturn: "8% - 10% annual profit",
      tips: [
        "Ensure the fund has an active, recognized Sharia Supervisory Board approval.",
        "Purify minor non-compliant income parts annually through charity (Sadaqah purification).",
        "Reinvest distributed dividends automatically to speed up compound profit growth.",
      ],
    },
    {
      id: "mudarabah-wakala",
      title: "Wakala & Mudarabah Profit Sharing",
      category: "Islamic Banking",
      icon: <Landmark className="w-6 h-6 text-emerald-500" />,
      shortDesc: "Deposit funds in profit-sharing savings accounts structured under Sharia agency or partnership contracts.",
      longDesc: "In Islamic finance, conventional interest-bearing deposits are prohibited. Instead, Sharia-compliant savings accounts use Wakala (where you appoint the bank as an agent to invest your money in Halal projects for a target profit) or Mudarabah (a profit-and-loss sharing partnership). Returns are structured as a share of actual trade/investment profits rather than a fixed guaranteed interest rate.",
      difficulty: "Beginner",
      estimatedReturn: "4% - 5.5% annual yield",
      tips: [
        "Inquire about target profit rates at Sharia-certified local Saudi banks.",
        "Verify that the account is structured under Wakala or Mudarabah guidelines.",
        "Allocate short-term cash reserves and emergency funds here for safety.",
      ],
    },
    {
      id: "halal-dca",
      title: "Recurring Halal Investing (DCA)",
      category: "Growth Strategy",
      icon: <Shuffle className="w-6 h-6 text-purple-500" />,
      shortDesc: "Mitigate market volatility by investing fixed sums in Sharia-compliant assets on a recurring schedule.",
      longDesc: "Dollar-Cost Averaging (DCA) is a highly recommended risk management strategy under Islamic principles, as it minimizes speculative trading (Gharar) and emotional market-timing. By consistently allocating a fixed Riyal amount into Halal assets (e.g., gold ETFs or Sharia-compliant equities) periodically, you buy more shares when prices drop and fewer when prices rise.",
      difficulty: "Intermediate",
      estimatedReturn: "Market Dependent",
      tips: [
        "Automate recurring transfers into Halal brokerages to cultivate consistent habits.",
        "Maintain a long-term investment horizon (5 to 10+ years) to smooth market fluctuations.",
        "Calculate and pay Zakat (2.5%) annually on the net Zakatable value of your portfolio.",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Interactive Calculator widget */}
      <div className="glass-panel p-6 overflow-hidden relative">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border-custom pb-3 mb-4">
          <Calculator className="w-5 h-5 text-accent-custom" />
          Sharia-Compliant Growth Simulator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 text-xs font-semibold text-text-secondary">
            {/* Initial Investment */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-bold">
                <span>Initial Capital</span>
                <span className="text-text-primary font-black">SAR {principal.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-1.5 bg-border-custom/50 rounded-lg appearance-none cursor-pointer accent-accent-custom"
              />
            </div>

            {/* Monthly Contribution */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-bold">
                <span>Monthly Contribution</span>
                <span className="text-text-primary font-black">SAR {monthlyContribution.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full h-1.5 bg-border-custom/50 rounded-lg appearance-none cursor-pointer accent-accent-custom"
              />
            </div>

            {/* Annual Rate */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-bold">
                <span>Expected Profit Rate</span>
                <span className="text-text-primary font-black">{annualRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full h-1.5 bg-border-custom/50 rounded-lg appearance-none cursor-pointer accent-accent-custom"
              />
            </div>

            {/* Years */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-bold">
                <span>Time Period</span>
                <span className="text-text-primary font-black">{years} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full h-1.5 bg-border-custom/50 rounded-lg appearance-none cursor-pointer accent-accent-custom"
              />
            </div>
          </div>

          {/* Results Visuals */}
          <div className="flex flex-col justify-between p-4 bg-accent-custom-bg/10 border border-accent-custom/15 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                Simulated Capital
              </span>
              <span className="text-3xl font-black text-accent-custom tracking-tight">
                SAR {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border-custom">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-text-secondary font-semibold uppercase">
                  Total Contributed
                </span>
                <span className="text-sm font-bold text-text-primary">
                  SAR {totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-text-secondary font-semibold uppercase">
                  Estimated Profit Share
                </span>
                <span className="text-sm font-bold text-success-custom">
                  SAR {totalEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational cards */}
      <div className="flex flex-col gap-4">
        {ideas.map((idea) => {
          const isExpanded = expandedId === idea.id;

          return (
            <div
              key={idea.id}
              className="glass-panel p-5 flex flex-col gap-3 group relative cursor-pointer overflow-hidden transition-all duration-300"
              onClick={() => setExpandedId(isExpanded ? null : idea.id)}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-bg-card border border-border-custom shadow-xs rounded-2xl group-hover:scale-105 transition-transform duration-300">
                    {idea.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-accent-custom uppercase tracking-wider">
                      {idea.category}
                    </span>
                    <h3 className="text-md font-extrabold text-text-primary tracking-tight mt-0.5">
                      {idea.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                      idea.difficulty === "Beginner"
                        ? "bg-green-500/10 text-green-500"
                        : idea.difficulty === "Intermediate"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {idea.difficulty}
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs text-text-secondary font-semibold leading-relaxed mt-1">
                {idea.shortDesc}
              </p>

              {/* Expanded content */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col gap-3 ${
                  isExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-border-custom pt-3 text-xs text-text-secondary font-medium leading-relaxed">
                  {idea.longDesc}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">
                    Key Tips:
                  </span>
                  <ul className="flex flex-col gap-1.5 pl-1.5 list-none">
                    {idea.tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-text-secondary font-medium flex items-start gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-accent-custom shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 mt-1 border-t border-border-custom/50 font-bold">
                  <span className="text-text-secondary">Est. Return rate:</span>
                  <span className="text-accent-custom flex items-center gap-1 font-black">
                    <Percent className="w-3.5 h-3.5" />
                    {idea.estimatedReturn}
                  </span>
                </div>
              </div>

              {/* Tap to expand Hint */}
              <div className="flex items-center justify-end text-[9px] font-bold text-text-tertiary gap-1 group-hover:text-accent-custom transition-colors">
                <HelpCircle className="w-3 h-3" />
                <span>{isExpanded ? "Click to collapse" : "Click to read details"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvestmentCard;
