import React from "react";
import type { Transaction } from "../services/onedrive";
import { CATEGORIES } from "./TransactionForm";

interface WeeklyReportProps {
  transactions: Transaction[];
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ transactions }) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyTx = transactions.filter((t) => new Date(`${t.date}T00:00:00`) >= sevenDaysAgo);

  const totalIncome = weeklyTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = weeklyTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalSaved = totalIncome - totalExpense;

  // Category spending
  const categorySpending: { [key: string]: number } = {};
  weeklyTx.filter((t) => t.type === "expense").forEach((t) => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });

  const totalExpenseAllTime = Object.values(categorySpending).reduce((a, b) => a + b, 0);
  const categoryBreakdown = Object.keys(categorySpending)
    .map((catName) => {
      const amount = categorySpending[catName];
      const percentage = totalExpenseAllTime > 0 ? (amount / totalExpenseAllTime) * 100 : 0;
      const catDetails = CATEGORIES.find((c) => c.name === catName) || { icon: "❓", color: "text-gray-500 bg-gray-500/10" };
      return { name: catName, amount, percentage, icon: catDetails.icon, color: catDetails.color };
    })
    .sort((a, b) => b.amount - a.amount);

  // Daily spending for bar chart
  const getPastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  const pastSevenDays = getPastSevenDays();
  const dailyData = pastSevenDays.map((dateStr) => {
    const dayName = new Date(dateStr).toLocaleDateString(undefined, { weekday: "short" });
    const dayExpenses = transactions
      .filter((t) => t.date === dateStr && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { date: dateStr, dayName, amount: dayExpenses };
  });
  const maxDailyExpense = Math.max(...dailyData.map((d) => d.amount), 10);

  const fmtCurrency = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Donut params
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const donutColors = ["#17171c", "#003c33", "#ff7759", "#1863dc", "#93939f", "#ffad9b", "#f59e0b", "#75758a"];

  // Pre-compute cumulative percent offsets to avoid mutating a variable inside JSX map (React Strict Mode safe)
  const cumulativeOffsets = categoryBreakdown.reduce<number[]>((acc, _cat, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + categoryBreakdown[i - 1].percentage);
    return acc;
  }, []);

  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Weekly Report</h2>
        <span className="text-[11px] text-text-tertiary">Last 7 days</span>
      </div>

      {/* Compact stat row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-bg-elevated flex flex-col gap-0.5">
          <span className="text-[11px] text-text-tertiary font-medium">Spent</span>
          <span className="text-lg font-bold tabular-nums text-expense-custom">
            SAR {fmtCurrency(totalExpense)}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-bg-elevated flex flex-col gap-0.5">
          <span className="text-[11px] text-text-tertiary font-medium">Saved</span>
          <span className={`text-lg font-bold tabular-nums ${totalSaved >= 0 ? "text-success-custom" : "text-expense-custom"}`}>
            SAR {fmtCurrency(totalSaved)}
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-text-tertiary font-medium">Daily Spending</span>
        <div className="w-full h-28 flex items-end justify-between gap-1 pt-2 pb-1">
          {dailyData.map((day, i) => {
            const pctHeight = (day.amount / maxDailyExpense) * 100;
            const isToday = i === dailyData.length - 1;
            return (
              <div key={day.date} className="flex flex-col items-center flex-1 gap-1.5 h-full justify-end group cursor-default">
                <div className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-text-secondary tabular-nums transition-opacity duration-200">
                  {day.amount > 0 ? fmtCurrency(day.amount) : "—"}
                </div>
                <div
                  style={{ height: `${Math.max(pctHeight, 3)}%` }}
                  className={`w-full max-w-[16px] rounded-md transition-all duration-500 ${
                    isToday
                      ? "bg-accent-custom"
                      : "bg-accent-custom/25 group-hover:bg-accent-custom/50"
                  }`}
                />
                <span className={`text-[10px] font-medium ${isToday ? "text-accent-custom" : "text-text-tertiary"}`}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs text-text-tertiary font-medium">Categories</span>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Donut */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth="8" />
                {categoryBreakdown.map((cat, i) => {
                  const strokeOffset = circumference - (cat.percentage / 100) * circumference;
                  const currentAccumulated = cumulativeOffsets[i];
                  return (
                    <circle
                      key={cat.name}
                      cx="50" cy="50" r={radius}
                      fill="transparent"
                      stroke={donutColors[i % donutColors.length]}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      transform={`rotate(${(currentAccumulated / 100) * 360} 50 50)`}
                      className="transition-all duration-1000"
                    />
                  );
                })}
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[9px] text-text-tertiary">Total</span>
                <span className="text-xs font-bold text-text-primary tabular-nums">{totalExpense.toFixed(0)}</span>
              </div>
            </div>

            {/* Category list */}
            <div className="flex-1 w-full flex flex-col gap-2">
              {categoryBreakdown.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: donutColors[i % donutColors.length] }} />
                  <span className="text-xs font-medium text-text-primary flex-1">{cat.name}</span>
                  <span className="text-xs font-semibold text-text-secondary tabular-nums">
                    {fmtCurrency(cat.amount)}
                  </span>
                  <span className="text-[10px] text-text-tertiary tabular-nums w-10 text-right">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReport;
