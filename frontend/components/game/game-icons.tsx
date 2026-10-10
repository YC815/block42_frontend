/**
 * Block42 Frontend - 遊戲圖形
 * 機器人、星星、指令圖示與顏色定義，所有遊戲畫面共用，避免各頁各畫一套。
 */

import { ArrowUp, CornerUpLeft, CornerUpRight, PaintRoller } from "lucide-react";
import type { CommandType, TileColor } from "@/types/api";

export const TILE_COLORS: Record<TileColor, { name: string; fill: string; deep: string; className: string }> = {
  R: { name: "紅", fill: "var(--tile-r)", deep: "var(--tile-r-deep)", className: "bg-tile-r" },
  G: { name: "綠", fill: "var(--tile-g)", deep: "var(--tile-g-deep)", className: "bg-tile-g" },
  B: { name: "藍", fill: "var(--tile-b)", deep: "var(--tile-b-deep)", className: "bg-tile-b" },
};

export const PAINT_COLOR: Partial<Record<CommandType, TileColor>> = {
  paint_red: "R",
  paint_green: "G",
  paint_blue: "B",
};

export const COMMAND_LABELS: Record<CommandType, string> = {
  move: "前進",
  turn_left: "左轉",
  turn_right: "右轉",
  paint_red: "塗紅",
  paint_green: "塗綠",
  paint_blue: "塗藍",
  f0: "F0",
  f1: "F1",
  f2: "F2",
};

export function describeCommand(type: CommandType, condition?: TileColor | null) {
  const base = type.startsWith("f") ? `呼叫 ${COMMAND_LABELS[type]}` : COMMAND_LABELS[type];
  return condition ? `${base}（只在${TILE_COLORS[condition].name}色地板）` : base;
}

/** 機器人：預設朝上，外層用 rotate 控制方向 */
export function RobotIcon({ className, failed = false }: { className?: string; failed?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 3 L33 31 Q34 35 30 35 L10 35 Q6 35 7 31 Z"
        fill={failed ? "#7a2226" : "#1d2433"}
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="25" r="2.6" fill="#ffffff" />
      <circle cx="24.5" cy="25" r="2.6" fill="#ffffff" />
      <circle cx="15.5" cy="24.2" r="1.1" fill="#1d2433" />
      <circle cx="24.5" cy="24.2" r="1.1" fill="#1d2433" />
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4L2.7 9.3l6.5-.7z"
        fill="var(--star)"
        stroke="var(--star-deep)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 指令圖示（不含外框），size 以 tailwind class 控制 */
export function CommandGlyph({ type, className = "h-5 w-5" }: { type: CommandType; className?: string }) {
  if (type === "move") return <ArrowUp className={className} strokeWidth={2.6} />;
  if (type === "turn_left") return <CornerUpLeft className={className} strokeWidth={2.6} />;
  if (type === "turn_right") return <CornerUpRight className={className} strokeWidth={2.6} />;
  const paint = PAINT_COLOR[type];
  if (paint) {
    return (
      <span
        className="flex h-[1.6em] w-[1.6em] items-center justify-center rounded-md text-white"
        style={{ background: TILE_COLORS[paint].fill }}
      >
        <PaintRoller className="h-[1em] w-[1em]" strokeWidth={2.4} />
      </span>
    );
  }
  return <span className="font-mono text-[0.85em] font-bold tracking-tight">{COMMAND_LABELS[type]}</span>;
}

/**
 * 指令方塊：指令 + 條件色。條件用底色呈現（和地板顏色同一套），
 * 讓「只在紅色地板上執行」一眼就看得出來。
 */
export function CommandChip({
  type,
  condition,
  size = "md",
  state = "idle",
}: {
  type: CommandType;
  condition?: TileColor | null;
  size?: "sm" | "md";
  state?: "idle" | "done" | "current";
}) {
  const dims = size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";
  const conditioned = Boolean(condition);
  const tone = conditioned
    ? "text-white border-transparent"
    : "bg-white text-ink border-line";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-lg border ${dims} ${tone} ${
        state === "done" ? "opacity-35" : ""
      } ${state === "current" ? "ring-2 ring-ink ring-offset-2 ring-offset-white" : ""}`}
      style={conditioned ? { background: TILE_COLORS[condition!].fill } : undefined}
      title={describeCommand(type, condition)}
    >
      <CommandGlyph type={type} className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}
