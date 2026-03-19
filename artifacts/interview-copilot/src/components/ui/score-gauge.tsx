import { motion } from "framer-motion";
import { cn, getScoreColor } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number; // 0-10
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreGauge({ score, label, className, size = "md" }: ScoreGaugeProps) {
  const percentage = (score / 10) * 100;
  const radius = size === "sm" ? 20 : size === "md" ? 30 : 40;
  const stroke = size === "sm" ? 4 : size === "md" ? 6 : 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className="-rotate-90 transform"
        >
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <motion.circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={cn("transition-colors duration-500", getScoreColor(score))}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={cn("font-display font-bold text-foreground", textClasses[size])}
          >
            {score.toFixed(1)}
          </motion.span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
