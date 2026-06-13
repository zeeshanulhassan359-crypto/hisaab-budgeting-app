import React, { useState } from "react";
import type { Transaction } from "../services/onedrive";
import { CATEGORIES } from "./TransactionForm";

interface CategoryExpenseChartProps {
  transactions: Transaction[];
}

export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({ transactions }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter transactions to only expenses
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  // Combine with category details
  const data = CATEGORIES.filter((c) => c.name !== "Salary") // Only expense-oriented categories
    .map((c) => {
      const amount = categoryTotals[c.name] || 0;
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        name: c.name,
        icon: c.icon,
        amount,
        percentage,
        color: c.color,
      };
    })
    .filter((d) => d.amount > 0) // Only show categories with actual spend
    .sort((a, b) => b.amount - a.amount);

  const formatCurrency = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (data.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center h-[280px] text-center">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-xs font-semibold text-text-secondary">No category expense data</p>
        <p className="text-[10px] text-text-tertiary mt-1">Record expenses to populate chart</p>
      </div>
    );
  }

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  // Category Colors Map for SVG fills
  const getCategoryColor = (name: string) => {
    switch (name) {
      case "Food": return "#ff7759"; // Coral
      case "Transport": return "#1863dc"; // Action Blue
      case "Rent & Bills": return "#17171c"; // Near-Black Primary
      case "Investments": return "#003c33"; // Deep Enterprise Green
      case "Shopping": return "#ffad9b"; // Soft Coral
      case "Entertainment": return "#071829"; // Dark Navy
      case "Gift": return "#93939f"; // Muted Slate
      default: return "#75758a"; // Slate
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <h3 className="text-sm font-bold text-text-primary">Expense Distribution</h3>
          <span className="text-[10px] text-text-tertiary">Interactive Category Weights</span>
        </div>
        <span className="text-xs font-bold text-text-secondary bg-bg-elevated px-2.5 py-1 rounded-lg">
          Total: SAR {formatCurrency(totalExpense)}
        </span>
      </div>

      {/* SVG Column Chart */}
      <div className="relative w-full h-[180px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height="100%"
          className="overflow-visible"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = maxAmount * ratio;
            return (
              <g key={idx} className="opacity-30 dark:opacity-20">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  className="text-text-tertiary"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fontWeight="bold"
                  fill="currentColor"
                  className="text-text-tertiary font-sans"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Render Columns */}
          {data.map((item, idx) => {
            const barWidth = Math.min(28, chartWidth / data.length - 12);
            const colWidth = chartWidth / data.length;
            const x = paddingLeft + idx * colWidth + (colWidth - barWidth) / 2;
            const barHeight = (item.amount / maxAmount) * chartHeight;
            const y = paddingTop + chartHeight - barHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.name}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover helper rect for wider target */}
                <rect
                  x={paddingLeft + idx * colWidth}
                  y={paddingTop}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Column Bar with premium gradient colors */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 4)}
                  rx="6"
                  fill={getCategoryColor(item.name)}
                  opacity={hoveredIndex === null || isHovered ? 0.95 : 0.4}
                  className="transition-all duration-300"
                />

                {/* Interactive Top Value Label */}
                {isHovered && (
                  <g className="animate-fade-in animate-duration-200">
                    <rect
                      x={x + barWidth / 2 - 40}
                      y={y - 24}
                      width="80"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 12}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="black"
                      fill="#ffffff"
                    >
                      SAR {item.amount.toFixed(0)}
                    </text>
                  </g>
                )}

                {/* Icon Label above the category text */}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="middle"
                  fontSize="10"
                >
                  {item.icon}
                </text>

                {/* Category Text Label */}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 26}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight={isHovered ? "bold" : "medium"}
                  fill="currentColor"
                  className={`${isHovered ? "text-text-primary" : "text-text-secondary"} font-sans`}
                >
                  {item.name.length > 8 ? `${item.name.substring(0, 6)}..` : item.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Weight Legends Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border-custom">
        {data.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2 rounded-xl border flex flex-col text-left transition-all duration-300 cursor-pointer ${
                isHovered
                  ? "bg-bg-elevated border-accent-custom"
                  : "bg-bg-elevated/40 border-transparent"
              }`}
            >
              <span className="text-[10px] text-text-secondary font-bold truncate flex items-center gap-1">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </span>
              <span className="text-xs font-bold text-text-primary mt-1 tabular-nums">
                SAR {formatCurrency(item.amount)}
              </span>
              <span className="text-[9px] text-text-tertiary mt-0.5 font-bold tabular-nums">
                {item.percentage.toFixed(1)}% weight
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryExpenseChart;
