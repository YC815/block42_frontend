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
  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <div className="text-sm font-semibold text-gray-700">工具</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant={tool === "paint" ? "default" : "secondary"}
            onClick={() => onToolChange("paint")}
          >
            地板
          </Button>
          <Button
            variant={tool === "erase" ? "default" : "secondary"}
            onClick={() => onToolChange("erase")}
          >
            橡皮擦
          </Button>
          <Button
            variant={tool === "start" ? "default" : "secondary"}
            onClick={() => onToolChange("start")}
          >
            起點
          </Button>
          <Button
            variant={tool === "star" ? "default" : "secondary"}
            onClick={() => onToolChange("star")}
          >
            星星
          </Button>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-700">顏色</div>
        <div className="mt-2 flex items-center gap-2">
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
                className={`h-7 w-7 rounded-full ${bg} ${
                  active ? "ring-2 ring-offset-2 ring-gray-900" : "ring-0"
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
