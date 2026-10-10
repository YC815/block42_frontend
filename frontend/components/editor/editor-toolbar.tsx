/**
 * Block42 Frontend - Editor toolbar
 */

import { Eraser, PaintBucket } from "lucide-react";
import type { ReactNode } from "react";
import type { TileColor } from "@/types/api";
import { RobotIcon, StarIcon, TILE_COLORS } from "@/components/game/game-icons";

export type EditorTool = "paint" | "erase" | "start" | "star";

interface EditorToolbarProps {
  tool: EditorTool;
  color: TileColor;
  onToolChange: (tool: EditorTool) => void;
  onColorChange: (color: TileColor) => void;
}

const TOOLS: Array<{ key: EditorTool; label: string; hint: string; icon: ReactNode }> = [
  { key: "paint", label: "地板", hint: "點一下鋪上目前選的顏色", icon: <PaintBucket className="h-5 w-5" /> },
  { key: "erase", label: "清除", hint: "移除地板或星星", icon: <Eraser className="h-5 w-5" /> },
  { key: "start", label: "起點", hint: "再點一次可轉向", icon: <RobotIcon className="h-5 w-5 rotate-90" /> },
  { key: "star", label: "星星", hint: "再點一次可移除", icon: <StarIcon className="h-5 w-5" /> },
];

export function EditorToolbar({ tool, color, onToolChange, onColorChange }: EditorToolbarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-ink">工具</div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {TOOLS.map((item) => (
            <button
              key={item.key}
              type="button"
              title={item.hint}
              aria-pressed={tool === item.key}
              onClick={() => onToolChange(item.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-medium transition ${
                tool === item.key
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-ink">地板顏色</div>
        <div className="mt-2 flex items-center gap-2">
          {(["R", "G", "B"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={color === value}
              aria-label={`${TILE_COLORS[value].name}色地板`}
              onClick={() => {
                onColorChange(value);
                onToolChange("paint");
              }}
              className={`h-9 w-9 rounded-lg transition ${
                color === value ? "ring-2 ring-ink ring-offset-2" : ""
              }`}
              style={{
                background: TILE_COLORS[value].fill,
                boxShadow: `inset 0 -3px 0 ${TILE_COLORS[value].deep}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
