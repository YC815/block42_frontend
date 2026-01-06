/**
 * Block42 Frontend - Editor toolbar
 */

import { Button } from "@/components/ui/button";
import type { TileColor } from "@/types/api";

export type EditorTool = "paint" | "erase" | "start" | "star";

interface EditorToolbarProps {
  tool: EditorTool;
  color: TileColor;
  onToolChange: (tool: EditorTool) => void;
  onColorChange: (color: TileColor) => void;
}

export function EditorToolbar({
  tool,
  color,
  onToolChange,
  onColorChange,
}: EditorToolbarProps) {
  const buttonClass = (active: boolean) =>
    active
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <div className="space-y-4 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          工具
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant={tool === "paint" ? "default" : "secondary"}
            className={buttonClass(tool === "paint")}
            onClick={() => onToolChange("paint")}
          >
            地板
          </Button>
          <Button
            variant={tool === "erase" ? "default" : "secondary"}
            className={buttonClass(tool === "erase")}
            onClick={() => onToolChange("erase")}
          >
            橡皮擦
          </Button>
          <Button
            variant={tool === "start" ? "default" : "secondary"}
            className={buttonClass(tool === "start")}
            onClick={() => onToolChange("start")}
          >
            起點
          </Button>
          <Button
            variant={tool === "star" ? "default" : "secondary"}
            className={buttonClass(tool === "star")}
            onClick={() => onToolChange("star")}
          >
            星星
          </Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          顏色
        </div>
        <div className="mt-3 flex items-center gap-2">
          {["R", "G", "B"].map((value) => {
            const tileColor = value as TileColor;
            const bg =
              tileColor === "R"
                ? "bg-rose-500"
                : tileColor === "G"
                  ? "bg-emerald-500"
                  : "bg-sky-500";
            const active = color === tileColor;
            return (
              <button
                key={value}
                type="button"
                className={`h-8 w-8 rounded-full ${bg} ${
                  active ? "ring-2 ring-offset-2 ring-slate-900/80" : "ring-0"
                }`}
                onClick={() => onColorChange(tileColor)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
